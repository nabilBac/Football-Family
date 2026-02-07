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
 import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.MediaType;


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
public ResponseEntity<?> handleForbidden(ForbiddenException ex, HttpServletRequest req) {
    String uri = req.getRequestURI();

    if (!uri.startsWith("/api/")) {
        log.warn("Forbidden hors API (uri={}): {}", uri, ex.getMessage());
        return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
    }

    log.warn("Accès refusé (API): {}", ex.getMessage());
    return ResponseEntity.status(HttpStatus.FORBIDDEN)
            .contentType(MediaType.APPLICATION_JSON)
            .body(new ApiResponse<>(false, ex.getMessage(), null));
}


   @ExceptionHandler(IllegalArgumentException.class)
public ResponseEntity<?> handleBadRequest(IllegalArgumentException ex, HttpServletRequest req) {

    String uri = req.getRequestURI();

    // ✅ Hors /api/** : on ne renvoie pas ApiResponse (évite de casser mp4/js/ws)
    if (!uri.startsWith("/api/")) {
        log.warn("IllegalArgument hors API (uri={}): {}", uri, ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
    }

    // ✅ Pour /api/** : réponse JSON standard
    log.warn("Requête invalide (API): {}", ex.getMessage());
    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .contentType(MediaType.APPLICATION_JSON)
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
public ResponseEntity<?> handleAccessDenied(AccessDeniedException ex, HttpServletRequest req) {

    String uri = req.getRequestURI();

    if (!uri.startsWith("/api/")) {
        log.warn("AccessDenied hors API (uri={}): {}", uri, ex.getMessage());
        return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
    }

    log.warn("Accès refusé (API): {}", ex.getMessage());
    return ResponseEntity.status(HttpStatus.FORBIDDEN)
            .contentType(MediaType.APPLICATION_JSON)
            .body(new ApiResponse<>(false, ex.getMessage(), null));
}



    // ========================================================================
    // ⚠️ A GARDER EN DERNIER — Handler global
    // ========================================================================
    @ExceptionHandler(Exception.class)
public ResponseEntity<?> handleGeneral(Exception ex, HttpServletRequest req) {

    String uri = req.getRequestURI();

    // ✅ Ne jamais renvoyer ApiResponse hors /api/** (sinon mp4/js casse)
    if (!uri.startsWith("/api/")) {
        log.warn("Exception hors API ignorée par GlobalExceptionHandler (uri={}): {}", uri, ex.toString());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
    }

    log.error("Erreur serveur inattendue (uri={})", uri, ex);

    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .contentType(MediaType.APPLICATION_JSON)
            .body(new ApiResponse<>(false, "Erreur serveur: " + ex.getMessage(), null));
}

}
