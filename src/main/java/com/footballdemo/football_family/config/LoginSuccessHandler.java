package com.footballdemo.football_family.config;



import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class LoginSuccessHandler implements AuthenticationSuccessHandler {

    @Override
    public void onAuthenticationSuccess(
        HttpServletRequest request,
        HttpServletResponse response,
        Authentication authentication) throws IOException, ServletException 
    {
        // 1. Mettre un indicateur dans la session pour signaler la connexion réussie
        // Ce flag sera lu côté client par votre JavaScript.
        request.getSession().setAttribute("justLoggedIn", true);

        // 2. Redirection vers la page d'accueil (ou l'URL par défaut)
        // Ceci remplace .defaultSuccessUrl("/", true)
        response.sendRedirect("/"); 
    }
}