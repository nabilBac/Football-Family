package com.footballdemo.football_family.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.*;

/**
 * ✅ Annotation de validation custom pour vérifier la cohérence des dates d'un événement.
 * 
 * Vérifie que :
 * - Si startTime est défini, endTime doit être défini
 * - startTime doit être avant endTime
 * - Les heures doivent correspondre à la date de l'événement
 */
@Target({ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = EventDatesValidator.class)
@Documented
public @interface ValidEventDates {
    
    String message() default "Les dates de l'événement sont invalides";
    
    Class<?>[] groups() default {};
    
    Class<? extends Payload>[] payload() default {};
}