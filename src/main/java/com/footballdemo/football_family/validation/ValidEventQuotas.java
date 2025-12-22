package com.footballdemo.football_family.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.*;

/**
 * ✅ Annotation de validation custom pour vérifier la cohérence des quotas.
 * 
 * Vérifie que :
 * - maxTeamsPerClub ≤ maxParticipants
 * - maxTeamsPerClub n'est défini que si nécessaire
 */
@Target({ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = EventQuotasValidator.class)
@Documented
public @interface ValidEventQuotas {
    
    String message() default "Le quota par club ne peut pas dépasser le nombre total d'équipes";
    
    Class<?>[] groups() default {};
    
    Class<? extends Payload>[] payload() default {};
}