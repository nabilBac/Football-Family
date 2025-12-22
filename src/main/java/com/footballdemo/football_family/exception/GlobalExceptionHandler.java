package com.footballdemo.football_family.exception;

import com.footballdemo.football_family.dto.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.resource.NoResourceFoundException;
 import org.springframework.security.access.AccessDeniedException;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleNotFound(ResourceNotFoundException ex) {
        log.warn("Ressource non trouvée: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ApiResponse<>(false, ex.getMessage(), null));
    }

    @ExceptionHandler(DuplicateResourceException.class)
    public ResponseEntity<ApiResponse<Void>> handleDuplicate(DuplicateResourceException ex) {
        log.warn("Ressource dupliquée: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ApiResponse<>(false, ex.getMessage(), null));
    }

    @ExceptionHandler(ForbiddenException.class)
    public ResponseEntity<ApiResponse<Void>> handleForbidden(ForbiddenException ex) {
        log.warn("Accès refusé: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(new ApiResponse<>(false, ex.getMessage(), null));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<Void>> handleBadRequest(IllegalArgumentException ex) {
        log.warn("Requête invalide: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiResponse<>(false, ex.getMessage(), null));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleValidationErrors(
            MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach(error -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });
        log.warn("Erreurs de validation: {}", errors);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiResponse<>(false, "Erreurs de validation", errors));
    }

    // ========================================================================
    // 🔥 STOPPER le 500 "No static resource" qui casse ta PWA
    // ========================================================================
    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<?> handleStaticResource(NoResourceFoundException ex) {

        String path = ex.getResourcePath();
        log.warn("Ressource statique manquante: {}", path);

        // On renvoie un simple 404 (pas un JSON)
        return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
    }


   

@ExceptionHandler(AccessDeniedException.class)
public ResponseEntity<ApiResponse<Void>> handleAccessDenied(AccessDeniedException ex) {
    log.warn("Accès refusé (Spring Security): {}", ex.getMessage());
    return ResponseEntity.status(HttpStatus.FORBIDDEN)
            .body(new ApiResponse<>(false, ex.getMessage(), null));
}


    // ========================================================================
    // ⚠️ A GARDER EN DERNIER — Handler global
    // ========================================================================
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGeneral(Exception ex) {
        log.error("Erreur serveur inattendue", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiResponse<>(false, "Erreur serveur: " + ex.getMessage(), null));
    }
}
