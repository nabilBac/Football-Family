package com.footballdemo.football_family.service;



import com.footballdemo.football_family.dto.TeamStats;
import com.footballdemo.football_family.model.Match;
import com.footballdemo.football_family.model.Team;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.footballdemo.football_family.model.Event;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SemiDirectedDrawService {

    private final EventService eventService; 

    /**
     * 🎯 Méthode principale
     * Génère les paires 1er vs 2e (autre poule, sans revanche)
     */
/**
 * 🎯 Méthode principale
 * Génère les paires 1er vs 2e (autre poule, sans revanche) avec SEEDING UEFA
 */
public List<Pair<Team, Team>> draw(
    Map<Long, List<TeamStats>> rankings,
    List<Match> groupMatches
) {
    // 1️⃣ Extraction des 1ers et 2es AVEC SEEDING UEFA
    List<Team> firsts = new ArrayList<>();
    List<Team> seconds = new ArrayList<>();
    
    List<Long> sortedGroupIds = rankings.keySet().stream()
            .sorted()
            .toList();
    
    // Extraire les équipes dans l'ordre des groupes
    for (Long groupId : sortedGroupIds) {
        List<TeamStats> list = rankings.get(groupId);
        if (list == null || list.isEmpty()) {
            throw new IllegalStateException("Classement vide pour groupId=" + groupId);
        }
        if (list.size() >= 1) {
            firsts.add(list.get(0).getTeam());
        }
        if (list.size() >= 2) {
            seconds.add(list.get(1).getTeam());
        }
    }
    
    // 2️⃣ APPLICATION DU SEEDING UEFA
    List<Team> seededOrder = applyUefaSeeding(firsts, seconds, sortedGroupIds.size());
    
    // 3️⃣ Reconstitution des DrawTeam avec le bon ordre
    List<DrawTeam> seededFirsts = new ArrayList<>();
    List<DrawTeam> seededSeconds = new ArrayList<>();
    
    // Les équipes seeded sont alternées : first, second, first, second...
    for (int i = 0; i < seededOrder.size(); i++) {
        Team team = seededOrder.get(i);
        Long originalGroupId = findGroupId(team, rankings);
        
        if (i % 2 == 0) {
            // Position paire = 1er
            seededFirsts.add(new DrawTeam(team, originalGroupId));
        } else {
            // Position impaire = 2e
            seededSeconds.add(new DrawTeam(team, originalGroupId));
        }
    }
    
    // 4️⃣ PAS de shuffle ! On garde l'ordre UEFA
    // Collections.shuffle(seconds, new Random(System.currentTimeMillis())); ← SUPPRIMÉ
    
    // 5️⃣ Tirage avec BACKTRACKING
    List<Pair<Team, Team>> result = new ArrayList<>();
    Set<Long> usedSeconds = new HashSet<>();

    if (!drawWithBacktracking(seededFirsts, seededSeconds, groupMatches, 0, result, usedSeconds)) {
        throw new IllegalStateException(
            "❌ Impossible de générer un tirage valide. Vérifiez les contraintes."
        );
    }

    System.out.println("✅ Tirage semi-dirigé UEFA réussi : " + result.size() + " paires");
    return result;
}

public List<Pair<Team, Team>> drawChampionsLeague(
        Long eventId,
        Map<Long, List<TeamStats>> rankings,
        List<Match> groupMatches
)
 {
    // Pot 1 / Pot 2 (winners / runners-up)
    List<DrawTeam> pot1 = new ArrayList<>();
    List<DrawTeam> pot2 = new ArrayList<>();

    List<Long> sortedGroupIds = rankings.keySet().stream().sorted().toList();

    for (Long groupId : sortedGroupIds) {
        List<TeamStats> list = rankings.get(groupId);
        if (list == null || list.size() < 2) {
            throw new IllegalStateException("Classement incomplet pour groupId=" + groupId);
        }
        pot1.add(new DrawTeam(list.get(0).getTeam(), groupId));
        pot2.add(new DrawTeam(list.get(1).getTeam(), groupId));
    }

    int maxAttempts = 200;

Event event = eventService.getEventById(eventId);


// seed persistant
Long baseSeed = event.getDrawSeed();
if (baseSeed == null) {
    baseSeed = System.currentTimeMillis();
    event.setDrawSeed(baseSeed);
    eventService.save(event); // ou eventRepository.save(event)
}



for (int attempt = 1; attempt <= maxAttempts; attempt++) {
    long attemptSeed = baseSeed + attempt;          // ✅ reproductible
    Random rnd = new Random(attemptSeed);

    List<DrawTeam> firsts = new ArrayList<>(pot1);
    List<DrawTeam> seconds = new ArrayList<>(pot2);

    Collections.shuffle(firsts, rnd);

    List<Pair<Team, Team>> result = new ArrayList<>();
    Set<Long> usedSeconds = new HashSet<>();

    if (drawWithBacktrackingRandom(firsts, seconds, groupMatches, 0, result, usedSeconds, rnd)) {
        System.out.println("🎲 LDC draw OK baseSeed=" + baseSeed + " attempt=" + attempt + " attemptSeed=" + attemptSeed);
        return result;
    }
}

throw new IllegalStateException("❌ Impossible de générer un tirage LDC valide après " + maxAttempts + " essais.");

}

private boolean drawWithBacktrackingRandom(
        List<DrawTeam> firsts,
        List<DrawTeam> seconds,
        List<Match> groupMatches,
        int index,
        List<Pair<Team, Team>> result,
        Set<Long> usedSeconds,
        Random rnd
) {
    if (index >= firsts.size()) return true;

    DrawTeam first = firsts.get(index);

    // Construire les candidats compatibles
    List<DrawTeam> candidates = new ArrayList<>();
    for (DrawTeam second : seconds) {
        if (usedSeconds.contains(second.team.getId())) continue;
        if (second.groupId.equals(first.groupId)) continue;           // pas même groupe
        if (havePlayed(first.team, second.team, groupMatches)) continue; // pas de revanche

        candidates.add(second);
    }

    // ✅ Randomiser l’ordre d’exploration des candidats
    Collections.shuffle(candidates, rnd);

    for (DrawTeam second : candidates) {
        result.add(Pair.of(first.team, second.team));
        usedSeconds.add(second.team.getId());

        if (drawWithBacktrackingRandom(firsts, seconds, groupMatches, index + 1, result, usedSeconds, rnd)) {
            return true;
        }

        result.remove(result.size() - 1);
        usedSeconds.remove(second.team.getId());
    }

    return false;
}


/**
 * 🏆 APPLICATION DU SEEDING UEFA (même logique que BracketService)
 */
private List<Team> applyUefaSeeding(List<Team> firsts, List<Team> seconds, int groupCount) {
    
    // ✅ UEFA 4 GROUPES x 2 QUALIFIÉS (8 ÉQUIPES)
    if (groupCount == 4 && firsts.size() == 4 && seconds.size() == 4) {
        return new ArrayList<>(List.of(
            firsts.get(0), seconds.get(3),
            firsts.get(1), seconds.get(2),
            firsts.get(2), seconds.get(1),
            firsts.get(3), seconds.get(0)
        ));
    }
    
    // ✅ UEFA 8 GROUPES x 2 QUALIFIÉS (16 ÉQUIPES)
    if (groupCount == 8 && firsts.size() == 8 && seconds.size() == 8) {
        return new ArrayList<>(List.of(
            firsts.get(0), seconds.get(7),
            firsts.get(1), seconds.get(6),
            firsts.get(2), seconds.get(5),
            firsts.get(3), seconds.get(4),
            firsts.get(4), seconds.get(3),
            firsts.get(5), seconds.get(2),
            firsts.get(6), seconds.get(1),
            firsts.get(7), seconds.get(0)
        ));
    }
    
    // ✅ UEFA 16 GROUPES x 2 QUALIFIÉS (32 ÉQUIPES)
    if (groupCount == 16 && firsts.size() == 16 && seconds.size() == 16) {
        List<Team> result = new ArrayList<>();
        for (int i = 0; i < 16; i++) {
            result.add(firsts.get(i));
            result.add(seconds.get(15 - i));
        }
        return result;
    }
    
    // ✅ UEFA 32 GROUPES x 2 QUALIFIÉS (64 ÉQUIPES)
    if (groupCount == 32 && firsts.size() == 32 && seconds.size() == 32) {
        List<Team> result = new ArrayList<>();
        for (int i = 0; i < 32; i++) {
            result.add(firsts.get(i));
            result.add(seconds.get(31 - i));
        }
        return result;
    }
    
    // ✅ UEFA 2 GROUPES x 2 QUALIFIÉS (4 ÉQUIPES)
    if (groupCount == 2 && firsts.size() == 2 && seconds.size() == 2) {
        return new ArrayList<>(List.of(
            firsts.get(0), seconds.get(1),
            firsts.get(1), seconds.get(0)
        ));
    }
    
    // FALLBACK : ordre alterné simple
    List<Team> result = new ArrayList<>();
    int maxSize = Math.max(firsts.size(), seconds.size());
    for (int i = 0; i < maxSize; i++) {
        if (i < firsts.size()) result.add(firsts.get(i));
        if (i < seconds.size()) result.add(seconds.get(i));
    }
    return result;
}

/**
 * 🔍 Retrouve le groupId d'une équipe dans les rankings
 */
private Long findGroupId(Team team, Map<Long, List<TeamStats>> rankings) {
    for (Map.Entry<Long, List<TeamStats>> entry : rankings.entrySet()) {
        for (TeamStats ts : entry.getValue()) {
            if (ts.getTeam().getId().equals(team.getId())) {
                return entry.getKey();
            }
        }
    }
    throw new IllegalStateException("Groupe introuvable pour team=" + team.getName());
}

/**
 * 🔄 ALGORITHME AVEC BACKTRACKING (comme UEFA/FIFA)
 * Garantit une solution si elle existe mathématiquement
 */
private boolean drawWithBacktracking(
        List<DrawTeam> firsts,
        List<DrawTeam> seconds,
        List<Match> groupMatches,
        int index,
        List<Pair<Team, Team>> result,
        Set<Long> usedSeconds
) {
    // Cas de base : tous les 1ers ont été appariés
    if (index >= firsts.size()) {
        return true;
    }

    DrawTeam first = firsts.get(index);

    // Essayer tous les 2es possibles
    for (DrawTeam second : seconds) {
        
        // Vérifier les contraintes
        if (usedSeconds.contains(second.team.getId())) {
            continue; // Déjà utilisé
        }
        
        if (second.groupId.equals(first.groupId)) {
            continue; // Même groupe
        }
        
        if (havePlayed(first.team, second.team, groupMatches)) {
            continue; // Revanche
        }

        // ✅ Adversaire valide → Essayer ce choix
        result.add(Pair.of(first.team, second.team));
        usedSeconds.add(second.team.getId());

        // Récursion : essayer d'apparier le prochain 1er
        if (drawWithBacktracking(firsts, seconds, groupMatches, index + 1, result, usedSeconds)) {
            return true; // ✅ Solution trouvée !
        }

        // ❌ Échec → BACKTRACK (annuler ce choix)
        result.remove(result.size() - 1);
        usedSeconds.remove(second.team.getId());
    }

    // Aucun adversaire valide trouvé pour ce 1er
    return false;
}

    /**
     * 🔍 Vérifie si deux équipes se sont déjà rencontrées en poule
     */
    private boolean havePlayed(Team a, Team b, List<Match> matches) {
        return matches.stream().anyMatch(m ->
                m.getTeamA() != null &&
                m.getTeamB() != null &&
                (
                    (m.getTeamA().getId().equals(a.getId()) &&
                     m.getTeamB().getId().equals(b.getId()))
                 || (m.getTeamA().getId().equals(b.getId()) &&
                     m.getTeamB().getId().equals(a.getId()))
                )
        );
    }

    /**
     * 📦 Classe interne utilitaire
     */
    private record DrawTeam(Team team, Long groupId) {}

    /**
     * 📦 Mini Pair (évite dépendance externe)
     */
    public static class Pair<A, B> {
        public final A first;
        public final B second;

        private Pair(A first, B second) {
            this.first = first;
            this.second = second;
        }

        public static <A, B> Pair<A, B> of(A a, B b) {
            return new Pair<>(a, b);
        }
    }
}
