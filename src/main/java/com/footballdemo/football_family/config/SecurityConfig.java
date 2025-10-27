package com.footballdemo.football_family.config;


import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;

@Configuration
public class SecurityConfig {

    /**
     * 🔒 Configuration REST API — pour les routes /api/**
     * Renvoie 401 Unauthorized si non authentifié, sans redirection.
     */
    @Bean
    public SecurityFilterChain apiSecurityFilterChain(HttpSecurity http) throws Exception {
        http
            .securityMatcher("/api/**", "/ws/**") // 👉 s'applique uniquement aux routes API
            .authorizeHttpRequests(auth -> auth
                .anyRequest().authenticated() // toutes les routes API nécessitent une auth
            )
            .exceptionHandling(ex -> ex
                // ✅ renvoie 401 au lieu de 302
                .authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED))
            )
            .csrf(csrf -> csrf.disable()); // simplifie les appels REST (tu as déjà CSRF côté web)

        return http.build();
    }

    /**
     * 🌐 Configuration Web classique — pour le site (formulaires, pages HTML)
     * Conserve le comportement normal avec login/logout.
     */
    @Bean
    public SecurityFilterChain webSecurityFilterChain(HttpSecurity http) throws Exception {
        http
            .securityMatcher("/**") // 👉 tout le reste
           .authorizeHttpRequests(auth -> auth
    .requestMatchers(
        "/",
        "/login",
        "/register",
        "/css/**",
        "/js/**",
        "/images/**",
        "/webjars/**",
        "/h2-console/**"
    ).permitAll() // public
    .anyRequest().authenticated() // le reste nécessite connexion
)
            .formLogin(form -> form
                .loginPage("/login")
                .loginProcessingUrl("/login")
                .defaultSuccessUrl("/videos/list", true)
                .failureUrl("/login?error=true")
                .permitAll()
            )
            .logout(logout -> logout
                .logoutUrl("/logout")
                .logoutSuccessUrl("/login?logout=true")
                .permitAll()
            )
            .csrf(csrf -> csrf
                .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
                .ignoringRequestMatchers("/h2-console/**", "/ws/**", "/api/**")
            )
            .headers(headers -> headers.frameOptions(frame -> frame.disable())); // H2-console

        return http.build();
    }

    /**
     * 🔐 Bean PasswordEncoder pour l'encodage des mots de passe
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}