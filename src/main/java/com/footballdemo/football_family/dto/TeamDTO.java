package com.footballdemo.football_family.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeamDTO {

    private Long id;
    private String name;
    private String category;

    private CoachDTO coach;
    private List<PlayerDTO> players;

    // 🆕 NOUVEAUX CHAMPS UTF (TOUS)
    private String teamType; // "PERMANENT" ou "TEMPORARY"
    private Long eventId; // ID de l'événement
    private String eventName; // Nom de l'événement
    private String color; // Couleur de l'équipe
    private Long clubId; // ID du club
    private String clubName; // Nom du club
    private Integer playerCount; // Nombre de joueurs

    // Statistiques
    private Integer wins;
    private Integer losses;
    private Integer draws;
    private Integer points;
    private Integer goalsScored;
    private Integer goalsConceded;
    private Integer goalDifference;

    // Métadonnées
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CoachDTO {
        private Long id;
        private String username;
        private String email;
        private String avatarUrl; // 🆕 Ajouté pour TeamMapper
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PlayerDTO {
        private Long id;
        private String username;
        private String email;
        private String avatarUrl; // 🆕 Ajouté pour TeamMapper
        private String level; // 🆕 Niveau du joueur (UTF)
        private String preferredPosition; // 🆕 Position préférée (UTF)
    }
}