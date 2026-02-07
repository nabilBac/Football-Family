package com.footballdemo.football_family.service;

import com.footballdemo.football_family.dto.TeamStats;
import com.footballdemo.football_family.dto.GroupRankingDTO;
import com.footballdemo.football_family.model.Event;
import com.footballdemo.football_family.model.Match;

import com.footballdemo.football_family.model.Team;
import com.footballdemo.football_family.repository.EventRepository;
import com.footballdemo.football_family.repository.MatchRepository;
import com.footballdemo.football_family.repository.TeamRepository;
import com.footballdemo.football_family.model.MatchStatus;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;


import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.footballdemo.football_family.model.TournamentPhase;
import java.util.stream.Collectors;
import java.util.*;


@Service
@RequiredArgsConstructor
public class BracketService {

    private static final Logger log = LoggerFactory.getLogger(BracketService.class);
    private final MatchRepository matchRepository;
    private final EventService eventService;
    private final TournamentRulesService tournamentRulesService;
    private final DynamicBracketGenerator dynamicBracketGenerator;
    private final TeamRepository teamRepository;
    private final EventRepository eventRepository; 
    private final ClassementService classementService;
    private final SemiDirectedDrawService semiDirectedDrawService;



    

    // ==========================================================
    // 1️⃣ MÉTHODE PUBLIQUE UNIQUE
    // ==========================================================
public List<Match> generateBracket(
        Long eventId,
        Map<?, ? extends List<?>> rankings
) {
    log.error("🔥🔥🔥 DÉBUT generateBracket eventId={}", eventId);
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
           qualifiedTeams = extractQualifiedTeams(eventId, rankings);
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


private List<Team> extractQualifiedTeams(Long eventId, Map<?, ? extends List<?>> rankings) {
    if (rankings == null || rankings.isEmpty()) {
        throw new IllegalArgumentException("Impossible d'extraire les équipes : classements vides");
    }

    Event event = eventRepository.findById(eventId)
            .orElseThrow(() -> new RuntimeException("Événement introuvable"));

    int qualifiedPerGroup = event.getQualifiedPerGroup();
    if (qualifiedPerGroup < 1) {
        throw new IllegalStateException("qualifiedPerGroup invalide: " + qualifiedPerGroup);
    }

    // ✅ NORMALISATION : String ou Long → Long
    Map<Long, List<?>> normalized = new HashMap<>();
    for (var e : rankings.entrySet()) {
        normalized.put(parseGroupKeyToLong(e.getKey()), (List<?>) e.getValue());
    }

    List<Long> sortedGroupIds = normalized.keySet().stream()
            .sorted()
            .toList();

    // Trouver un élément non vide pour déterminer le type
    Object firstValue = normalized.values().stream()
            .filter(l -> l != null && !l.isEmpty())
            .findFirst()
            .orElseThrow(() -> new IllegalArgumentException("Classements vides (listes internes vides)"))
            .get(0);

    List<Team> firsts = new ArrayList<>();
    List<Team> seconds = new ArrayList<>();

    for (Long groupId : sortedGroupIds) {
        List<?> list = normalized.get(groupId);
        if (list == null || list.isEmpty()) {
            throw new IllegalStateException("Classement vide pour groupId=" + groupId);
        }
        if (qualifiedPerGroup >= 2 && list.size() < 2) {
            throw new IllegalStateException("Pas assez de qualifiés pour groupId=" + groupId);
        }

       if (firstValue instanceof TeamStats) {

    @SuppressWarnings("unchecked")
    List<TeamStats> sorted = ((List<TeamStats>) list).stream()
            .sorted((a, b) -> {
                if (b.getPoints() != a.getPoints()) return b.getPoints() - a.getPoints();

                int diffA = a.getGoalsFor() - a.getGoalsAgainst();
                int diffB = b.getGoalsFor() - b.getGoalsAgainst();
                if (diffB != diffA) return diffB - diffA;

                return b.getGoalsFor() - a.getGoalsFor();
            })
            .toList();

    TeamStats ts1 = sorted.get(0);
    if (ts1.getTeam() == null) throw new IllegalStateException("Team null (1er) groupId=" + groupId);
    firsts.add(ts1.getTeam());

    if (qualifiedPerGroup >= 2) {
        TeamStats ts2 = sorted.get(1);
        if (ts2.getTeam() == null) throw new IllegalStateException("Team null (2e) groupId=" + groupId);
        seconds.add(ts2.getTeam());
    }
}
else if (firstValue instanceof GroupRankingDTO) {

    @SuppressWarnings("unchecked")
    List<GroupRankingDTO> sortedList = ((List<GroupRankingDTO>) list).stream()
        .sorted((a, b) -> {

            // 1) Points
            int cmp = Integer.compare(b.getPoints(), a.getPoints());
            if (cmp != 0) return cmp;

            // 2) Goal average / différence de buts
            int diffA = a.getGoalsFor() - a.getGoalsAgainst();
            int diffB = b.getGoalsFor() - b.getGoalsAgainst();
            cmp = Integer.compare(diffB, diffA);
            if (cmp != 0) return cmp;

            // 3) Buts marqués
            cmp = Integer.compare(b.getGoalsFor(), a.getGoalsFor());
            if (cmp != 0) return cmp;

            // 4) Victoires
            cmp = Integer.compare(b.getWins(), a.getWins());
            if (cmp != 0) return cmp;

            // 5) Fair-play (plus petit = meilleur)
            int fairA = a.getYellowCards() + (a.getRedCards() * 3);
            int fairB = b.getYellowCards() + (b.getRedCards() * 3);
            cmp = Integer.compare(fairA, fairB);
            if (cmp != 0) return cmp;

            // 6) Dernier recours stable
            return Long.compare(a.getTeamId(), b.getTeamId());
        })
        .toList();

    GroupRankingDTO dto1 = sortedList.get(0);
    Team t1 = eventService.getTeamById(dto1.getTeamId());
    if (t1 == null) throw new IllegalStateException("Team introuvable id=" + dto1.getTeamId());
    firsts.add(t1);

    if (qualifiedPerGroup >= 2) {
        GroupRankingDTO dto2 = sortedList.get(1);
        Team t2 = eventService.getTeamById(dto2.getTeamId());
        if (t2 == null) throw new IllegalStateException("Team introuvable id=" + dto2.getTeamId());
        seconds.add(t2);
    }
}
 else {
            throw new IllegalArgumentException("Type non supporté : " + firstValue.getClass().getSimpleName());
        }
    }

    try {
    java.nio.file.Files.writeString(
        java.nio.file.Paths.get("C:/Users/drika/debug-teams.txt"),
        "FIRSTS:\n" + 
        firsts.stream().map(t -> "  - " + t.getName() + " (id=" + t.getId() + ")").collect(java.util.stream.Collectors.joining("\n")) + "\n\n" +
        "SECONDS:\n" + 
        seconds.stream().map(t -> "  - " + t.getName() + " (id=" + t.getId() + ")").collect(java.util.stream.Collectors.joining("\n")) + "\n"
    );
} catch (Exception ex) { ex.printStackTrace(); }

    // ✅ UEFA 4 groupes x 2 qualifiés
   if (sortedGroupIds.size() == 4 && qualifiedPerGroup >= 2) {
    if (firsts.size() != 4 || seconds.size() != 4) {
        throw new IllegalStateException("Incohérence qualifiés: firsts=" + firsts.size() + ", seconds=" + seconds.size());
    }

   System.err.println("🔥 FIRSTS : " + firsts.stream().map(Team::getName).toList());
System.err.println("🔥 SECONDS : " + seconds.stream().map(Team::getName).toList());

    
    List<Team> result = new ArrayList<>(List.of(
            firsts.get(0), seconds.get(3),
            firsts.get(1), seconds.get(2),
            firsts.get(2), seconds.get(1),
            firsts.get(3), seconds.get(0)
    ));
    
    System.err.println("🔥 UEFA SEED : " + result.stream().map(Team::getName).toList());
    try {
    java.nio.file.Files.writeString(
        java.nio.file.Paths.get("C:/debug-uefa-seed.txt"),
        "RESULT (UEFA SEED):\n" + 
        result.stream().map(t -> "  - " + t.getName() + " (id=" + t.getId() + ")").collect(java.util.stream.Collectors.joining("\n")) + "\n"
    );
} catch (Exception ex) { ex.printStackTrace(); }
    return result;
}

// ✅ UEFA 8 GROUPES x 2 QUALIFIÉS (16 ÉQUIPES)
if (sortedGroupIds.size() == 8 && qualifiedPerGroup >= 2) {
    if (firsts.size() != 8 || seconds.size() != 8) {
        throw new IllegalStateException("Incohérence qualifiés: firsts=" + firsts.size() + ", seconds=" + seconds.size());
    }
    
    List<Team> result = new ArrayList<>(List.of(
        firsts.get(0), seconds.get(7),
        firsts.get(1), seconds.get(6),
        firsts.get(2), seconds.get(5),
        firsts.get(3), seconds.get(4),
        firsts.get(4), seconds.get(3),
        firsts.get(5), seconds.get(2),
        firsts.get(6), seconds.get(1),
        firsts.get(7), seconds.get(0)
    ));
    
    return result;
}

// ✅ UEFA 16 GROUPES x 2 QUALIFIÉS (32 ÉQUIPES)
if (sortedGroupIds.size() == 16 && qualifiedPerGroup >= 2) {
    if (firsts.size() != 16 || seconds.size() != 16) {
        throw new IllegalStateException("Incohérence qualifiés: firsts=" + firsts.size() + ", seconds=" + seconds.size());
    }
    
    List<Team> result = new ArrayList<>(List.of(
        firsts.get(0), seconds.get(15),
        firsts.get(1), seconds.get(14),
        firsts.get(2), seconds.get(13),
        firsts.get(3), seconds.get(12),
        firsts.get(4), seconds.get(11),
        firsts.get(5), seconds.get(10),
        firsts.get(6), seconds.get(9),
        firsts.get(7), seconds.get(8),
        firsts.get(8), seconds.get(7),
        firsts.get(9), seconds.get(6),
        firsts.get(10), seconds.get(5),
        firsts.get(11), seconds.get(4),
        firsts.get(12), seconds.get(3),
        firsts.get(13), seconds.get(2),
        firsts.get(14), seconds.get(1),
        firsts.get(15), seconds.get(0)
    ));
    
    return result;
}
// ✅ UEFA 32 GROUPES x 2 QUALIFIÉS (64 ÉQUIPES)
if (sortedGroupIds.size() == 32 && qualifiedPerGroup >= 2) {
    if (firsts.size() != 32 || seconds.size() != 32) {
        throw new IllegalStateException("Incohérence qualifiés: firsts=" + firsts.size() + ", seconds=" + seconds.size());
    }
    
    List<Team> result = new ArrayList<>();
    for (int i = 0; i < 32; i++) {
        result.add(firsts.get(i));
        result.add(seconds.get(31 - i));  // Seeding UEFA
    }
    
    return result;
}

    // 2 groupes x 2 qualifiés
    if (sortedGroupIds.size() == 2 && qualifiedPerGroup >= 2) {
        if (firsts.size() != 2 || seconds.size() != 2) {
            throw new IllegalStateException("Incohérence qualifiés");
        }
        return new ArrayList<>(List.of(
                firsts.get(0), seconds.get(1),
                firsts.get(1), seconds.get(0)
        ));
    }

    // fallback
    List<Team> result = new ArrayList<>();
    int maxSize = Math.max(firsts.size(), seconds.size());
    for (int i = 0; i < maxSize; i++) {
        if (i < firsts.size()) result.add(firsts.get(i));
        if (i < seconds.size()) result.add(seconds.get(i));
    }
    return result;
}

private Long parseGroupKeyToLong(Object key) {
    if (key instanceof Number n) return n.longValue();
    try {
        return Long.parseLong(String.valueOf(key));
    } catch (NumberFormatException e) {
        throw new IllegalArgumentException("Clé de groupe non numérique: " + key);
    }
}
@Transactional
    public List<Match> generateSemiDirectedBracket(Long eventId) {
        Event event = eventService.getEventById(eventId);

        Map<Long, List<TeamStats>> rankings = classementService.computeRankingsForEvent(eventId);
        List<Match> groupMatches = matchRepository.findByEventIdAndGroupIdIsNotNull(eventId);
      List<SemiDirectedDrawService.Pair<Team, Team>> pairs =
      semiDirectedDrawService.drawChampionsLeague(eventId, rankings, groupMatches);



        if (pairs.isEmpty()) {
            throw new IllegalStateException("Aucune paire générée pour le bracket");
        }

        // 🔥 Création du PREMIER TOUR avec le bon label
        List<Match> firstRoundMatches = new ArrayList<>();
        int firstRoundTeamCount = pairs.size() * 2;
        String firstRoundLabel = determineRoundLabel(firstRoundTeamCount);

        for (SemiDirectedDrawService.Pair<Team, Team> pair : pairs) {
            Match match = new Match();
            match.setEvent(event);
            match.setTeamA(pair.first);
            match.setTeamB(pair.second);
            match.setRound(firstRoundLabel);
            match.setStatus(MatchStatus.SCHEDULED);
            match.setDate(event.getDate());
            firstRoundMatches.add(match);
        }

        matchRepository.saveAll(firstRoundMatches);

        List<Match> nextRounds = dynamicBracketGenerator.generateRemainingRounds(firstRoundMatches, event);
        matchRepository.saveAll(nextRounds);

        event.setTournamentPhase(TournamentPhase.KNOCKOUT_STAGE);
        eventService.save(event);

        List<Match> allMatches = new ArrayList<>();
        allMatches.addAll(firstRoundMatches);
        allMatches.addAll(nextRounds);

        return allMatches;
    }

    private String determineRoundLabel(int teamCount) {
        if (teamCount == 2) return "FINALE";
        if (teamCount == 4) return "DEMI-FINALE";
        if (teamCount == 8) return "QUART DE FINALE";
        if (teamCount == 16) return "HUITIÈME DE FINALE";
        if (teamCount == 32) return "SEIZIÈME DE FINALE";
        if (teamCount == 64) return "1/32e DE FINALE";
        if (teamCount == 128) return "1/64e DE FINALE";
        return "1/" + (teamCount/2) + "e DE FINALE";
    }             

}
