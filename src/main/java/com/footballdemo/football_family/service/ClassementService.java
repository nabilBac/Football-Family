package com.footballdemo.football_family.service;

import com.footballdemo.football_family.model.Match;
import com.footballdemo.football_family.dto.TeamStats;
import com.footballdemo.football_family.repository.MatchRepository;

import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.*;

@Service
public class ClassementService {

    @Autowired
    private MatchRepository matchRepository;

    public List<TeamStats> computeRanking(Long groupId) {

        List<Match> matches = matchRepository.findByGroupId(groupId);

        Map<Long, TeamStats> stats = computeBaseStats(matches);

        List<TeamStats> list = new ArrayList<>(stats.values());

        list.sort((a, b) -> {

            // 1. Points
            if (a.getPoints() != b.getPoints()) {
                return b.getPoints() - a.getPoints();
            }

            // 2. Différence de buts
            int diffA = a.getGoalsFor() - a.getGoalsAgainst();
            int diffB = b.getGoalsFor() - b.getGoalsAgainst();
            if (diffA != diffB) {
                return diffB - diffA;
            }

            // 3. Buts marqués
            if (a.getGoalsFor() != b.getGoalsFor()) {
                return b.getGoalsFor() - a.getGoalsFor();
            }

            // 4. Confrontation directe
            int direct = compareHeadToHead(a, b, matches);
            if (direct != 0) return direct;

            // 5. Tirage au sort
            return Math.random() < 0.5 ? -1 : 1;
        });

        return list;
    }

    // ------------------------
    //   CONFRONTATION DIRECTE
    // ------------------------
  private int compareHeadToHead(TeamStats a, TeamStats b, List<Match> matches) {

    int goalsA = 0;
    int goalsB = 0;

    for (Match m : matches) {

        // 🔥 PROTECTION : ignorer les matchs KO, consolante, etc.
        if (m.getTeamA() == null || m.getTeamB() == null) {
            continue;
        }

        // Match A → B
        if (Objects.equals(m.getTeamA().getId(), a.getTeamId())
                && Objects.equals(m.getTeamB().getId(), b.getTeamId())) {

            goalsA += m.getScoreTeamA() != null ? m.getScoreTeamA() : 0;
            goalsB += m.getScoreTeamB() != null ? m.getScoreTeamB() : 0;
        }

        // Match B → A (retour)
        if (Objects.equals(m.getTeamA().getId(), b.getTeamId())
                && Objects.equals(m.getTeamB().getId(), a.getTeamId())) {

            goalsA += m.getScoreTeamB() != null ? m.getScoreTeamB() : 0;
            goalsB += m.getScoreTeamA() != null ? m.getScoreTeamA() : 0;
        }
    }

    return Integer.compare(goalsB, goalsA);
}


    // ------------------------
    //  STATS DES MATCHS DE POULE
    // ------------------------
 private Map<Long, TeamStats> computeBaseStats(List<Match> matches) {

    Map<Long, TeamStats> stats = new HashMap<>();

    for (Match m : matches) {

        // 🔥  PROTECTION ABSOLUE : ignorer les matchs sans équipes
        if (m.getTeamA() == null || m.getTeamB() == null) {
            continue;
        }

        Long idA = m.getTeamA().getId();
        Long idB = m.getTeamB().getId();

        stats.putIfAbsent(idA, new TeamStats(m.getTeamA()));
        stats.putIfAbsent(idB, new TeamStats(m.getTeamB()));

        TeamStats sA = stats.get(idA);
        TeamStats sB = stats.get(idB);

        int scoreA = m.getScoreTeamA() != null ? m.getScoreTeamA() : 0;
        int scoreB = m.getScoreTeamB() != null ? m.getScoreTeamB() : 0;

        // Buts
        sA.addGoalsFor(scoreA);
        sA.addGoalsAgainst(scoreB);

        sB.addGoalsFor(scoreB);
        sB.addGoalsAgainst(scoreA);

        // Points
        if (scoreA > scoreB) {
            sA.addPoints(3);
        } else if (scoreA < scoreB) {
            sB.addPoints(3);
        } else {
            sA.addPoints(1);
            sB.addPoints(1);
        }
    }

    return stats;
}


    public Map<Long, List<TeamStats>> computeRankingsForEvent(Long eventId) {

    Map<Long, List<TeamStats>> result = new HashMap<>();

    // Trouver tous les groupes liés à l’event
   List<Long> groupIds = matchRepository.findDistinctGroupIdsByEvent(eventId)
        .stream()
        .filter(Objects::nonNull) // supprime groupId = null (KO + Consolante)
        .toList();


    for (Long groupId : groupIds) {
        List<TeamStats> ranking = computeRanking(groupId);
        result.put(groupId, ranking);
    }

    return result;
}

}
