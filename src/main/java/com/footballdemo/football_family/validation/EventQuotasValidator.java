package com.footballdemo.football_family.validation;

import com.footballdemo.football_family.dto.CreateEventDTO;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

/**
 * ✅ Validateur custom pour les quotas d'événement.
 * 
 * Règles :
 * 1. Si maxTeamsPerClub est défini, maxParticipants doit l'être aussi
 * 2. maxTeamsPerClub ne peut pas dépasser maxParticipants
 * 3. Si maxTeamsPerClub > maxParticipants, l'événement est impossible à remplir
 */
public class EventQuotasValidator implements ConstraintValidator<ValidEventQuotas, CreateEventDTO> {

    @Override
    public void initialize(ValidEventQuotas constraintAnnotation) {
        // Pas d'initialisation nécessaire
    }

    @Override
    public boolean isValid(CreateEventDTO dto, ConstraintValidatorContext context) {
        if (dto == null) {
            return true; // Validation null gérée par @NotNull
        }

        Integer maxParticipants = dto.getMaxParticipants();
        Integer maxTeamsPerClub = dto.getMaxTeamsPerClub();

        // Cas 1 : maxTeamsPerClub non défini → OK (quota illimité)
        if (maxTeamsPerClub == null) {
            return true;
        }

        // Cas 2 : maxParticipants non défini mais maxTeamsPerClub défini → ERREUR
        if (maxParticipants == null) {
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate(
                "Le nombre maximum de participants doit être défini si vous spécifiez un quota par club"
            ).addConstraintViolation();
            return false;
        }

        // Cas 3 : maxTeamsPerClub > maxParticipants → ERREUR CRITIQUE
        if (maxTeamsPerClub > maxParticipants) {
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate(
                String.format(
                    "Le quota par club (%d) ne peut pas dépasser le nombre total d'équipes (%d)",
                    maxTeamsPerClub,
                    maxParticipants
                )
            ).addConstraintViolation();
            return false;
        }

        // Cas 4 : Avertissement si maxTeamsPerClub = maxParticipants (un seul club peut tout prendre)
        // Note : C'est techniquement valide, donc on ne bloque pas
        if (maxTeamsPerClub.equals(maxParticipants) && maxParticipants > 1) {
            // Optionnel : logger un warning
            // log.warn("Event quota allows single club to fill all {} spots", maxParticipants);
        }

        return true;
    }
}


























