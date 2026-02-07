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
            int diffA = a.getGoalDifference();
            int diffB = b.getGoalDifference();
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
            return Long.compare(a.getTeamId(), b.getTeamId());

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

        // ignorer les matchs sans équipes
        if (m.getTeamA() == null || m.getTeamB() == null) continue;
        if (m.getScoreTeamA() == null || m.getScoreTeamB() == null) continue;

        // ✅ ignorer les matchs non scorés (sinon tu les comptes en 0-0)
        if (m.getScoreTeamA() == null || m.getScoreTeamB() == null) continue;

        Long idA = m.getTeamA().getId();
        Long idB = m.getTeamB().getId();

        stats.putIfAbsent(idA, new TeamStats(m.getTeamA()));
        stats.putIfAbsent(idB, new TeamStats(m.getTeamB()));

        TeamStats sA = stats.get(idA);
        TeamStats sB = stats.get(idB);

        int scoreA = m.getScoreTeamA();
        int scoreB = m.getScoreTeamB();

        // ✅ UNE seule méthode qui met tout à jour (played, points, win/draw/loss, GF/GA)
        sA.recordMatch(scoreA, scoreB);
        sB.recordMatch(scoreB, scoreA);
    }

    return stats;
}



    public Map<Long, List<TeamStats>> computeRankingsForEvent(Long eventId) {

        Map<Long, List<TeamStats>> result = new HashMap<>();

        // Trouver tous les groupes liés à l'event
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