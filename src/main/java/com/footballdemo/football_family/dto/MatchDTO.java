package com.footballdemo.football_family.dto;

import com.footballdemo.football_family.model.Match;
import com.footballdemo.football_family.model.MatchStatus;
import lombok.*;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

/**
 * DTO pour Match - VERSION FUSIONNÉE
 * Supporte à la fois :
 * - Ton système existant (name, date, location, teams)
 * - Les nouveaux champs (status, score, phase)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MatchDTO {

    // ═══════════════════════════════════════════════════════════
    // CHAMPS EXISTANTS (Conservés)
    // ═══════════════════════════════════════════════════════════

    private Long id;
    private String name;
    private LocalDate date;
    private String location;
    private List<TeamDTO> teams;

    // ═══════════════════════════════════════════════════════════
    // 🆕 NOUVEAUX CHAMPS
    // ═══════════════════════════════════════════════════════════

    // Statut du match
    private String status; // MatchStatus en String (SCHEDULED, IN_PROGRESS, FINISHED, CANCELLED)

    // Score
    private Integer homeScore;
    private Integer awayScore;
    private Boolean penalties; // Match décidé aux tirs au but ?

    // Équipes (noms pour affichage rapide)
    private String homeTeamName;
    private String awayTeamName;
    private Long homeTeamId;
    private Long awayTeamId;

    // Équipe gagnante
    private Long winnerTeamId;
    private String winnerTeamName;

    // Phase du tournoi (si applicable)
    private Long phaseId;
    private String phaseName;
    private String phaseType; // PhaseType en String (GROUP, QUARTER_FINAL, SEMI_FINAL, FINAL)

    // Événement parent
    private Long eventId;
    private String eventName;

    // Statistiques du match
    private Integer totalGoals;
    private List<PlayerStatsDTO> playerStats;

    // ═══════════════════════════════════════════════════════════
    // CONVERSION Match → MatchDTO
    // ═══════════════════════════════════════════════════════════

    /**
     * Convertit un Match en MatchDTO (VERSION COMPLÈTE)
     */
    public static MatchDTO from(Match match) {
        if (match == null)
            return null;

        // Équipes
        List<TeamDTO> teamDtos = match.getTeams() != null
                ? match.getTeams().stream()
                        .map(TeamMapper::toDTO)
                        .collect(Collectors.toList())
                : List.of();

        // Noms des équipes (home = première équipe, away = deuxième)
        String homeTeam = teamDtos.size() > 0 ? teamDtos.get(0).getName() : null;
        String awayTeam = teamDtos.size() > 1 ? teamDtos.get(1).getName() : null;
        Long homeTeamId = teamDtos.size() > 0 ? teamDtos.get(0).getId() : null;
        Long awayTeamId = teamDtos.size() > 1 ? teamDtos.get(1).getId() : null;

        // Score
        Integer homeScore = match.getScore() != null ? match.getScore().getHomeScore() : null;
        Integer awayScore = match.getScore() != null ? match.getScore().getAwayScore() : null;
        Boolean penalties = match.getScore() != null ? match.getScore().getPenalties() : false;

        // Total de buts
        Integer totalGoals = 0;
        if (homeScore != null)
            totalGoals += homeScore;
        if (awayScore != null)
            totalGoals += awayScore;

        // Stats joueurs
        List<PlayerStatsDTO> statsDtos = match.getPlayerStats() != null
                ? match.getPlayerStats().stream()
                        .map(PlayerStatsDTO::from)
                        .collect(Collectors.toList())
                : List.of();

        return MatchDTO.builder()
                // Champs existants
                .id(match.getId())
                .name(match.getName())
                .date(match.getDate())
                .location(match.getLocation())
                .teams(teamDtos)

                // 🆕 Nouveaux champs
                .status(match.getStatus() != null ? match.getStatus().name() : null)
                .homeScore(homeScore)
                .awayScore(awayScore)
                .penalties(penalties)
                .homeTeamName(homeTeam)
                .awayTeamName(awayTeam)
                .homeTeamId(homeTeamId)
                .awayTeamId(awayTeamId)
                .winnerTeamId(match.getWinner() != null ? match.getWinner().getId() : null)
                .winnerTeamName(match.getWinner() != null ? match.getWinner().getName() : null)
                .phaseId(match.getPhase() != null ? match.getPhase().getId() : null)
                .phaseName(match.getPhase() != null ? match.getPhase().getName() : null)
                .phaseType(match.getPhase() != null && match.getPhase().getType() != null
                        ? match.getPhase().getType().name()
                        : null)
                .eventId(match.getEvent() != null ? match.getEvent().getId() : null)
                .eventName(match.getEvent() != null ? match.getEvent().getName() : null)
                .totalGoals(totalGoals)
                .playerStats(statsDtos)
                .build();
    }

    // ═══════════════════════════════════════════════════════════
    // MÉTHODES UTILITAIRES
    // ═══════════════════════════════════════════════════════════

    /**
     * Vérifie si le match est terminé
     */
    public boolean isFinished() {
        return "FINISHED".equals(status);
    }

    /**
     * Vérifie si le match est en cours
     */
    public boolean isInProgress() {
        return "IN_PROGRESS".equals(status);
    }

    /**
     * Vérifie si le match a un gagnant
     */
    public boolean hasWinner() {
        return winnerTeamId != null;
    }

    /**
     * Vérifie si le match est un match nul
     */
    public boolean isDraw() {
        return isFinished() &&
                homeScore != null &&
                awayScore != null &&
                homeScore.equals(awayScore) &&
                !Boolean.TRUE.equals(penalties);
    }

    /**
     * Retourne le résultat sous forme de texte (ex: "3 - 2")
     */
    public String getScoreDisplay() {
        if (homeScore == null || awayScore == null) {
            return "-";
        }
        String score = homeScore + " - " + awayScore;
        if (Boolean.TRUE.equals(penalties)) {
            score += " (TAB)";
        }
        return score;
    }
}
