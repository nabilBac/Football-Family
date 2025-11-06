package com.footballdemo.football_family.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO pour l'inscription d'un joueur à un événement.
 * Nouveau DTO spécifique pour le processus d'inscription.
 * Adapté aux 2 modes :
 * - INDIVIDUAL (UTF) : Inscription individuelle avec préférences
 * - TEAM_BASED (Spond) : Confirmation de présence d'un membre d'équipe
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegisterToEventDTO {

    // ═══════════════════════════════════════════════════════════
    // INFORMATIONS DE BASE
    // ═══════════════════════════════════════════════════════════

    @NotNull(message = "L'ID de l'événement est obligatoire")
    private Long eventId;

    // Note : Le playerId sera récupéré depuis le JWT (utilisateur connecté)
    // pour des raisons de sécurité

    // ═══════════════════════════════════════════════════════════
    // POUR MODE TEAM_BASED (Spond)
    // ═══════════════════════════════════════════════════════════

    private Long teamId; // ID de l'équipe du joueur (si mode TEAM_BASED)

    // ═══════════════════════════════════════════════════════════
    // POUR MODE INDIVIDUAL (UTF)
    // ═══════════════════════════════════════════════════════════

    private String level; // PlayerLevel (BEGINNER, INTERMEDIATE, ADVANCED, EXPERT)

    private String preferredPosition; // PlayerPosition (GOALKEEPER, DEFENDER, MIDFIELDER, FORWARD)

    @Size(max = 500, message = "Les notes ne peuvent pas dépasser 500 caractères")
    private String notes; // Notes personnelles (ex: "Disponible que l'après-midi")

    // ═══════════════════════════════════════════════════════════
    // OPTIONS
    // ═══════════════════════════════════════════════════════════

    @AssertTrue(message = "Vous devez accepter les conditions pour vous inscrire")
    private Boolean acceptsTerms = true; // Accepte les conditions

    private Boolean receiveNotifications = true; // Recevoir les notifications

    // ═══════════════════════════════════════════════════════════
    // VALIDATION PERSONNALISÉE
    // ═══════════════════════════════════════════════════════════

    /**
     * Vérifie que les informations UTF sont présentes si nécessaire
     */
    public boolean hasUtfPreferences() {
        return level != null || preferredPosition != null;
    }

    /**
     * Vérifie que l'équipe est spécifiée pour le mode Spond
     */
    public boolean hasTeam() {
        return teamId != null;
    }
}
