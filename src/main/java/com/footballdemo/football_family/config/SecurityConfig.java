package com.footballdemo.football_family.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;


import com.footballdemo.football_family.security.JwtAuthenticationFilter;
import com.footballdemo.football_family.service.CustomUserDetailsService;

@Configuration
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    @Autowired
    private JwtAuthenticationFilter jwtAuthFilter;

    @Autowired
    private CustomUserDetailsService userDetailsService;

   @Value("${app.mode-dev:false}")

    private boolean modeDev;

    // Password encoder
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // Authentication Manager
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    // Authentication Provider
    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    // =====================================================================
    // 🔥 1. API JWT Security (stateless)
    // =====================================================================
    @Bean
    @Order(1)
    public SecurityFilterChain apiSecurity(HttpSecurity http) throws Exception {

        http
                .securityMatcher("/api/**")
                .authenticationProvider(authenticationProvider())
                .authorizeHttpRequests(auth -> {

                    // -------------------------------------------
                    // 🔓 MODE DEV — tout est ouvert pour travailler
                    // -------------------------------------------
                    if (modeDev) {
                        auth.requestMatchers("/api/**").permitAll();
                        return;
                    }

                    // -------------------------------------------
                    // 🔒 MODE PROD — RÈGLES STRICTES
                    // -------------------------------------------
                    auth
                            // AUTH
                            .requestMatchers("/api/auth/**").permitAll()

                            // PUBLIC
                            .requestMatchers("/api/events/public/**").permitAll()
                            .requestMatchers("/api/events/tournament/**").permitAll()
                            .requestMatchers("/api/events/*/matches").permitAll()

                            // ADMIN UTF
                            .requestMatchers("/api/events/admin/**")
                            .hasRole("SUPER_ADMIN")

                            // ORGANIZER & CLUB
                           .requestMatchers(HttpMethod.POST, "/api/events/manage/**").authenticated()
.requestMatchers("/api/events/manage/**").hasAnyRole("SUPER_ADMIN", "CLUB_ADMIN", "COACH")


                            // CLUB ONLY (register-team)
                            .requestMatchers(HttpMethod.POST,
                                    "/api/events/registration/*/register-team")
                            .hasAnyRole("SUPER_ADMIN", "CLUB_ADMIN", "COACH", "MANAGER")

                            // INSCRIPTION INDIVIDUELLE
                            .requestMatchers(HttpMethod.POST, "/api/events/registration")
                            .hasAnyRole("PLAYER", "USER")

                            // MES INSCRIPTIONS
                            .requestMatchers("/api/events/registration/me").authenticated()

                            // VIDEOS
                            .requestMatchers("/api/videos/feed", "/api/videos/public/**").permitAll()

                            // LIVE
                            .requestMatchers(HttpMethod.GET, "/api/live/all").authenticated()
                                        // TOURNAMENT ADMIN (CLUB_ADMIN autorisé)
.requestMatchers("/api/tournament/admin/**")
.hasAnyRole("SUPER_ADMIN", "CLUB_ADMIN")

                            // Default
                            .anyRequest().authenticated();
                })
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(ex -> ex.authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)))
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
                .csrf(csrf -> csrf.disable());

        return http.build();
    }

    // =====================================================================
    // 🌍 2. MVC Security (SPA + static + WebSocket)
    // =====================================================================
    @Bean
    @Order(2)
    public SecurityFilterChain webSecurity(HttpSecurity http) throws Exception {

        http
                .securityMatcher("/**")
                .authenticationProvider(authenticationProvider())
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/ws/**").permitAll()
                        .requestMatchers("/topic/**").permitAll()
                        .requestMatchers("/app/**").permitAll()
              
                        .requestMatchers("/", "/home", "/login", "/register",
                                "/app/**", "/assets/**", "/css/**", "/js/**", "/images/**",
                                "/favicon.ico", "/manifest.json",
                                "/service-worker.js", "/service-worker-register.js",
                                "/webjars/**", "/h2-console/**", "/.well-known/**"
                        ).permitAll()
                        .anyRequest().permitAll()
                )
                .formLogin(form -> form.disable())
                .logout(logout -> logout.disable())
                .csrf(csrf -> csrf
                        .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
                        .ignoringRequestMatchers(
                                "/api/**", "/ws/**", "/topic/**",
                                "/assets/**", "/app/**", "/h2-console/**"
                        )
                )
                .headers(headers -> headers.frameOptions(frame -> frame.disable()));

        return http.build();
    }



}
