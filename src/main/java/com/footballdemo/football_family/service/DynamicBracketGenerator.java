package com.footballdemo.football_family.service;

import com.footballdemo.football_family.model.Event;
import com.footballdemo.football_family.model.Match;
import com.footballdemo.football_family.model.MatchStatus;
import com.footballdemo.football_family.model.Team;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
public class DynamicBracketGenerator {

    /**
     * 🎯 GÉNÉRATION AVEC SYSTÈME BYE PROFESSIONNEL
     * 
     * Exemple avec 13 équipes :
     * - Tour 1 (R16) : 10 équipes → 5 matchs
     * - BYES : 3 meilleures équipes exemptées
     * - QF : 8 équipes (3 byes + 5 vainqueurs)
     */
    public List<Match> generateKnockoutWithByes(List<Team> qualifiedTeams, Event event) {
        
        int teamCount = qualifiedTeams.size();
        int targetSize = highestPowerOfTwo(teamCount);
        
        List<Match> allMatches = new ArrayList<>();
        
        // ===========================================
        // 🔹 CAS 1 : Nombre impair → Génération avec BYES
        // ===========================================
        if (teamCount > targetSize) {
            
            int byeCount = 2 * targetSize - teamCount;
            int firstRoundCount = teamCount - byeCount;
            
            System.out.println("🎯 Génération avec BYES:");
            System.out.println("   - Total équipes: " + teamCount);
            System.out.println("   - Target size: " + targetSize);
            System.out.println("   - Équipes en BYE: " + byeCount);
            System.out.println("   - Équipes au 1er tour: " + firstRoundCount);
            
            // 🔹 Équipes exemptées (les meilleures)
            List<Team> byeTeams = qualifiedTeams.subList(0, byeCount);
            
            // 🔹 Équipes qui jouent le 1er tour
            List<Team> firstRoundTeams = qualifiedTeams.subList(byeCount, teamCount);
            
            // 🔹 Générer les matchs du 1er tour
            String firstRoundLabel = roundLabel(targetSize * 2); // Ex: R16 pour 16
            List<Match> firstRoundMatches = new ArrayList<>();
            
            for (int i = 0; i < firstRoundTeams.size(); i += 2) {
                Match m = createMatch(
                    event,
                    firstRoundTeams.get(i),
                    firstRoundTeams.get(i + 1),
                    firstRoundLabel
                );
                firstRoundMatches.add(m);
                allMatches.add(m);
            }
            
            // 🔹 Générer les tours suivants avec placeholders
            allMatches.addAll(
                generateSubsequentRounds(targetSize, event, firstRoundMatches, byeTeams)
            );
        }
        // ===========================================
        // 🔹 CAS 2 : Puissance de 2 → Génération classique
        // ===========================================
        else {
            System.out.println("🎯 Génération classique (puissance de 2)");
            allMatches.addAll(generateStandardKnockout(qualifiedTeams, event));
        }
        
        return allMatches;
    }

    /**
     * Génère les tours suivants avec BYES intégrés
     */
 /**
 * Génère les tours suivants avec BYES intégrés
 */
private List<Match> generateSubsequentRounds(
    int targetSize,
    Event event,
    List<Match> firstRoundMatches,
    List<Team> byeTeams
) {
    List<Match> allMatches = new ArrayList<>();
    
    // 🔹 Générer les matchs des quarts avec BYES
    String nextRoundLabel = roundLabel(targetSize);
    List<Match> qfMatches = new ArrayList<>();
    
    int byeIndex = 0;
    int matchIndex = 0;
    
    // STRATÉGIE PROFESSIONNELLE :
    // 1. Les équipes en BYE prennent les premiers slots
    // 2. Les vainqueurs des matchs du 1er tour prennent les slots restants
    
    for (int i = 0; i < targetSize / 2; i++) {
        Match qfMatch = createMatch(event, null, null, nextRoundLabel);
        
        // Assigner teamA
        if (byeIndex < byeTeams.size()) {
            // Équipe en BYE prend le slot A
            qfMatch.setTeamA(byeTeams.get(byeIndex));
            byeIndex++;
        } else if (matchIndex < firstRoundMatches.size()) {
            // Vainqueur du match prend le slot A
            link(firstRoundMatches.get(matchIndex), qfMatch, "A");
            matchIndex++;
        }
        
        // Assigner teamB
        if (matchIndex < firstRoundMatches.size()) {
            // Vainqueur du match prend le slot B
            link(firstRoundMatches.get(matchIndex), qfMatch, "B");
            matchIndex++;
        } else if (byeIndex < byeTeams.size()) {
            // Équipe en BYE prend le slot B
            qfMatch.setTeamB(byeTeams.get(byeIndex));
            byeIndex++;
        }
        
        qfMatches.add(qfMatch);
        allMatches.add(qfMatch);
    }
    
    System.out.println("🎯 QF générés : " + qfMatches.size() + " matchs");
    System.out.println("   - BYES assignés : " + byeIndex);
    System.out.println("   - Matchs R16 liés : " + matchIndex);
    
    // 🔹 Générer les tours restants (SF, FINAL)
    allMatches.addAll(generateRemainingRounds(qfMatches, event));
    
    return allMatches;
}

    /**
     * Génération classique sans BYES (puissance de 2)
     */
    private List<Match> generateStandardKnockout(List<Team> teams, Event event) {
        List<Match> allMatches = new ArrayList<>();
        List<Match> previousRound = new ArrayList<>();
        
        String round = roundLabel(teams.size());
        
        for (int i = 0; i < teams.size(); i += 2) {
            Match m = createMatch(event, teams.get(i), teams.get(i + 1), round);
            previousRound.add(m);
            allMatches.add(m);
        }
        
        allMatches.addAll(generateRemainingRounds(previousRound, event));
        
        return allMatches;
    }

    /**
     * Génère les tours restants (SF, FINAL)
     */
    private List<Match> generateRemainingRounds(List<Match> previousRound, Event event) {
        List<Match> allMatches = new ArrayList<>();
        int roundSize = previousRound.size();
        
        while (roundSize > 1) {
            List<Match> nextRound = new ArrayList<>();
            String nextRoundLabel = roundLabel(roundSize);
            
            for (int i = 0; i < previousRound.size(); i += 2) {
                Match m = createMatch(event, null, null, nextRoundLabel);
                link(previousRound.get(i), m, "A");
                link(previousRound.get(i + 1), m, "B");
                
                nextRound.add(m);
                allMatches.add(m);
            }
            
            previousRound = nextRound;
            roundSize = previousRound.size();
        }
        
        return allMatches;
    }

    /* ========================= */
    /* MÉTHODES UTILITAIRES      */
    /* ========================= */

    private int highestPowerOfTwo(int n) {
        int power = 1;
        while (power * 2 <= n) {
            power *= 2;
        }
        return power;
    }

    private String roundLabel(int size) {
        if (size == 2) return "FINAL";
        if (size == 4) return "SF";
        if (size == 8) return "QF";
        if (size == 16) return "R16";
        if (size == 32) return "R32";
        return "R" + size;
    }

    protected Match createMatch(Event event, Team a, Team b, String round) {
        Match m = new Match();
        m.setEvent(event);
        m.setTeamA(a);
        m.setTeamB(b);
        m.setRound(round);
        m.setStatus(MatchStatus.SCHEDULED);
        m.setDate(LocalDate.now());
        return m;
    }

    private void link(Match from, Match to, String slot) {
        from.setNextMatch(to);
        from.setNextSlot(slot);
    }

    public void propagateWinner(Match match, Team winner) {
        if (match == null || winner == null) return;
        if (match.getNextMatch() == null) return;
        
        Match next = match.getNextMatch();
        
        if ("A".equals(match.getNextSlot())) {
            next.setTeamA(winner);
        } else if ("B".equals(match.getNextSlot())) {
            next.setTeamB(winner);
        }
    }
}