package com.footballdemo.football_family.config;

import org.springframework.beans.factory.annotation.Autowired;
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
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;

import com.footballdemo.football_family.security.JwtAuthenticationFilter;
import com.footballdemo.football_family.service.CustomUserDetailsService;

@Configuration
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

        @Autowired
        private AuthenticationSuccessHandler loginSuccessHandler;

        @Autowired
        private JwtAuthenticationFilter jwtAuthFilter;

        @Autowired
        private CustomUserDetailsService userDetailsService;

        /**
         * 🔐 Bean PasswordEncoder pour l'encodage des mots de passe
         */
        @Bean
        public PasswordEncoder passwordEncoder() {
                return new BCryptPasswordEncoder();
        }

        /**
         * 🔑 AuthenticationManager
         */
        @Bean
        public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
                return config.getAuthenticationManager();
        }

        /**
         * 🛡️ AuthenticationProvider avec UserDetailsService
         */
        @Bean
        public AuthenticationProvider authenticationProvider() {
                DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
                provider.setUserDetailsService(userDetailsService);
                provider.setPasswordEncoder(passwordEncoder());
                return provider;
        }

        /**
         * 🔒 Configuration REST API — pour les routes /api/**
         * Renvoie 401 Unauthorized si non authentifié, sans redirection.
         */
        @Bean
        @Order(1)
        public SecurityFilterChain apiSecurityFilterChain(HttpSecurity http) throws Exception {
                http
                                .securityMatcher("/api/**", "/ws/**")
                                .authorizeHttpRequests(auth -> auth
                                                // 🔓 Endpoints publics
                                                .requestMatchers("/api/auth/**").permitAll()
                                                .requestMatchers("/ws/**").permitAll()
                                                .requestMatchers("/api/events/all").permitAll()
                                                .requestMatchers("/api/events/filter").permitAll()
                                                .requestMatchers("/api/events/{id}").permitAll()
                                                .requestMatchers("/api/clubs/all").permitAll()
                                                .requestMatchers("/api/clubs/verified").permitAll()
                                                .requestMatchers("/api/clubs/search").permitAll()
                                                .requestMatchers("/api/clubs/{id}").permitAll()
                                                .requestMatchers("/api/events/*/register").permitAll()

                                                // 🔒 Endpoints protégés par rôle
                                                .requestMatchers(HttpMethod.POST, "/api/events")
                                                .hasAnyRole("COACH", "CLUB_ADMIN", "ORGANIZER", "SUPER_ADMIN")

                                                .requestMatchers("/api/events/update/**")
                                                .hasAnyRole("COACH", "CLUB_ADMIN", "ORGANIZER", "SUPER_ADMIN")
                                                .requestMatchers("/api/events/delete/**")
                                                .hasAnyRole("COACH", "CLUB_ADMIN", "ORGANIZER", "SUPER_ADMIN")
                                                .requestMatchers("/api/events/*/register").authenticated()

                                                // 🏢 Endpoints clubs
                                                .requestMatchers("/api/clubs/register").authenticated()
                                                .requestMatchers("/api/clubs/verify/**").hasRole("SUPER_ADMIN")
                                                .requestMatchers("/api/clubs/reject/**").hasRole("SUPER_ADMIN")
                                                .requestMatchers("/api/clubs/my-club").authenticated()
                                                .requestMatchers("/api/clubs/update/**")
                                                .hasAnyRole("CLUB_ADMIN", "SUPER_ADMIN")

                                                // 🔐 Tous les autres endpoints nécessitent authentification
                                                .anyRequest().authenticated())
                                .exceptionHandling(ex -> ex
                                                .authenticationEntryPoint(
                                                                new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)))
                                .sessionManagement(session -> session
                                                .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)) // ⬅️
                                                                                                           // CHANGEMENT
                                                                                                           // CLÉ
                                .authenticationProvider(authenticationProvider())
                                // Le filtre JWT reste, mais la session est lue en priorité par les filtres de
                                // base de Spring Security.
                                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
                                .csrf(csrf -> csrf.disable());

                return http.build();
        }

        /**
         * 🌐 Configuration Web classique — pour le site (formulaires, pages HTML)
         * Conserve le comportement normal avec login/logout.
         */
        @Bean
        @Order(2)
        public SecurityFilterChain webSecurityFilterChain(HttpSecurity http) throws Exception {
                http
                                .securityMatcher("/**")
                                .authorizeHttpRequests(auth -> auth
                                                .requestMatchers(
                                                                "/",
                                                                "/login",
                                                                "/register",
                                                                "/home",
                                                                "/events",
                                                                "/clubs",
                                                                "/css/**",
                                                                "/js/**",
                                                                "/images/**",
                                                                "/webjars/**",
                                                                "/h2-console/**",
                                                                "/favicon.ico")
                                                .permitAll()
                                                .anyRequest().authenticated())
                                .formLogin(form -> form
                                                .loginPage("/login")
                                                .loginProcessingUrl("/login")
                                                .successHandler(loginSuccessHandler)
                                                .failureUrl("/login?error=true")
                                                .permitAll())
                                .logout(logout -> logout
                                                .logoutUrl("/logout")
                                                .logoutSuccessUrl("/login?logout=true")
                                                .permitAll())
                                .csrf(csrf -> csrf
                                                .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
                                                .ignoringRequestMatchers("/h2-console/**", "/ws/**", "/api/**"))
                                .headers(headers -> headers
                                                .frameOptions(frame -> frame.disable())
                                                .cacheControl(cache -> cache.disable()));

                return http.build();
        }
}