package com.footballdemo.football_family.security;

import com.footballdemo.football_family.service.CustomUserDetailsService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private JwtService jwtService;

    @Autowired
    private CustomUserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        // 🔍 Récupère le header Authorization
        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String userEmail;

        // ❌ Pas de token Bearer, on continue sans authentification
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        // ✂️ Extrait le token (enlève "Bearer ")
        jwt = authHeader.substring(7);

        try {
            // 📧 Extrait l'email du token
            userEmail = jwtService.extractUsername(jwt);

            // 🔐 Si l'email existe et qu'il n'y a pas déjà d'authentification
            if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {

                // 👤 Charge les détails de l'utilisateur
                UserDetails userDetails = userDetailsService.loadUserByUsername(userEmail);

                // ✅ Valide le token
                if (jwtService.isTokenValid(jwt, userDetails)) {

                    // 🎫 Crée l'authentification
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            userDetails.getAuthorities());

                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                    // 💾 Enregistre l'authentification dans le contexte Spring Security
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            }
        } catch (Exception e) {
            // ❌ Token invalide ou expiré, on continue sans authentification
            logger.error("JWT authentication failed: " + e.getMessage());
        }

        // ➡️ Continue la chaîne de filtres
        filterChain.doFilter(request, response);
    }
}