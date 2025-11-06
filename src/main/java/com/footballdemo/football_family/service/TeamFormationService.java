package com.footballdemo.football_family.service;

import com.footballdemo.football_family.dto.FormTeamsDTO;
import com.footballdemo.football_family.dto.TeamFormationResultDTO;
import com.footballdemo.football_family.exception.ResourceNotFoundException;
import com.footballdemo.football_family.model.*;
import com.footballdemo.football_family.repository.EventRegistrationRepository;
import com.footballdemo.football_family.repository.EventRepository;
import com.footballdemo.football_family.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Service pour la formation des équipes dans les tournois UTF.
 * Gère la formation automatique (équilibrage) et manuelle des équipes.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class TeamFormationService {

    private final EventRepository eventRepository;
    private final EventRegistrationRepository registrationRepository;
    private final TeamRepository teamRepository;

    /**
     * Forme les équipes pour un événement UTF
     */
    public TeamFormationResultDTO formTeams(FormTeamsDTO dto) {
        log.info("🏆 Formation des équipes pour l'événement {} - Mode: {}", dto.getEventId(), dto.getMode());

        // 1. Récupérer l'événement
        Event event = eventRepository.findById(dto.getEventId())
                .orElseThrow(() -> new ResourceNotFoundException("Événement", dto.getEventId()));

        // 2. Vérifier que c'est un événement UTF (INDIVIDUAL)
        if (event.getRegistrationType() != RegistrationType.INDIVIDUAL) {
            throw new IllegalArgumentException("La formation d'équipes n'est disponible que pour les événements UTF");
        }

        // 3. Vérifier que les équipes n'ont pas déjà été formées
        if (Boolean.TRUE.equals(event.getTeamsFormed())) {
            throw new IllegalStateException("Les équipes ont déjà été formées pour cet événement");
        }

        // 4. Récupérer les inscriptions validées
        List<EventRegistration> validRegistrations = registrationRepository
                .findByEventIdAndStatus(dto.getEventId(), RegistrationStatus.VALIDE);

        if (validRegistrations.isEmpty()) {
            throw new IllegalStateException("Aucune inscription validée pour former les équipes");
        }

        // 5. Former les équipes selon le mode
        List<Team> formedTeams;
        if ("AUTO".equals(dto.getMode())) {
            formedTeams = formTeamsAutomatically(event, validRegistrations, dto);
        } else if ("MANUAL".equals(dto.getMode())) {
            formedTeams = formTeamsManually(event, validRegistrations, dto);
        } else {
            throw new IllegalArgumentException("Mode de formation invalide: " + dto.getMode());
        }

        // 6. Marquer l'événement comme "équipes formées"
        event.setTeamsFormed(true);
        eventRepository.save(event);

        // 7. Construire le résultat
        return buildFormationResult(event, formedTeams, validRegistrations, dto);
    }

    /**
     * Formation AUTOMATIQUE des équipes (équilibrage par niveau)
     */
    private List<Team> formTeamsAutomatically(Event event, List<EventRegistration> registrations, FormTeamsDTO dto) {
        log.info("🤖 Formation automatique - Stratégie: {}", dto.getBalancingStrategy());

        int numberOfTeams = event.getNumberOfTeams() != null ? event.getNumberOfTeams() : 2;
        List<Team> teams = new ArrayList<>();

        // Créer les équipes vides
        for (int i = 0; i < numberOfTeams; i++) {
            String teamName = getTeamName(dto.getTeamNames(), i);
            String teamColor = getTeamColor(dto.getTeamColors(), i);

            Team team = Team.builder()
                    .name(teamName)
                    .teamType(TeamType.TEMPORARY)
                    .event(event)
                    .color(teamColor)
                    .wins(0)
                    .losses(0)
                    .draws(0)
                    .goalsScored(0)
                    .goalsConceded(0)
                    .build();

            teams.add(teamRepository.save(team));
        }

        // Équilibrer selon la stratégie
        if ("LEVEL_BASED".equals(dto.getBalancingStrategy())) {
            balanceByLevel(teams, registrations);
        } else if ("POSITION_BASED".equals(dto.getBalancingStrategy())) {
            balanceByPosition(teams, registrations);
        } else if ("MIXED".equals(dto.getBalancingStrategy())) {
            balanceByMixed(teams, registrations);
        } else {
            // RANDOM par défaut
            balanceRandomly(teams, registrations);
        }

        return teams;
    }

    /**
     * Équilibrage par NIVEAU (distribue les meilleurs joueurs équitablement)
     */
    private void balanceByLevel(List<Team> teams, List<EventRegistration> registrations) {
        log.debug("⚖️ Équilibrage par niveau");

        // Trier par niveau (EXPERT → BEGINNER)
        List<EventRegistration> sorted = registrations.stream()
                .sorted(Comparator.comparing(reg -> getLevelScore(reg.getLevel()), Comparator.reverseOrder()))
                .toList();

        // Distribution en serpent (Team 1, Team 2, ..., Team N, Team N, ..., Team 1)
        int teamIndex = 0;
        boolean ascending = true;

        for (EventRegistration reg : sorted) {
            Team team = teams.get(teamIndex);
            assignPlayerToTeam(reg, team);

            if (ascending) {
                teamIndex++;
                if (teamIndex >= teams.size()) {
                    teamIndex = teams.size() - 1;
                    ascending = false;
                }
            } else {
                teamIndex--;
                if (teamIndex < 0) {
                    teamIndex = 0;
                    ascending = true;
                }
            }
        }
    }

    /**
     * Équilibrage par POSITION (équilibre les postes dans chaque équipe)
     */
    private void balanceByPosition(List<Team> teams, List<EventRegistration> registrations) {
        log.debug("⚖️ Équilibrage par position");

        // Grouper par position
        Map<PlayerPosition, List<EventRegistration>> byPosition = registrations.stream()
                .collect(Collectors.groupingBy(
                        reg -> reg.getPreferredPosition() != null ? reg.getPreferredPosition() : PlayerPosition.ANY));

        // Distribuer chaque position équitablement
        for (Map.Entry<PlayerPosition, List<EventRegistration>> entry : byPosition.entrySet()) {
            List<EventRegistration> players = entry.getValue();
            int teamIndex = 0;

            for (EventRegistration reg : players) {
                Team team = teams.get(teamIndex % teams.size());
                assignPlayerToTeam(reg, team);
                teamIndex++;
            }
        }
    }

    /**
     * Équilibrage MIXTE (niveau + position)
     */
    private void balanceByMixed(List<Team> teams, List<EventRegistration> registrations) {
        log.debug("⚖️ Équilibrage mixte");

        // Trier par niveau puis position
        List<EventRegistration> sorted = registrations.stream()
                .sorted(Comparator
                        .comparing((EventRegistration reg) -> getLevelScore(reg.getLevel()), Comparator.reverseOrder())
                        .thenComparing(
                                reg -> reg.getPreferredPosition() != null ? reg.getPreferredPosition().name() : "ZZZ"))
                .toList();

        // Distribution équilibrée
        int teamIndex = 0;
        for (EventRegistration reg : sorted) {
            Team team = teams.get(teamIndex % teams.size());
            assignPlayerToTeam(reg, team);
            teamIndex++;
        }
    }

    /**
     * Équilibrage ALÉATOIRE
     */
    private void balanceRandomly(List<Team> teams, List<EventRegistration> registrations) {
        log.debug("🎲 Distribution aléatoire");

        List<EventRegistration> shuffled = new ArrayList<>(registrations);
        Collections.shuffle(shuffled);

        int teamIndex = 0;
        for (EventRegistration reg : shuffled) {
            Team team = teams.get(teamIndex % teams.size());
            assignPlayerToTeam(reg, team);
            teamIndex++;
        }
    }

    /**
     * Formation MANUELLE des équipes
     */
    private List<Team> formTeamsManually(Event event, List<EventRegistration> registrations, FormTeamsDTO dto) {
        log.info("👤 Formation manuelle");

        if (dto.getManualTeamAssignments() == null || dto.getManualTeamAssignments().isEmpty()) {
            throw new IllegalArgumentException("Les assignations manuelles sont requises pour le mode MANUAL");
        }

        List<Team> teams = new ArrayList<>();
        Map<Long, EventRegistration> regMap = registrations.stream()
                .collect(Collectors.toMap(reg -> reg.getPlayer().getId(), reg -> reg));

        // Créer chaque équipe avec ses joueurs assignés
        int colorIndex = 0;
        for (Map.Entry<String, List<Long>> entry : dto.getManualTeamAssignments().entrySet()) {
            String teamName = entry.getKey();
            List<Long> playerIds = entry.getValue();
            String teamColor = getTeamColor(dto.getTeamColors(), colorIndex++);

            Team team = Team.builder()
                    .name(teamName)
                    .teamType(TeamType.TEMPORARY)
                    .event(event)
                    .color(teamColor)
                    .wins(0)
                    .losses(0)
                    .draws(0)
                    .goalsScored(0)
                    .goalsConceded(0)
                    .build();

            team = teamRepository.save(team);

            // Assigner les joueurs
            for (Long playerId : playerIds) {
                EventRegistration reg = regMap.get(playerId);
                if (reg != null) {
                    assignPlayerToTeam(reg, team);
                }
            }

            teams.add(team);
        }

        return teams;
    }

    /**
     * Assigne un joueur à une équipe
     */
    private void assignPlayerToTeam(EventRegistration registration, Team team) {
        registration.setAssignedTeam(team);
        registrationRepository.save(registration);
        log.debug("✅ Joueur {} assigné à {}", registration.getPlayer().getUsername(), team.getName());
    }

    /**
     * Construit le résultat de la formation
     */
    private TeamFormationResultDTO buildFormationResult(Event event, List<Team> teams,
            List<EventRegistration> registrations, FormTeamsDTO dto) {

        List<TeamFormationResultDTO.FormedTeamDTO> formedTeams = teams.stream()
                .map(team -> {
                    List<EventRegistration> teamRegs = registrations.stream()
                            .filter(reg -> team.equals(reg.getAssignedTeam()))
                            .toList();

                    List<TeamFormationResultDTO.PlayerInFormedTeamDTO> players = teamRegs.stream()
                            .map(reg -> TeamFormationResultDTO.PlayerInFormedTeamDTO.builder()
                                    .playerId(reg.getPlayer().getId())
                                    .username(reg.getPlayer().getUsername())
                                    .avatarUrl(reg.getPlayer().getAvatarUrl())
                                    .level(reg.getLevel() != null ? reg.getLevel().name() : null)
                                    .preferredPosition(
                                            reg.getPreferredPosition() != null ? reg.getPreferredPosition().name()
                                                    : null)
                                    .build())
                            .toList();

                    double avgLevel = teamRegs.stream()
                            .mapToDouble(reg -> getLevelScore(reg.getLevel()))
                            .average()
                            .orElse(0.0);

                    return TeamFormationResultDTO.FormedTeamDTO.builder()
                            .teamId(team.getId())
                            .teamName(team.getName())
                            .color(team.getColor())
                            .players(players)
                            .averageLevel(avgLevel)
                            .totalPlayers(players.size())
                            .build();
                })
                .toList();

        int unassigned = (int) registrations.stream()
                .filter(reg -> reg.getAssignedTeam() == null)
                .count();

        return TeamFormationResultDTO.builder()
                .eventId(event.getId())
                .eventName(event.getName())
                .success(true)
                .message("Équipes formées avec succès")
                .teams(formedTeams)
                .totalPlayers(registrations.size())
                .totalTeams(teams.size())
                .playersPerTeam(registrations.size() / teams.size())
                .unassignedPlayers(unassigned)
                .balancingStrategy(dto.getBalancingStrategy())
                .balanced(isBalanced(formedTeams))
                .build();
    }

    /**
     * Vérifie si les équipes sont équilibrées
     */
    private boolean isBalanced(List<TeamFormationResultDTO.FormedTeamDTO> teams) {
        if (teams.size() < 2)
            return true;

        double avgLevel = teams.stream()
                .mapToDouble(TeamFormationResultDTO.FormedTeamDTO::getAverageLevel)
                .average()
                .orElse(0.0);

        // Équilibré si l'écart max est < 0.5
        return teams.stream()
                .allMatch(team -> Math.abs(team.getAverageLevel() - avgLevel) < 0.5);
    }

    /**
     * Retourne le score numérique d'un niveau
     */
    private double getLevelScore(PlayerLevel level) {
        if (level == null)
            return 2.0; // INTERMEDIATE par défaut
        return switch (level) {
            case BEGINNER -> 1.0;
            case INTERMEDIATE -> 2.0;
            case ADVANCED -> 3.0;
            case EXPERT -> 4.0;
        };
    }

    /**
     * Récupère le nom d'équipe
     */
    private String getTeamName(List<String> names, int index) {
        if (names != null && index < names.size()) {
            return names.get(index);
        }
        return "Équipe " + (char) ('A' + index);
    }

    /**
     * Récupère la couleur d'équipe
     */
    private String getTeamColor(List<String> colors, int index) {
        if (colors != null && index < colors.size()) {
            return colors.get(index);
        }

        // Couleurs par défaut
        String[] defaultColors = { "#FF0000", "#0000FF", "#00FF00", "#FFFF00", "#FF00FF", "#00FFFF" };
        return defaultColors[index % defaultColors.length];
    }
}