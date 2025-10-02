package com.footballdemo.football_family.config;


import com.footballdemo.football_family.service.CustomUserDetailsService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod; // Ajout de l'import HttpMethod
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository; // Ajout de l'import CSRF

@Configuration
public class SecurityConfig {

    private final CustomUserDetailsService userDetailsService;

    public SecurityConfig(CustomUserDetailsService userDetailsService) {
        this.userDetailsService = userDetailsService;
    }

   @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/", "/register", "/css/**", "/videos/feed**").permitAll()
                .requestMatchers("/h2-console/**").permitAll()
                .requestMatchers("/admin/**").hasRole("ADMIN")

                // NOUVEAU: Autoriser les requêtes POST, PUT et DELETE uniquement aux utilisateurs authentifiés
                .requestMatchers(HttpMethod.POST, "/videos/**").authenticated() // Upload, Likes, Commentaires
                .requestMatchers(HttpMethod.PUT, "/videos/comments/**").authenticated() // Édition de commentaires
                .requestMatchers(HttpMethod.DELETE, "/videos/comments/**").authenticated() // Suppression de commentaires
                .requestMatchers(HttpMethod.PUT, "/videos/**").authenticated() // Édition de vidéo
                .requestMatchers(HttpMethod.DELETE, "/videos/**").authenticated() // Suppression de vidéo
                
                // Le reste doit être authentifié (ex: /profile, /matches, /trainings)
                .anyRequest().authenticated()
            )
            .formLogin(form -> form
                .loginPage("/login")
                .defaultSuccessUrl("/", true)
                .permitAll()
            )
            .logout(logout -> logout
                .logoutUrl("/logout")
                .logoutSuccessUrl("/")
                .permitAll()
            )
            // CORRECTION CRUCIALE DU CSRF POUR LES REQUÊTES AJAX/JS
            .csrf(csrf -> csrf
                // Permet au JavaScript de lire le jeton CSRF pour l'envoyer dans les en-têtes (comme nous le faisons dans feed.html)
                .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
                // Nous ignorons toujours le CSRF pour H2 et le WS car ils ne suivent pas la méthode standard
                .ignoringRequestMatchers("/h2-console/**", "/ws/**") 
            )
            .headers(headers -> headers
                .frameOptions(frame -> frame.sameOrigin())
            );

        return http.build();
    }


    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}