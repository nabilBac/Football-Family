package com.footballdemo.football_family.controller;



import com.footballdemo.football_family.dto.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.security.access.AccessDeniedException;

@RestControllerAdvice
public class RestExceptionHandler {

    @ExceptionHandler(IllegalArgumentException.class)
@ResponseStatus(HttpStatus.BAD_REQUEST)
public ApiResponse<Void> handleIllegalArgument(IllegalArgumentException ex) {
    return new ApiResponse<>(false, ex.getMessage(), null);
}

// ⭐ AJOUT CRITIQUE 1 : Gestion de l'exception de sécurité standard (403)
    @ExceptionHandler({AccessDeniedException.class, SecurityException.class})
    @ResponseStatus(HttpStatus.FORBIDDEN) // Ceci renvoie le 403 attendu
    public ApiResponse<Void> handleAccessDenied(RuntimeException ex) {
        return new ApiResponse<>(false, "Accès refusé: " + ex.getMessage(), null);
    }

    
// NOUVEAU GESTIONNAIRE : Pour capturer l'exception spécifique du test de like
    @ExceptionHandler(VideoNotFoundException.class)
    public ResponseEntity<ApiResponse<Long>> handleVideoNotFound(VideoNotFoundException ex) {
        // Retourne 200 OK avec le corps JSON attendu par le test (success: false, data: 0L)
        return ResponseEntity.ok(new ApiResponse<>(false, ex.getMessage(), 0L));
    }

    // NOUVEAU GESTIONNAIRE : Pour capturer la RuntimeException générique (corrigeant le statut 500 du test de suppression)
    @ExceptionHandler(RuntimeException.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR) // Renvoie 500 (standard)
    public ApiResponse<Void> handleGenericRuntimeException(RuntimeException ex) {
        return new ApiResponse<>(false, ex.getMessage(), null);
    }

    @ExceptionHandler(UserNotFoundException.class)
@ResponseStatus(HttpStatus.NOT_FOUND)
public ApiResponse<Void> handleUserNotFound(UserNotFoundException ex) {
    return new ApiResponse<>(false, ex.getMessage(), null);
}

}
