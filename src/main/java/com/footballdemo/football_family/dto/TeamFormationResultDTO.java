package com.footballdemo.football_family.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO de réponse après la formation des équipes (UTF).
 * Contient les équipes formées et les statistiques.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeamFormationResultDTO {

    private Long eventId;
    private String eventName;
    private String message;
    private Boolean success;

    // Équipes formées
    private List<FormedTeamDTO> teams;

    // Statistiques
    private Integer totalPlayers;
    private Integer totalTeams;
    private Integer playersPerTeam;
    private Integer unassignedPlayers;

    // Informations d'équilibrage (mode AUTO)
    private String balancingStrategy;
    private Boolean balanced;

    /**
     * DTO pour une équipe nouvellement formée
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FormedTeamDTO {
        private Long teamId;
        private String teamName;
        private String color;
        private List<PlayerInFormedTeamDTO> players;
        private Double averageLevel; // Niveau moyen de l'équipe (1.0 - 4.0)
        private Integer totalPlayers;
    }

    /**
     * DTO pour un joueur dans une équipe formée
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PlayerInFormedTeamDTO {
        private Long playerId;
        private String username;
        private String avatarUrl;
        private String level; // PlayerLevel
        private String preferredPosition; // PlayerPosition
    }
}
