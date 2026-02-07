package com.footballdemo.football_family.service;

import com.footballdemo.football_family.model.Event;
import com.footballdemo.football_family.model.Match;
import com.footballdemo.football_family.model.Team;
import com.footballdemo.football_family.dto.TeamStats;
import com.footballdemo.football_family.exception.DuplicateResourceException;
import com.footballdemo.football_family.repository.EventRepository;
import com.footballdemo.football_family.repository.MatchRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.footballdemo.football_family.model.TournamentPhase;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ConsolanteService {

    private final EventRepository eventRepository;
    private final MatchRepository matchRepository;
    private final DynamicBracketGenerator dynamicBracketGenerator;

    /**
     * 🏆 Génère le bracket de consolante (tournoi B) avec système BYE et SEEDING UEFA
     * - Récupère les équipes classées 3e et 4e des poules
     * - Applique un seeding UEFA (meilleur 3e vs pire 4e)
     * - Génère un bracket avec BYES si nombre impair
     * - Préfixe tous les rounds avec "C"
     */
    @Transactional
   public List<Match> generateConsolanteBracket(Long eventId,
                                             Map<String, List<TeamStats>> rankingsByGroup,
                                             boolean overwrite)
 {

        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Événement introuvable"));

        if (event.getTournamentPhase() != TournamentPhase.GROUP_STAGE_FINISHED &&
            event.getTournamentPhase() != TournamentPhase.KNOCKOUT_STAGE) {
            throw new IllegalStateException(
                "La consolante ne peut être générée qu'après les poules"
            );
        }

  List<Match> existing = matchRepository.findActiveByEventIdAndRoundStartingWith(eventId, "C");

if (!existing.isEmpty() && !overwrite) {
    throw new DuplicateResourceException("Consolante déjà générée. Utilise overwrite=true pour regénérer.");
}

if (overwrite) {
    matchRepository.clearNextLinksForConsolante(eventId);
    matchRepository.hardDeleteConsolante(eventId);
    existing = List.of(); // juste pour éviter toute confusion
}



        // ✅ FIX : Trier les groupes pour garantir un ordre déterministe
        List<String> sortedGroupKeys = new ArrayList<>(rankingsByGroup.keySet());
        Collections.sort(sortedGroupKeys); // Tri alphabétique/numérique

        System.out.println("🏆 Groupes traités dans l'ordre : " + sortedGroupKeys);

        // ✅ NOUVELLE LOGIQUE : Consolante = équipes NON qualifiées (selon qualifiedPerGroup)
int qualifiedPerGroup = event.getQualifiedPerGroup();
if (qualifiedPerGroup < 1) {
    throw new IllegalStateException("qualifiedPerGroup invalide: " + qualifiedPerGroup);
}

List<TeamStats> allStats = new ArrayList<>();
java.util.Set<Long> qualifiedTeamIds = new java.util.HashSet<>();

for (String groupKey : sortedGroupKeys) {
    List<TeamStats> stats = rankingsByGroup.get(groupKey);

    if (stats == null || stats.isEmpty()) {
        System.out.println("⚠️ Groupe " + groupKey + " : aucune équipe");
        continue;
    }

    // 1) On conserve toutes les stats de poules
    allStats.addAll(stats);

    // 2) On marque les qualifiés (top qualifiedPerGroup)
    int take = Math.min(qualifiedPerGroup, stats.size());
    for (int i = 0; i < take; i++) {
        Team t = stats.get(i).getTeam();
        if (t != null && t.getId() != null) {
            qualifiedTeamIds.add(t.getId());
        }
    }
}

// 3) Non-qualifiés = toutes équipes des poules - qualifiés
List<TeamStats> nonQualifiedStats = allStats.stream()
        .filter(ts -> ts.getTeam() != null && ts.getTeam().getId() != null)
        .filter(ts -> !qualifiedTeamIds.contains(ts.getTeam().getId()))
        .toList();

if (nonQualifiedStats.size() < 2) {
    throw new IllegalStateException(
            "Pas assez d'équipes NON qualifiées pour la consolante (minimum 2, trouvé : " + nonQualifiedStats.size() + ")"
    );
}

// 4) Seeding UEFA sur les non-qualifiés (points DESC, diff, buts)
// ================================
// ✅ UEFA STRICT : POT 3e vs POT 4e + pas même groupe
// ================================
record Entry(String groupKey, TeamStats ts) {}

java.util.Comparator<Entry> uefaDesc = (x, y) -> {
    TeamStats a = x.ts(), b = y.ts();
    if (b.getPoints() != a.getPoints()) return b.getPoints() - a.getPoints();
    int gdA = a.getGoalsFor() - a.getGoalsAgainst();
    int gdB = b.getGoalsFor() - b.getGoalsAgainst();
    if (gdB != gdA) return gdB - gdA;
    return b.getGoalsFor() - a.getGoalsFor();
};

java.util.Comparator<Entry> uefaAsc = (x, y) -> -uefaDesc.compare(x, y);

List<Entry> pot3 = new ArrayList<>(); // 3e de chaque groupe
List<Entry> pot4 = new ArrayList<>(); // 4e de chaque groupe

for (String groupKey : sortedGroupKeys) {
    List<TeamStats> stats = rankingsByGroup.get(groupKey);
    if (stats == null || stats.isEmpty()) continue;

    int thirdIndex  = qualifiedPerGroup;      // ex: qualifiés=2 -> index 2 = 3e
    int fourthIndex = qualifiedPerGroup + 1;  // index 3 = 4e

    if (thirdIndex < stats.size())  pot3.add(new Entry(groupKey, stats.get(thirdIndex)));
    if (fourthIndex < stats.size()) pot4.add(new Entry(groupKey, stats.get(fourthIndex)));
}

if (pot3.size() < 2 || pot4.size() < 2) {
    throw new IllegalStateException("Pas assez d'équipes (3e/4e) pour générer une consolante UEFA strict");
}

// Trier : meilleurs 3e d'abord, pires 4e d'abord
pot3.sort(uefaDesc);
pot4.sort(uefaAsc);

// Pairing : meilleur 3e vs pire 4e, en évitant même groupe
List<Entry> remaining4 = new ArrayList<>(pot4);
List<Team> consolanteTeams = new ArrayList<>();

for (Entry third : pot3) {
    Entry chosen = null;

    // on prend le pire 4e disponible qui n’est pas du même groupe
    for (Entry cand : remaining4) {
        if (!cand.groupKey().equals(third.groupKey())) {
            chosen = cand;
            break;
        }
    }

    // fallback rare (si collision)
    if (chosen == null && !remaining4.isEmpty()) chosen = remaining4.get(0);
    if (chosen == null) break;

    remaining4.remove(chosen);

    // IMPORTANT : ordre [3e, 4e] pour que ton generator fasse (1vs2)(3vs4)...
    consolanteTeams.add(third.ts().getTeam());
    consolanteTeams.add(chosen.ts().getTeam());
}


System.out.println("\n🏆 CONSOLANTE = ÉQUIPES NON QUALIFIÉES (UEFA SEEDED) :");
for (int i = 0; i < consolanteTeams.size(); i++) {
    System.out.println("  Position " + (i + 1) + " : " + consolanteTeams.get(i).getName());
}


        System.out.println("\n🏆 ORDRE FINAL CONSOLANTE (UEFA SEEDED) :");
        for (int i = 0; i < consolanteTeams.size(); i++) {
            System.out.println("  Position " + (i+1) + " : " + consolanteTeams.get(i).getName());
        }

        System.out.println("\n🏆 Génération consolante avec " + consolanteTeams.size() + " équipes");

        // 🔥 UTILISER LA NOUVELLE MÉTHODE AVEC BYES
        List<Match> matches = dynamicBracketGenerator.generateKnockoutWithByes(
            consolanteTeams,
            event
        );

        // 🔑 Préfixer tous les rounds avec "C"
        matches.forEach(m -> {
            String oldRound = m.getRound();
            m.setRound("C" + oldRound);
            System.out.println("  📝 Match : " + oldRound + " → C" + oldRound);
        });

        matchRepository.saveAll(matches);
        
        System.out.println("✅ Consolante générée : " + matches.size() + " matchs créés");
        
        return matches;
    }

    /**
     * Récupérer tous les matchs de consolante d'un événement
     */
  public List<Match> getConsolanteBracket(Long eventId) {
    return matchRepository.findActiveByEventIdAndRoundStartingWith(eventId, "C");
}

}