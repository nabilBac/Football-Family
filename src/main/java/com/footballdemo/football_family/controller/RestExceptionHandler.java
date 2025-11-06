package com.footballdemo.football_family.controller;

import com.footballdemo.football_family.dto.ApiResponse;
import com.footballdemo.football_family.exception.DuplicateResourceException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.security.access.AccessDeniedException;

@RestControllerAdvice
public class RestExceptionHandler {

    // ⭐ NOUVEAU : Gestion des doublons (SIRET, email, etc.) - 409 Conflict
    @ExceptionHandler(DuplicateResourceException.class)
    public ResponseEntity<ApiResponse<Object>> handleDuplicateResource(DuplicateResourceException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT) // 409 au lieu de 500
                .body(new ApiResponse<>(false, ex.getMessage(), null));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiResponse<Void> handleIllegalArgument(IllegalArgumentException ex) {
        return new ApiResponse<>(false, ex.getMessage(), null);
    }

    // ⭐ Gestion de l'exception de sécurité standard (403)
    @ExceptionHandler({ AccessDeniedException.class, SecurityException.class })
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public ApiResponse<Void> handleAccessDenied(RuntimeException ex) {
        return new ApiResponse<>(false, "Accès refusé: " + ex.getMessage(), null);
    }

    // Gestionnaire pour VideoNotFoundException
    @ExceptionHandler(VideoNotFoundException.class)
    public ResponseEntity<ApiResponse<Long>> handleVideoNotFound(VideoNotFoundException ex) {
        return ResponseEntity.ok(new ApiResponse<>(false, ex.getMessage(), 0L));
    }

    @ExceptionHandler(UserNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ApiResponse<Void> handleUserNotFound(UserNotFoundException ex) {
        return new ApiResponse<>(false, ex.getMessage(), null);
    }

    // ⚠️ IMPORTANT : Ce handler doit être en DERNIER (catch-all)
    // Il capture toutes les RuntimeException non gérées par les handlers au-dessus
    @ExceptionHandler(RuntimeException.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ApiResponse<Void> handleGenericRuntimeException(RuntimeException ex) {
        return new ApiResponse<>(false, ex.getMessage(), null);
    }
}