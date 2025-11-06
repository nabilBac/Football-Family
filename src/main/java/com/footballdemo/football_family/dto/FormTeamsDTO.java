package com.footballdemo.football_family.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * DTO pour la formation des équipes après les inscriptions (mode UTF).
 * Permet une formation MANUELLE ou AUTOMATIQUE.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FormTeamsDTO {

    // ═══════════════════════════════════════════════════════════
    // INFORMATIONS DE BASE
    // ═══════════════════════════════════════════════════════════

    @NotNull(message = "L'ID de l'événement est obligatoire")
    private Long eventId;

    @NotBlank(message = "Le mode de formation est obligatoire")
    private String mode; // TeamFormationMode (AUTO ou MANUAL)

    // ═══════════════════════════════════════════════════════════
    // POUR FORMATION AUTOMATIQUE
    // ═══════════════════════════════════════════════════════════

    private String balancingStrategy; // LEVEL_BASED, POSITION_BASED, MIXED, RANDOM

    // ═══════════════════════════════════════════════════════════
    // POUR FORMATION MANUELLE
    // ═══════════════════════════════════════════════════════════

    /**
     * Map : teamName → List<playerId>
     * Exemple :
     * {
     * "Équipe Rouge": [1, 5, 9, 12],
     * "Équipe Bleue": [2, 6, 10, 13]
     * }
     */
    private Map<String, List<Long>> manualTeamAssignments;

    // ═══════════════════════════════════════════════════════════
    // NOMS ET COULEURS DES ÉQUIPES (Optionnel)
    // ═══════════════════════════════════════════════════════════

    @Size(max = 32, message = "Maximum 32 noms d'équipes")
    private List<String> teamNames; // ["Team A", "Team B", "Team C", ...]

    @Size(max = 32, message = "Maximum 32 couleurs d'équipes")
    private List<String> teamColors; // ["#FF0000", "#0000FF", "#00FF00", ...]

    // ═══════════════════════════════════════════════════════════
    // OPTIONS
    // ═══════════════════════════════════════════════════════════

    private Boolean notifyPlayers = true; // Envoyer une notification aux joueurs

    private Boolean lockTeams = false; // Empêcher les modifications après formation

    // ═══════════════════════════════════════════════════════════
    // VALIDATION
    // ═══════════════════════════════════════════════════════════

    /**
     * Vérifie que les données sont cohérentes selon le mode
     */
    public boolean isValid() {
        if ("MANUAL".equals(mode)) {
            return manualTeamAssignments != null && !manualTeamAssignments.isEmpty();
        }
        if ("AUTO".equals(mode)) {
            return balancingStrategy != null;
        }
        return false;
    }

    /**
     * Vérifie si c'est une formation automatique
     */
    public boolean isAutoMode() {
        return "AUTO".equals(mode);
    }

    /**
     * Vérifie si c'est une formation manuelle
     */
    public boolean isManualMode() {
        return "MANUAL".equals(mode);
    }
}
