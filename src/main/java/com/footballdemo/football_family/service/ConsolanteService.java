package com.footballdemo.football_family.service;

import com.footballdemo.football_family.model.Event;
import com.footballdemo.football_family.model.Match;
import com.footballdemo.football_family.model.MatchStatus;
import com.footballdemo.football_family.model.Team;
import com.footballdemo.football_family.dto.TeamStats;
import com.footballdemo.football_family.repository.EventRepository;
import com.footballdemo.football_family.repository.MatchRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.footballdemo.football_family.model.TournamentPhase;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ConsolanteService {

    private final EventRepository eventRepository;
    private final MatchRepository matchRepository;
    private final DynamicBracketGenerator dynamicBracketGenerator;

    /**
     * 🏆 Génère le bracket de consolante (tournoi B) avec système BYE
     * - Récupère les équipes classées 3e et 4e des poules
     * - Génère un bracket avec BYES si nombre impair
     * - Préfixe tous les rounds avec "C"
     */
    @Transactional
    public List<Match> generateConsolanteBracket(
            Long eventId,
            Map<String, List<TeamStats>> rankingsByGroup
    ) {

        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Événement introuvable"));

        if (event.getTournamentPhase() != TournamentPhase.GROUP_STAGE_FINISHED &&
            event.getTournamentPhase() != TournamentPhase.KNOCKOUT_STAGE) {
            throw new IllegalStateException(
                "La consolante ne peut être générée qu'après les poules"
            );
        }

        if (matchRepository.existsByEventIdAndRoundStartingWith(eventId, "C")) {
            throw new IllegalStateException("Consolante déjà générée");
        }

        // 🔹 Récupérer les équipes 3e et 4e de chaque groupe
        List<Team> consolanteTeams = new ArrayList<>();

        for (List<TeamStats> stats : rankingsByGroup.values()) {
            if (stats.size() >= 3) consolanteTeams.add(stats.get(2).getTeam());
            if (stats.size() >= 4) consolanteTeams.add(stats.get(3).getTeam());
        }

        if (consolanteTeams.size() < 2) {
            throw new IllegalStateException("Pas assez d'équipes pour la consolante");
        }

        System.out.println("🏆 Génération consolante avec " + consolanteTeams.size() + " équipes");

        // 🔥 UTILISER LA NOUVELLE MÉTHODE AVEC BYES
        List<Match> matches = dynamicBracketGenerator.generateKnockoutWithByes(
            consolanteTeams,
            event
        );

        // 🔑 Préfixer tous les rounds avec "C"
        matches.forEach(m -> m.setRound("C" + m.getRound()));

        matchRepository.saveAll(matches);
        
        System.out.println("✅ Consolante générée : " + matches.size() + " matchs");
        
        return matches;
    }

    /**
     * Récupérer tous les matchs de consolante d'un événement
     */
    public List<Match> getConsolanteBracket(Long eventId) {
        return matchRepository.findByEventId(eventId).stream()
                .filter(m -> m.getRound() != null && m.getRound().startsWith("C"))
                .toList();
    }
}