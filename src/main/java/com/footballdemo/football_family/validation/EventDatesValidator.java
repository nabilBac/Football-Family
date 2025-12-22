package com.footballdemo.football_family.validation;

import com.footballdemo.football_family.dto.CreateEventDTO;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.time.LocalDateTime;

/**
 * ✅ Validateur custom pour les dates d'événement.
 * 
 * Règles :
 * 1. Si startTime est défini, endTime doit l'être aussi
 * 2. startTime doit être strictement avant endTime
 * 3. La durée maximale est de 24 heures
 */
public class EventDatesValidator implements ConstraintValidator<ValidEventDates, CreateEventDTO> {

    @Override
    public void initialize(ValidEventDates constraintAnnotation) {
        // Pas d'initialisation nécessaire
    }

    @Override
    public boolean isValid(CreateEventDTO dto, ConstraintValidatorContext context) {
        if (dto == null) {
            return true; // Validation null gérée par @NotNull
        }

        LocalDateTime startTime = dto.getStartTime();
        LocalDateTime endTime = dto.getEndTime();

        // Cas 1 : Les deux sont null → OK (optionnel)
        if (startTime == null && endTime == null) {
            return true;
        }

        // Cas 2 : Un seul est défini → ERREUR
        if (startTime == null || endTime == null) {
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate(
                "Si vous définissez une heure de début, l'heure de fin est obligatoire (et inversement)"
            ).addConstraintViolation();
            return false;
        }

        // Cas 3 : startTime >= endTime → ERREUR
        if (!startTime.isBefore(endTime)) {
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate(
                "L'heure de début doit être avant l'heure de fin"
            ).addConstraintViolation();
            return false;
        }

        // Cas 4 : Durée > 24 heures → AVERTISSEMENT (optionnel, peut être commenté)
        if (startTime.plusHours(24).isBefore(endTime)) {
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate(
                "La durée de l'événement ne peut pas dépasser 24 heures"
            ).addConstraintViolation();
            return false;
        }

        // Cas 5 : Vérifier que les dates correspondent au champ 'date'
        if (dto.getDate() != null) {
            if (!startTime.toLocalDate().equals(dto.getDate())) {
                context.disableDefaultConstraintViolation();
                context.buildConstraintViolationWithTemplate(
                    "L'heure de début doit correspondre à la date de l'événement"
                ).addConstraintViolation();
                return false;
            }
        }

        return true;
    }
}


























