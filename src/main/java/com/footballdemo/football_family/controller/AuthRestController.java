package com.footballdemo.football_family.controller;

import com.footballdemo.football_family.dto.JwtResponse; // Assurez-vous d'avoir ce DTO
import com.footballdemo.football_family.dto.LoginRequest; // Assurez-vous d'avoir ce DTO
import com.footballdemo.football_family.security.JwtService; // Assurez-vous d'avoir cette classe
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController // ⬅️ C'est CRUCIAL
@RequestMapping("/api/auth") // ⬅️ Mappage général pour /api/auth/...
@RequiredArgsConstructor
public class AuthRestController {

    // Assurez-vous d'injecter tous les composants nécessaires à la connexion JWT
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    // ... autres services si besoin

    @PostMapping("/login") // ⬅️ Mappage spécifique /api/auth/login
    public ResponseEntity<?> authenticateUser(@RequestBody LoginRequest loginRequest) {

        // 1. Authentification via Spring Security
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);

        // 2. Génération du JWT
        UserDetails userDetails = (UserDetails) authentication.getPrincipal(); // ⬅️ Extrait le UserDetails
        String jwt = jwtService.generateToken(userDetails);

        // 3. Réponse
        return ResponseEntity.ok(new JwtResponse(jwt, loginRequest.getUsername()));
    }
}