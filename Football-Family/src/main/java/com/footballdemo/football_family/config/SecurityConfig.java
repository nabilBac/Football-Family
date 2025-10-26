package com.footballdemo.football_family.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;

@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http
            // 🔐 Autorisations
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(
                    "/login",
                    "/register",
                    "/css/**",
                    "/js/**",
                    "/images/**",
                    "/webjars/**"
                ).permitAll() // ✅ accès public
                .anyRequest().authenticated() // le reste nécessite une connexion
            )

            // 🔑 Configuration du login
            .formLogin(form -> form
                .loginPage("/login")       // page personnalisée
                .loginProcessingUrl("/login") // POST du formulaire
                .defaultSuccessUrl("/videos/list", true) // redirection après succès
                .failureUrl("/login?error=true")
                .permitAll()
            )

            // 🚪 Déconnexion
            .logout(logout -> logout
                .logoutUrl("/logout")
                .logoutSuccessUrl("/login?logout=true")
                .permitAll()
            )

            // 🧿 Protection CSRF (nécessaire pour les formulaires)
            .csrf(csrf -> csrf
                .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
                .ignoringRequestMatchers("/h2-console/**", "/ws/**")
            );

        // 💾 Autoriser le H2-console (si tu l’utilises)
        http.headers(headers -> headers.frameOptions(frame -> frame.disable()));

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}

