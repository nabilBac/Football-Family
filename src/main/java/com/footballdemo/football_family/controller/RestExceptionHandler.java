package com.footballdemo.football_family.controller;

import com.footballdemo.football_family.dto.ApiResponse;
import com.footballdemo.football_family.exception.DuplicateResourceException;
import com.footballdemo.football_family.exception.UserNotFoundException;
import com.footballdemo.football_family.exception.VideoNotFoundException;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class RestExceptionHandler {

    // =====================================================
    // 409 — Ressource dupliquée
    // =====================================================
    @ExceptionHandler(DuplicateResourceException.class)
    public ResponseEntity<ApiResponse<Object>> handleDuplicateResource(DuplicateResourceException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ApiResponse<>(false, ex.getMessage(), null));
    }

    // =====================================================
    // 400 — Mauvaise requête
    // =====================================================
    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiResponse<Void> handleIllegalArgument(IllegalArgumentException ex) {
        return new ApiResponse<>(false, ex.getMessage(), null);
    }

    // =====================================================
    // 403 — Accès refusé (sécurité)
    // =====================================================
    @ExceptionHandler({ AccessDeniedException.class, SecurityException.class })
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public ApiResponse<Void> handleAccessDenied(RuntimeException ex) {
        return new ApiResponse<>(false, "Accès refusé : " + ex.getMessage(), null);
    }

    // =====================================================
    // 404 — Vidéo non trouvée
    // =====================================================
    @ExceptionHandler(VideoNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ApiResponse<Void> handleVideoNotFound(VideoNotFoundException ex) {
        return new ApiResponse<>(false, ex.getMessage(), null);
    }

    // =====================================================
    // 404 — Utilisateur non trouvé
    // =====================================================
    @ExceptionHandler(UserNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ApiResponse<Void> handleUserNotFound(UserNotFoundException ex) {
        return new ApiResponse<>(false, ex.getMessage(), null);
    }

    // =====================================================
    // 500 — Erreur serveur (catch-all)
    // =====================================================
    @ExceptionHandler(RuntimeException.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ApiResponse<Void> handleGenericRuntimeException(RuntimeException ex) {
        // ⚠️ Tu peux ajouter un log ici si tu veux
        return new ApiResponse<>(false, "Erreur interne : " + ex.getMessage(), null);
    }
}
