package com.footballdemo.football_family.config;



import org.springframework.boot.autoconfigure.security.servlet.PathRequest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.configuration.WebSecurityCustomizer;

@Configuration
public class WebSecurityCustomizerConfig {

 @Bean
 public WebSecurityCustomizer webSecurityCustomizer() {
 return (web) -> web.ignoring()
 // 1. Exclut toutes les ressources statiques standard (CSS, JS, Images, etc.)
 .requestMatchers(PathRequest.toStaticResources().atCommonLocations())
            // 2. CORRECTION AJOUTÉE : Exclut explicitement le dossier /assets/
            .requestMatchers("/assets/**") 
 // 3. Le chemin /icons/** est probablement redondant si vous avez /assets/**,
            // mais nous le laissons si vous avez des icons à la racine /static/icons/
 .requestMatchers("/icons/**") 
 // 4. Exclut explicitement /favicon.ico pour plus de sûreté
 .requestMatchers("/favicon.ico");
 }
}