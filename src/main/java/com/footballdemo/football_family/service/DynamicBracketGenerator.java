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
            
            // 🏆 DISTRIBUTION INTELLIGENTE DES BYES
            // Les équipes en BYE sont les meilleures (positions paires après seeding UEFA)
            List<Team> byeTeams = new ArrayList<>();
            List<Team> firstRoundTeams = new ArrayList<>();

            // Stratégie : prendre les meilleurs (indices pairs) pour les BYE
            for (int i = 0; i < qualifiedTeams.size(); i++) {
                if (byeTeams.size() < byeCount && i % 2 == 0) {
                    // Position paire (1er de groupe après seeding) → BYE
                    byeTeams.add(qualifiedTeams.get(i));
                } else {
                    // Autres équipes → jouent le 1er tour
                    firstRoundTeams.add(qualifiedTeams.get(i));
                }
            }

            System.out.println("🎯 BYES attribués aux équipes :");
            for (Team t : byeTeams) {
                System.out.println("   ✅ " + t.getName() + " (BYE)");
            }
            System.out.println("🎯 Équipes au 1er tour :");
            for (Team t : firstRoundTeams) {
                System.out.println("   ⚔️ " + t.getName());
            }
            
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
    public List<Match> generateRemainingRounds(List<Match> previousRound, Event event) {
        List<Match> allMatches = new ArrayList<>();
        int roundSize = previousRound.size();
        
        while (roundSize > 1) {
            List<Match> nextRound = new ArrayList<>();
            int nextMatchCount = roundSize / 2; // Nombre de matchs du prochain tour
            int nextTeamCount = nextMatchCount * 2; // 🔥 Nombre d'ÉQUIPES du prochain tour
            String roundName = roundLabel(nextTeamCount); // 🔥 CORRECT
            
            for (int i = 0; i < previousRound.size(); i += 2) {
                Match m = createMatch(event, null, null, roundName);
                link(previousRound.get(i), m, "A");
                link(previousRound.get(i + 1), m, "B");
                
                nextRound.add(m);
                allMatches.add(m);
            }
            
            previousRound = nextRound;
            roundSize = nextMatchCount;
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
        if (size == 2) return "FINALE";
        if (size == 4) return "DEMI-FINALE";
        if (size == 8) return "QUART DE FINALE";
       if (size == 16) return "HUITIEME DE FINALE";
        if (size == 32) return "SEIZIEME DE FINALE";
        if (size == 64) return "1/32e DE FINALE";
        if (size == 128) return "1/64e DE FINALE";
        return "1/" + (size/2) + "e DE FINALE";
    }

    protected Match createMatch(Event event, Team a, Team b, String round) {
        Match m = new Match();
        m.setEvent(event);
        m.setTeamA(a);
        m.setTeamB(b);
        m.setRound(round);
        m.setStatus(MatchStatus.SCHEDULED);
        m.setDate(event.getDate());
        return m;
    }

    private void link(Match from, Match to, String slot) {
        // ✅ VALIDATION
        if (from == null) {
            throw new IllegalArgumentException("Match source (from) ne peut pas être null");
        }
        if (to == null) {
            throw new IllegalArgumentException("Match destination (to) ne peut pas être null");
        }
        if (slot == null || (!slot.equals("A") && !slot.equals("B"))) {
            throw new IllegalArgumentException(
                "Slot doit être 'A' ou 'B', reçu : " + slot
            );
        }

        from.setNextMatch(to);
        from.setNextSlot(slot);
        
        // ✅ LOG pour debugging
        System.out.println("  🔗 Lien créé : Match " + from.getId() + 
                           " → Match " + to.getId() + " (slot " + slot + ")");
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