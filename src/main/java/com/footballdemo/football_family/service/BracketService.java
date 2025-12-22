package com.footballdemo.football_family.service;

import com.footballdemo.football_family.dto.TeamStats;
import com.footballdemo.football_family.dto.GroupRankingDTO;
import com.footballdemo.football_family.model.Event;
import com.footballdemo.football_family.model.Match;

import com.footballdemo.football_family.model.Team;
import com.footballdemo.football_family.repository.MatchRepository;
import com.footballdemo.football_family.repository.TeamRepository;

import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.footballdemo.football_family.model.TournamentPhase;
import java.util.stream.Collectors;
import java.util.*;


@Service
@RequiredArgsConstructor
public class BracketService {

    private final MatchRepository matchRepository;
    private final EventService eventService;
    private final TournamentRulesService tournamentRulesService;
    private final DynamicBracketGenerator dynamicBracketGenerator;
    private final TeamRepository teamRepository;


    

    // ==========================================================
    // 1️⃣ MÉTHODE PUBLIQUE UNIQUE
    // ==========================================================
public List<Match> generateBracket(
        Long eventId,
        Map<?, ? extends List<?>> rankings
) {
    try {
        Event event = eventService.getEventById(eventId);
        System.out.println("🔥 Event récupéré: " + event.getId());

        tournamentRulesService.assertCanGenerateBracket(event);
        tournamentRulesService.assertAllGroupMatchesFinished(eventId);
        tournamentRulesService.assertBracketNotAlreadyGenerated(eventId);

        // 🔹 Extraction des équipes qualifiées
        List<Team> qualifiedTeams;
        
        if (rankings == null || rankings.isEmpty()) {
            // PAS DE GROUPES → Prendre TOUTES les équipes inscrites
            System.out.println("⚠️ Pas de groupes détectés - Génération directe avec toutes les équipes");
          qualifiedTeams = eventService.getTeamsByEventId(eventId).stream()
    .filter(team -> team != null)
    .sorted(Comparator.comparing(Team::getName))
    .collect(Collectors.toList());
        } else {
            // AVEC GROUPES → Utiliser extractQualifiedTeams
            qualifiedTeams = extractQualifiedTeams(rankings);
        }
        
        if (qualifiedTeams.isEmpty()) {
            throw new IllegalArgumentException("Aucune équipe disponible pour générer le bracket");
        }

        System.out.println("🔥 Équipes qualifiées extraites: " + qualifiedTeams.size());

        // 🔥 GÉNÉRATION AVEC SYSTÈME BYE
        List<Match> matches = dynamicBracketGenerator.generateKnockoutWithByes(
            qualifiedTeams,
            event
        );
        System.out.println("🔥 Matchs générés: " + matches.size());

        // 🔥 PHASE DIRECTEMENT EN KNOCKOUT
        event.setTournamentPhase(TournamentPhase.KNOCKOUT_STAGE);

        System.out.println("🔥 Sauvegarde des matchs...");
        matchRepository.saveAll(matches);
        System.out.println("🔥 Sauvegarde de l'event...");
        eventService.save(event);
        System.out.println("🔥 SUCCÈS !");
        
        return matches;
        
    } catch (Exception e) {
        System.err.println("🔥 ERREUR CATCHÉE: " + e.getClass().getName());
        System.err.println("🔥 MESSAGE: " + e.getMessage());
        e.printStackTrace();
        throw e;
    }
}


    // ==========================================================
    // 5️⃣ LECTURE DU BRACKET
    // ==========================================================
    public List<Match> getBracket(Long eventId) {
        return matchRepository.findByEventId(eventId)
                .stream()
                .filter(m -> m.getRound() != null)
                .toList();
    }


    private int highestPowerOfTwo(int n) {
    int power = 1;
    while (power * 2 <= n) {
        power *= 2;
    }
    return power;
}



private List<Team> extractQualifiedTeams(
        Map<?, ? extends List<?>> rankings
) {
    List<Team> teams = new ArrayList<>();

    List<?> firstList = rankings.values().iterator().next();
    Object firstValue = firstList.get(0);

    if (firstValue instanceof TeamStats) {
        for (List<?> list : rankings.values()) {
            for (Object o : list) {
                TeamStats ts = (TeamStats) o;
                teams.add(ts.getTeam());
            }
        }
        return teams;
    }

    if (firstValue instanceof GroupRankingDTO) {
        for (List<?> list : rankings.values()) {
            for (Object o : list) {
                GroupRankingDTO dto = (GroupRankingDTO) o;
                Team team = eventService.getTeamById(dto.getTeamId());
                teams.add(team);
            }
        }
        return teams;
    }

    // 🔒 sécurité Java obligatoire
    throw new IllegalArgumentException(
        "Type de classement non supporté : " + firstValue.getClass()
    );
}



}
