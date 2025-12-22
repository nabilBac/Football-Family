package com.footballdemo.football_family.controller.api;

import com.footballdemo.football_family.dto.*;
import com.footballdemo.football_family.model.User;
import com.footballdemo.football_family.security.JwtService;
import com.footballdemo.football_family.service.UserMapper;
import com.footballdemo.football_family.service.UserService;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin("*") // 🔥 en prod => mettre ton domaine
public class AuthRestController {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserService userService;
    private final UserMapper userMapper;

    // ========================================================
    // 🔐 LOGIN (JWT : access + refresh)
    // ========================================================
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getUsername(),
                            loginRequest.getPassword()));

            User user = userService.findUserForAuth(authentication.getName());

            UserDTO dto = userMapper.toDTO(user);

            return ResponseEntity.ok(
                    new AuthResponse(
                            jwtService.generateAccessToken(user),
                            jwtService.generateRefreshToken(user),
                            dto));

        } catch (BadCredentialsException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ErrorResponse("Nom d'utilisateur ou mot de passe incorrect"));
        }
    }

    // ========================================================
    // 🔐 REGISTER (retourne aussi JWT)
    // ========================================================
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest req) {

        try {
            User user = userService.registerUser(req);
            UserDTO dto = userMapper.toDTO(user);

            return ResponseEntity.ok(
                    new AuthResponse(
                            jwtService.generateAccessToken(user),
                            jwtService.generateRefreshToken(user),
                            dto));

        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse(ex.getMessage()));
        }
    }

    // ========================================================
    // 🔁 REFRESH TOKEN
    // ========================================================
    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(@RequestBody RefreshRequest req) {

        String refreshToken = req.getRefreshToken();

        if (!jwtService.isRefreshTokenValid(refreshToken)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ErrorResponse("Refresh token expiré ou invalide"));
        }

        String username = jwtService.extractUsername(refreshToken);
       User user = userService.findUserForAuth(username);

        UserDTO dto = userMapper.toDTO(user);

        return ResponseEntity.ok(
                new AuthResponse(
                        jwtService.generateAccessToken(user),
                        jwtService.generateRefreshToken(user), // 🔥 on en génère un nouveau
                        dto));
    }

    // ========================================================
    // 🧍 RETURN CURRENT USER (depuis JWT)
    // ========================================================
    @GetMapping("/me")
    public ResponseEntity<?> me(Authentication authentication) {

        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ErrorResponse("Token invalide ou expiré"));
        }

        User user = userService.findUserForAuth(authentication.getName());

        UserDTO dto = userMapper.toDTO(user);

        return ResponseEntity.ok(dto);
    }
}
