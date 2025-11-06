package com.footballdemo.football_family.dto;

import com.footballdemo.football_family.model.Team;
import com.footballdemo.football_family.model.User;
import com.footballdemo.football_family.model.EventRegistration;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Mapper pour convertir Team ↔ TeamDTO - VERSION FUSIONNÉE
 * Supporte les équipes PERMANENT (clubs) et TEMPORARY (UTF)
 */
public class TeamMapper {

        /**
         * Convertit un Team en TeamDTO (VERSION COMPLÈTE)
         */
        public static TeamDTO toDTO(Team team) {
                if (team == null)
                        return null;

                // Liste des joueurs
                List<TeamDTO.PlayerDTO> playerDtos = new ArrayList<>();

                // Pour équipes PERMANENTES : joueurs via relation directe
                if (team.getPlayers() != null) {
                        playerDtos.addAll(team.getPlayers().stream()
                                        .map(TeamMapper::toPlayerDTO)
                                        .collect(Collectors.toList()));
                }

                // Pour équipes TEMPORAIRES (UTF) : joueurs via EventRegistration
                if (team.getRegistrations() != null) {
                        playerDtos.addAll(team.getRegistrations().stream()
                                        .filter(reg -> reg.getPlayer() != null)
                                        .map(TeamMapper::toPlayerDTOFromRegistration)
                                        .collect(Collectors.toList()));
                }

                return TeamDTO.builder()
                                // Champs de base
                                .id(team.getId())
                                .name(team.getName())
                                .category(team.getCategory())

                                // Coach (pour équipes permanentes)
                                .coach(team.getCoach() != null ? toCoachDTO(team.getCoach()) : null)

                                // Joueurs
                                .players(playerDtos)
                                .playerCount(team.getPlayerCount())

                                // 🆕 Champs UTF
                                .teamType(team.getTeamType() != null ? team.getTeamType().name() : null)
                                .eventId(team.getEvent() != null ? team.getEvent().getId() : null)
                                .eventName(team.getEvent() != null ? team.getEvent().getName() : null)
                                .color(team.getColor())
                                .clubId(team.getClub() != null ? team.getClub().getId() : null)
                                .clubName(team.getClub() != null ? team.getClub().getName() : null)

                                // Statistiques
                                .wins(team.getWins())
                                .losses(team.getLosses())
                                .draws(team.getDraws())
                                .points(team.getPoints())
                                .goalsScored(team.getGoalsScored())
                                .goalsConceded(team.getGoalsConceded())
                                .goalDifference(team.getGoalDifference())

                                // Métadonnées
                                .createdAt(team.getCreatedAt())
                                .updatedAt(team.getUpdatedAt())
                                .build();
        }

        /**
         * Convertit un User (coach) en CoachDTO
         */
        private static TeamDTO.CoachDTO toCoachDTO(User coach) {
                if (coach == null)
                        return null;

                return TeamDTO.CoachDTO.builder()
                                .id(coach.getId())
                                .username(coach.getUsername())
                                .email(coach.getEmail())
                                .avatarUrl(coach.getAvatarUrl())
                                .build();
        }

        /**
         * Convertit un User (joueur) en PlayerDTO
         */
        private static TeamDTO.PlayerDTO toPlayerDTO(User player) {
                if (player == null)
                        return null;

                return TeamDTO.PlayerDTO.builder()
                                .id(player.getId())
                                .username(player.getUsername())
                                .email(player.getEmail())
                                .avatarUrl(player.getAvatarUrl())
                                .build();
        }

        /**
         * Convertit un EventRegistration en PlayerDTO (pour équipes UTF)
         */
        private static TeamDTO.PlayerDTO toPlayerDTOFromRegistration(EventRegistration reg) {
                if (reg == null || reg.getPlayer() == null)
                        return null;

                User player = reg.getPlayer();

                return TeamDTO.PlayerDTO.builder()
                                .id(player.getId())
                                .username(player.getUsername())
                                .email(player.getEmail())
                                .avatarUrl(player.getAvatarUrl())

                                // 🆕 Infos spécifiques UTF
                                .level(reg.getLevel() != null ? reg.getLevel().name() : null)
                                .preferredPosition(
                                                reg.getPreferredPosition() != null ? reg.getPreferredPosition().name()
                                                                : null)

                                .build();
        }

        /**
         * Convertit une liste de Teams en liste de TeamDTOs
         */
        public static List<TeamDTO> toDTOList(List<Team> teams) {
                if (teams == null)
                        return new ArrayList<>();

                return teams.stream()
                                .map(TeamMapper::toDTO)
                                .collect(Collectors.toList());
        }
}