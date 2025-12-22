package com.footballdemo.football_family.service;

import com.footballdemo.football_family.model.Match;
import com.footballdemo.football_family.model.Event;
import com.footballdemo.football_family.model.TournamentGroup;
import com.footballdemo.football_family.dto.TeamStats;
import com.footballdemo.football_family.model.MatchStatus;

import com.footballdemo.football_family.repository.EventRepository;
import com.footballdemo.football_family.repository.TournamentGroupRepository;
import com.footballdemo.football_family.repository.MatchRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;

@Service
public class KnockoutService {

    @Autowired private EventRepository eventRepository;
    @Autowired private TournamentGroupRepository groupRepository;
    @Autowired private ClassementService classementService;
    @Autowired private MatchRepository matchRepository;

    // -----------------------------
    // GENERATION DE LA PHASE FINALE
    // -----------------------------
    public List<Match> generateKnockoutStage(Long eventId) {

        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        List<TournamentGroup> groups = groupRepository.findByEventId(eventId);
        int nbGroups = groups.size();

        if (nbGroups == 2) return generateSemiFinalsTwoGroups(groups, event);
        if (nbGroups == 3) return generateSemiFinalsThreeGroups(groups, event);
        if (nbGroups == 4) return generateQuarterFinals(groups, event);

        throw new RuntimeException("Unsupported number of groups: " + nbGroups);
    }

    // -------------------------------
    // 2 GROUPES → DEMI-FINALES
    // -------------------------------
    private List<Match> generateSemiFinalsTwoGroups(List<TournamentGroup> groups, Event event) {

        List<TeamStats> rankA = classementService.computeRanking(groups.get(0).getId());
        List<TeamStats> rankB = classementService.computeRanking(groups.get(1).getId());

        Match semi1 = createKO(rankA.get(0).getTeam(), rankB.get(1).getTeam(), "Semi-final", event);
        Match semi2 = createKO(rankB.get(0).getTeam(), rankA.get(1).getTeam(), "Semi-final", event);

        Match finalMatch = createKO(null, null, "Final", event);

        // Winner progression
        semi1.setNextMatch(finalMatch);
        semi1.setNextSlot("A");

        semi2.setNextMatch(finalMatch);
        semi2.setNextSlot("B");

        matchRepository.save(semi1);
        matchRepository.save(semi2);
        matchRepository.save(finalMatch);

        return List.of(semi1, semi2, finalMatch);
    }

    // -------------------------------
    // 3 GROUPES → Demi-finales
    // -------------------------------
    private List<Match> generateSemiFinalsThreeGroups(List<TournamentGroup> groups, Event event) {

        List<TeamStats> firsts = new ArrayList<>();
        List<TeamStats> seconds = new ArrayList<>();

        for (TournamentGroup g : groups) {
            List<TeamStats> ranking = classementService.computeRanking(g.getId());
            firsts.add(ranking.get(0));
            seconds.add(ranking.get(1));
        }

        // Meilleur 2e
        seconds.sort((a, b) -> {
            int diffA = a.getGoalsFor() - a.getGoalsAgainst();
            int diffB = b.getGoalsFor() - b.getGoalsAgainst();

            if (a.getPoints() != b.getPoints()) return b.getPoints() - a.getPoints();
            if (diffA != diffB) return diffB - diffA;
            return b.getGoalsFor() - a.getGoalsFor();
        });

        TeamStats bestSecond = seconds.get(0);

        Match semi1 = createKO(firsts.get(0).getTeam(), firsts.get(1).getTeam(), "Semi-final", event);
        Match semi2 = createKO(firsts.get(2).getTeam(), bestSecond.getTeam(), "Semi-final", event);

        Match finalMatch = createKO(null, null, "Final", event);

        semi1.setNextMatch(finalMatch);
        semi1.setNextSlot("A");

        semi2.setNextMatch(finalMatch);
        semi2.setNextSlot("B");

        matchRepository.save(semi1);
        matchRepository.save(semi2);
        matchRepository.save(finalMatch);

        return List.of(semi1, semi2, finalMatch);
    }

    // -------------------------------
    // 4 GROUPES → QUARTS → DEMIS → FINALE
    // -------------------------------
    private List<Match> generateQuarterFinals(List<TournamentGroup> groups, Event event) {

        List<TeamStats> firsts = new ArrayList<>();
        List<TeamStats> seconds = new ArrayList<>();

        for (TournamentGroup g : groups) {
            List<TeamStats> ranking = classementService.computeRanking(g.getId());
            firsts.add(ranking.get(0));
            seconds.add(ranking.get(1));
        }

        // QUARTS
        Match qf1 = createKO(firsts.get(0).getTeam(), seconds.get(3).getTeam(), "Quarter-final", event);
        Match qf2 = createKO(firsts.get(1).getTeam(), seconds.get(2).getTeam(), "Quarter-final", event);
        Match qf3 = createKO(firsts.get(2).getTeam(), seconds.get(1).getTeam(), "Quarter-final", event);
        Match qf4 = createKO(firsts.get(3).getTeam(), seconds.get(0).getTeam(), "Quarter-final", event);

        // DEMIS (vides au départ)
        Match semi1 = createKO(null, null, "Semi-final", event);
        Match semi2 = createKO(null, null, "Semi-final", event);

        // FINALE
        Match finalMatch = createKO(null, null, "Final", event);

        // LIAISONS BRACKET (mode UEFA)
        qf1.setNextMatch(semi1); qf1.setNextSlot("A");
        qf2.setNextMatch(semi1); qf2.setNextSlot("B");

        qf3.setNextMatch(semi2); qf3.setNextSlot("A");
        qf4.setNextMatch(semi2); qf4.setNextSlot("B");

        semi1.setNextMatch(finalMatch); semi1.setNextSlot("A");
        semi2.setNextMatch(finalMatch); semi2.setNextSlot("B");

        matchRepository.saveAll(List.of(qf1,qf2,qf3,qf4, semi1, semi2, finalMatch));

        return List.of(qf1,qf2,qf3,qf4, semi1, semi2, finalMatch);
    }

    // -------------------------------
    // CREATION D'UN MATCH KO
    // -------------------------------
    private Match createKO(
            com.footballdemo.football_family.model.Team teamA,
            com.footballdemo.football_family.model.Team teamB,
            String round,
            Event event
    ) {
        Match m = new Match();
        m.setTeamA(teamA);
        m.setTeamB(teamB);
        m.setEvent(event);
        m.setRound(round);
        m.setStatus(MatchStatus.SCHEDULED);
        m.setDate(event.getDate() != null ? event.getDate() : LocalDate.now());
        m.setScoreTeamA(0);
        m.setScoreTeamB(0);

        return matchRepository.save(m);
    }
}
