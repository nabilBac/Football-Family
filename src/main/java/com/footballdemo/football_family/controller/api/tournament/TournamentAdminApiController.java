package com.footballdemo.football_family.controller.api.tournament;

import com.footballdemo.football_family.dto.ApiResponse;
import com.footballdemo.football_family.dto.BracketMatchDTO;
import com.footballdemo.football_family.dto.DeletedMatchDto;
import com.footballdemo.football_family.dto.GroupRankingDTO;
import com.footballdemo.football_family.dto.ScoreUpdateDTO;
import com.footballdemo.football_family.dto.TournamentGroupDTO;
import com.footballdemo.football_family.model.Event;
import com.footballdemo.football_family.model.Match;
import com.footballdemo.football_family.model.MatchStatus;
import com.footballdemo.football_family.model.TournamentGroup;
import com.footballdemo.football_family.model.User;
import com.footballdemo.football_family.repository.MatchRepository;
import com.footballdemo.football_family.service.*;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import com.footballdemo.football_family.model.TournamentPhase;
import com.footballdemo.football_family.dto.PlanningConfigDTO;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;
import java.security.Principal;



@RestController
@RequiredArgsConstructor
@RequestMapping("/api/tournament/admin")
public class TournamentAdminApiController {

    private final UserService userService;
    private final EventService eventService;
    private final MatchService matchService;
    private final EventAccessService eventAccessService;
    private final TournamentService tournamentService;
    private final BracketService bracketService;
    private final MatchRepository matchRepository;
    private final MatchAdminService matchAdminService;

   private User getUser(Principal principal) {
    if (principal == null) {
        throw new ResponseStatusException(
            HttpStatus.UNAUTHORIZED,
            "Unauthorized: principal is null (JWT filter not applied on /api/tournament/admin/**)"
        );
    }
    return userService.getUserByUsername(principal.getName()).orElseThrow();
}


    private boolean isPlanned(Match m) {
    return m.getDate() != null && m.getTime() != null && m.getField() != null;
}

private boolean isLocked(Match m) {
    MatchStatus s = m.getStatus();
    return s == MatchStatus.IN_PROGRESS
        || s == MatchStatus.COMPLETED
        || s == MatchStatus.CANCELLED;
}



    // ==========================================================
    // 1️⃣ Mettre à jour un score
    // ==========================================================
   @PostMapping(
    value = "/matches/{matchId}/score",
    consumes = "application/json",
    produces = "application/json"
)
public ResponseEntity<ApiResponse<Void>> updateScore(
        @PathVariable Long matchId,
        @RequestBody ScoreUpdateDTO dto,
        Principal principal
) {

    User user = getUser(principal);

    // 🔒 Sécurité métier FINALE (celle qu’on vient d’ajouter)
    matchService.updateScore(matchId, dto, user);

    return ResponseEntity.ok(
        new ApiResponse<>(true, "Score mis à jour", null)
    );
}


    // ==========================================================
    // 2️⃣ Générer les poules
    // ==========================================================
@PostMapping("/{eventId}/generate-groups")
public ResponseEntity<ApiResponse<List<TournamentGroupDTO>>> generateGroups(
        @PathVariable Long eventId,
        @RequestParam(defaultValue = "4") int nbGroups,
        @RequestParam(defaultValue = "2") int qualifiedPerGroup,
        Principal principal) {

    User user = getUser(principal);
    Event event = eventService.getEventById(eventId);

    // 🔒 Sécurité
    eventAccessService.assertCanManage(event, user);

    // ⚙️ Génération des poules
  List<TournamentGroup> groups = eventService.generateGroups(
        eventId,
        nbGroups,
        qualifiedPerGroup,
        false   // 🔑 PAS DE FORÇAGE
);


    // 🧭 TRANSITION MÉTIER (LA CLÉ)
    event.setTournamentPhase(TournamentPhase.GROUP_STAGE);
    eventService.save(event); // ou eventRepository.save(event)

    // 🎁 DTO
    List<TournamentGroupDTO> groupDTOs = groups.stream()
            .map(TournamentGroupDTO::from)
            .toList();

    return ResponseEntity.ok(
            new ApiResponse<>(true, "Poules générées", groupDTOs)
    );
}


@PostMapping("/{eventId}/generate-groups/force")
public ResponseEntity<ApiResponse<List<TournamentGroupDTO>>> forceGenerateGroups(
        @PathVariable Long eventId,
        @RequestParam(defaultValue = "4") int nbGroups,
        @RequestParam(defaultValue = "2") int qualifiedPerGroup,
        Principal principal) {

    User user = getUser(principal);
    Event event = eventService.getEventById(eventId);

    eventAccessService.assertCanManage(event, user);

    List<TournamentGroup> groups = eventService.generateGroups(
            eventId,
            nbGroups,
            qualifiedPerGroup,
            true   // 🔥 FORÇAGE
    );

    event.setTournamentPhase(TournamentPhase.GROUP_STAGE);
    eventService.save(event);

    List<TournamentGroupDTO> groupDTOs = groups.stream()
            .map(TournamentGroupDTO::from)
            .toList();

    return ResponseEntity.ok(
            new ApiResponse<>(true, "Poules générées (forcé)", groupDTOs)
    );
}




    // ==========================================================
    // 3️⃣ Générer le bracket principal
    // ==========================================================
  @PostMapping("/{eventId}/generate-bracket")
public ResponseEntity<ApiResponse<List<BracketMatchDTO>>> generateBracket(  // ✅ DTO
        @PathVariable Long eventId,
        Principal principal) {

    User user = getUser(principal);
    Event event = eventService.getEventById(eventId);
    eventAccessService.assertCanManage(event, user);

    Map<Long, List<GroupRankingDTO>> rankings =
            eventService.computeGroupRankings(eventId, user);

    List<Match> bracket = bracketService.generateBracket(eventId, rankings);

    // ✅ CONVERTIR EN DTO
    List<BracketMatchDTO> bracketDTOs = bracket.stream()
            .map(BracketMatchDTO::from)
            .toList();

    return ResponseEntity.ok(new ApiResponse<>(true, "Bracket généré", bracketDTOs));
}


@PostMapping("/{eventId}/generate-bracket-semi-directed")
public ResponseEntity<ApiResponse<List<BracketMatchDTO>>> generateBracketSemiDirected(
        @PathVariable Long eventId,
        Principal principal
) {
    User user = getUser(principal);
    Event event = eventService.getEventById(eventId);
    eventAccessService.assertCanManage(event, user);

    // (optionnel mais conseillé) : bloquer si un bracket existe déjà
    // tournamentRulesService.assertBracketNotAlreadyGenerated(eventId);

    List<Match> bracket = bracketService.generateSemiDirectedBracket(eventId);

    List<BracketMatchDTO> bracketDTOs = bracket.stream()
            .map(BracketMatchDTO::from)
            .toList();

    return ResponseEntity.ok(new ApiResponse<>(
            true,
            "Tirage Champions League effectué !",
            bracketDTOs
    ));
}


    @GetMapping("/events")
    public ResponseEntity<ApiResponse<List<Event>>> getAdminEvents(Principal principal) {

        User user = userService.getUserByUsername(principal.getName())
                .orElseThrow();

        List<Event> events;

        if (user.isSuperAdmin()) {
            events = eventService.getAllEvents();
        } else if (user.isClubAdmin()) {
            Long clubId = user.getPrimaryClubId();
            if (clubId != null) {
                events = eventService.getEventsByClub(clubId);
            } else {
                events = List.of();
            }
        } else {
            events = List.of();
        }

        return ResponseEntity.ok(
                new ApiResponse<>(true, "Liste des événements", events)
        );
    }
/**
 * 📅 GÉNÉRATION AUTOMATIQUE DU PLANNING PAR VAGUES DE ROUNDS
 */
@PostMapping("/{eventId}/generate-planning")
public ResponseEntity<?> generatePlanning(
        @PathVariable Long eventId,
        @RequestBody(required = false) PlanningConfigDTO config,
        Principal principal
) {

    try {
        // 🔒 Sécurité (recommandé)
User user = getUser(principal);
Event event = eventService.getEventById(eventId);
eventAccessService.assertCanManage(event, user);

        // ✅ Validation claire (évite les 500 "text")
        List<String> errors = new ArrayList<>();
        if (config == null) {
            errors.add("config manquant");
        } else {
            if (config.getDateDebut() == null) errors.add("dateDebut requis (yyyy-MM-dd)");
            if (config.getStartTime() == null) errors.add("startTime requis (HH:mm)");
            if (config.getEndTime() == null) errors.add("endTime requis (HH:mm)");
            if (config.getMatchDurationMinutes() == null || config.getMatchDurationMinutes() <= 0)
                errors.add("matchDurationMinutes > 0 requis");
            if (config.getBreakDurationMinutes() == null || config.getBreakDurationMinutes() < 0)
                errors.add("breakDurationMinutes >= 0 requis");
            if (config.getNumberOfFields() == null || config.getNumberOfFields() <= 0)
                errors.add("numberOfFields >= 1 requis");
            if (config.getNombreJours() != null && config.getNombreJours() <= 0)
                errors.add("nombreJours >= 1 requis");
        }

        if (!errors.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "PlanningConfig invalide",
                    "errors", errors
            ));
        }

        // 🔹 Configuration multi-jours
        LocalDate dateDebut = LocalDate.parse(config.getDateDebut());
        int nombreJours = (config.getNombreJours() != null) ? config.getNombreJours() : 1;
        LocalTime startTime = LocalTime.parse(config.getStartTime());
        LocalTime endTime = LocalTime.parse(config.getEndTime());

        int matchDuration = config.getMatchDurationMinutes();
        int breakDuration = config.getBreakDurationMinutes();
        int numberOfFields = config.getNumberOfFields();
      int tempsReposMinimum = (config.getRestBetweenRoundsMinutes() != null)
        ? Math.max(config.getRestBetweenRoundsMinutes(), 0)
        : 10; // ✅ défaut pro


        // ✅ phase : POULES / FINALES / ALL (on garde compat avec "FINALE")
        String phase = (config.getPhase() == null) ? "ALL" : config.getPhase().toUpperCase();
        if ("FINALE".equals(phase)) phase = "FINALES";

        // ✅ overwrite (si tu ajoutes le champ dans DTO)
        boolean overwrite = false;
        try {
            // si tu ajoutes `private Boolean overwrite;` dans PlanningConfigDTO
            overwrite = Boolean.TRUE.equals(config.getOverwrite());
        } catch (Exception ignore) {}

        boolean includeConsolante = Boolean.TRUE.equals(config.getIncludeConsolante());


        // 1️⃣ Récupérer TOUS les matchs
        List<Match> poulesMatches = new ArrayList<>(
                matchRepository.findByEventIdAndGroupIsNotNullOrderByDateAscTimeAsc(eventId)
        );
        List<Match> finalesMatches = new ArrayList<>(
                matchRepository.findByEventIdAndRoundIsNotNullOrderByDateAscTimeAsc(eventId)
        );

        if (poulesMatches.isEmpty() && finalesMatches.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Aucun match trouvé. Générez d'abord les matchs du tournoi."
            ));
        }

        // ✅ Ne pas toucher aux matchs joués (protection)
        poulesMatches = poulesMatches.stream().filter(m -> !isLocked(m)).toList();
        finalesMatches = finalesMatches.stream().filter(m -> !isLocked(m)).toList();

        // ✅ Ne pas replanifier si déjà planifié (mode 2 passes)
        if (!overwrite) {
            poulesMatches = poulesMatches.stream().filter(m -> !isPlanned(m)).toList();
            finalesMatches = finalesMatches.stream().filter(m -> !isPlanned(m)).toList();
        }

                // ✅ Rien à planifier (tout est locké ou déjà planifié)
if (poulesMatches.isEmpty() && finalesMatches.isEmpty()) {
    return ResponseEntity.ok(Map.of(
        "success", true,
        "message", "Aucun match planifiable : tous les matchs sont lockés (COMPLETED / IN_PROGRESS / CANCELLED) ou déjà planifiés.",
        "data", Map.of(
            "totalMatches", 0,
            "overwrite", overwrite,
            "phase", phase
        )
    ));
}


        // ✅ Filtrer par phase
        if ("POULES".equals(phase)) {
            finalesMatches = List.of();
        } else if ("FINALES".equals(phase)) {
            poulesMatches = List.of();
        }
        // "ALL" => garde les deux

        // 2️⃣ Grouper les matchs finales par round
        Map<String, List<Match>> finalesByRound = new LinkedHashMap<>();
        for (Match m : finalesMatches) {
            String round = m.getRound() != null ? m.getRound() : "INCONNU";
            finalesByRound.computeIfAbsent(round, k -> new ArrayList<>()).add(m);
        }

      
     // 3️⃣ Ordre logique des rounds (sans doublons, compatible 2→64 équipes)
List<String> bracketRounds = Arrays.asList(
    "1/32e DE FINALE",
    "SEIZIÈME DE FINALE",
    "HUITIÈME DE FINALE",
    "QUART DE FINALE",
    "DEMI-FINALE",
    "FINALE"
);

List<String> consolanteRounds = Arrays.asList(
    "C1/32e DE FINALE",
    "CSEIZIÈME DE FINALE",
    "CHUITIÈME DE FINALE",
    "CQUART DE FINALE",
    "CDEMI-FINALE",
    "CFINALE"
);



       AtomicInteger totalMatchesPlanned = new AtomicInteger(0);


        // ✅ On stocke les matchs modifiés pour saveAll propre
        List<Match> plannedNow = new ArrayList<>();

        // 🗓️ RÉPARTITION AUTOMATIQUE MULTI-JOURS
        if (nombreJours == 1) {
            LocalDateTime currentTime = LocalDateTime.of(dateDebut, startTime);

            // POULES
            if (!poulesMatches.isEmpty()) {
                currentTime = planifierRound(poulesMatches, "POULES", dateDebut,
        currentTime, numberOfFields, matchDuration, breakDuration, tempsReposMinimum, endTime);

                plannedNow.addAll(poulesMatches);
                totalMatchesPlanned.addAndGet(poulesMatches.size());

            }

java.util.function.Function<String, List<Match>> getRound = (r) -> {
    List<Match> ms = finalesByRound.get(r);
    return (ms == null) ? List.of() : ms;
};

// CONSOLANTE d'abord
if (includeConsolante) {

List<Match> cQF = getRound.apply("CQUART DE FINALE");
if (!cQF.isEmpty()) { currentTime = planifierRound(cQF, "CONSO-QF", dateDebut, currentTime, numberOfFields, matchDuration, breakDuration, tempsReposMinimum, endTime);
    plannedNow.addAll(cQF); totalMatchesPlanned.addAndGet(cQF.size()); }

List<Match> cSF = getRound.apply("CDEMI-FINALE");
if (!cSF.isEmpty()) { currentTime = planifierRound(cSF, "CONSO-SF", dateDebut, currentTime, numberOfFields, matchDuration, breakDuration, tempsReposMinimum, endTime);
    plannedNow.addAll(cSF); totalMatchesPlanned.addAndGet(cSF.size()); }

List<Match> cF = getRound.apply("CFINALE");
if (!cF.isEmpty()) { 
  currentTime = planifierRound(cF, "CONSO-FINAL", dateDebut, currentTime,
      1, matchDuration, breakDuration, 0, endTime); // ✅ CFINALE sur 1 terrain
  plannedNow.addAll(cF); 
  totalMatchesPlanned.addAndGet(cF.size()); 
}
 }


// BRACKET ensuite (FINALE en dernier)
List<Match> qf = getRound.apply("QUART DE FINALE");
if (!qf.isEmpty()) { currentTime = planifierRound(qf, "BRACKET-QF", dateDebut, currentTime, numberOfFields, matchDuration, breakDuration, tempsReposMinimum, endTime);
    plannedNow.addAll(qf); totalMatchesPlanned.addAndGet(qf.size()); }

List<Match> sf = getRound.apply("DEMI-FINALE");
if (!sf.isEmpty()) { currentTime = planifierRound(sf, "BRACKET-SF", dateDebut, currentTime, numberOfFields, matchDuration, breakDuration, tempsReposMinimum, endTime);
    plannedNow.addAll(sf); totalMatchesPlanned.addAndGet(sf.size()); }
List<Match> f = getRound.apply("FINALE");
if (!f.isEmpty()) {
  currentTime = planifierRound(f, "BRACKET-FINAL", dateDebut, currentTime,
      1, // ✅ finale sur un seul terrain
      matchDuration, breakDuration, 0, endTime);
  plannedNow.addAll(f);
  totalMatchesPlanned.addAndGet(f.size());
}





        } else if (nombreJours == 2) {
            // JOUR 1 : POULES
            LocalDate jour1 = dateDebut;
            LocalDateTime currentTime = LocalDateTime.of(jour1, startTime);

            if (!poulesMatches.isEmpty()) {
 currentTime = planifierRound(poulesMatches, "POULES", jour1,
    currentTime, numberOfFields, matchDuration, breakDuration, tempsReposMinimum, endTime);


                plannedNow.addAll(poulesMatches);
              totalMatchesPlanned.addAndGet(poulesMatches.size());

            }

            // JOUR 2 : FINALES (bracket + consolante)
            LocalDate jour2 = dateDebut.plusDays(1);
            currentTime = LocalDateTime.of(jour2, startTime);
java.util.function.Function<String, List<Match>> getRound2 = (r) -> {
    List<Match> ms = finalesByRound.get(r);
    return (ms == null) ? List.of() : ms;
};

// CONSOLANTE d'abord (jour2)
if (includeConsolante) {
List<Match> cQF2 = getRound2.apply("CQUART DE FINALE");
if (!cQF2.isEmpty()) {
    currentTime = planifierRound(cQF2, "CONSO-QF", jour2,
            currentTime, numberOfFields, matchDuration, breakDuration, tempsReposMinimum, endTime);
    plannedNow.addAll(cQF2);
    totalMatchesPlanned.addAndGet(cQF2.size());
}

List<Match> cSF2 = getRound2.apply("CDEMI-FINALE");
if (!cSF2.isEmpty()) {
    currentTime = planifierRound(cSF2, "CONSO-SF", jour2,
            currentTime, numberOfFields, matchDuration, breakDuration, tempsReposMinimum, endTime);
    plannedNow.addAll(cSF2);
    totalMatchesPlanned.addAndGet(cSF2.size());
}

List<Match> cF2 = getRound2.apply("CFINALE");
if (!cF2.isEmpty()) {
    currentTime = planifierRound(cF2, "CONSO-FINAL", jour2,
            currentTime, 1, matchDuration, breakDuration, 0, endTime); // ✅
    plannedNow.addAll(cF2);
    totalMatchesPlanned.addAndGet(cF2.size());
}
}

// BRACKET ensuite (FINALE en dernier)
List<Match> qf2 = getRound2.apply("QUART DE FINALE");
if (!qf2.isEmpty()) {
    currentTime = planifierRound(qf2, "BRACKET-QF", jour2,
            currentTime, numberOfFields, matchDuration, breakDuration, tempsReposMinimum, endTime);
    plannedNow.addAll(qf2);
    totalMatchesPlanned.addAndGet(qf2.size());
}

List<Match> sf2 = getRound2.apply("DEMI-FINALE");
if (!sf2.isEmpty()) {
    currentTime = planifierRound(sf2, "BRACKET-SF", jour2,
            currentTime, numberOfFields, matchDuration, breakDuration, tempsReposMinimum, endTime);
    plannedNow.addAll(sf2);
    totalMatchesPlanned.addAndGet(sf2.size());
}

List<Match> f2 = getRound2.apply("FINALE");
if (!f2.isEmpty()) {
    currentTime = planifierRound(f2, "BRACKET-FINAL", jour2,
            currentTime, 1, matchDuration, breakDuration, 0, endTime); // ✅
    plannedNow.addAll(f2);
    totalMatchesPlanned.addAndGet(f2.size());
}


        }  else { // >= 3
    // JOUR 1 : POULES
    LocalDate jour1 = dateDebut;
    LocalDateTime currentTime = LocalDateTime.of(jour1, startTime);

    if (!poulesMatches.isEmpty()) {
        currentTime = planifierRound(
            poulesMatches, "POULES", jour1,
            currentTime, numberOfFields,
            matchDuration, breakDuration,
            tempsReposMinimum, endTime
        );

        plannedNow.addAll(poulesMatches);
        totalMatchesPlanned.addAndGet(poulesMatches.size());
    }

    // JOUR 2 : CONSOLANTE (optionnelle)
    LocalDate jour2 = dateDebut.plusDays(1);
    currentTime = LocalDateTime.of(jour2, startTime);

    if (includeConsolante) {
        for (String roundName : consolanteRounds) {
            List<Match> matches = finalesByRound.get(roundName);
            if (matches != null && !matches.isEmpty()) {
                currentTime = planifierRound(
                    matches, roundName, jour2,
                    currentTime, numberOfFields,
                    matchDuration, breakDuration,
                    tempsReposMinimum, endTime
                );

                plannedNow.addAll(matches);
                totalMatchesPlanned.addAndGet(matches.size());
            }
        }
    }

    // JOUR 3 : BRACKET (FINALE = dernier match de l'event)
    LocalDate jour3 = dateDebut.plusDays(2);
    currentTime = LocalDateTime.of(jour3, startTime);

    
for (String roundName : bracketRounds) {
    List<Match> matches = finalesByRound.get(roundName);
    if (matches != null && !matches.isEmpty()) {

        int fieldsForThisRound = "FINALE".equals(roundName) ? 1 : numberOfFields; // ✅
        int repos = "FINALE".equals(roundName) ? 0 : tempsReposMinimum;

        currentTime = planifierRound(
            matches, roundName, jour3,
            currentTime, fieldsForThisRound, // ✅ ici
            matchDuration, breakDuration,
            repos, endTime
        );

        plannedNow.addAll(matches);
        totalMatchesPlanned.addAndGet(matches.size());
    }
}


}


        // ✅ Sauvegarde seulement ce qu’on a réellement modifié
        if (!plannedNow.isEmpty()) {
            matchRepository.saveAll(plannedNow);
        }

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "✅ Planning multi-jours généré avec succès",
                "data", Map.of(
                      "totalMatches", totalMatchesPlanned.get(),

                        "nombreJours", nombreJours,
                        "dateDebut", dateDebut.toString(),
                        "dateFin", dateDebut.plusDays(nombreJours - 1).toString(),
                        "numberOfFields", numberOfFields,
                        "phase", phase,
                        "overwrite", overwrite,
                         "includeConsolante", includeConsolante
                        
                )
        ));

    } 
    catch (IllegalArgumentException e) {
    return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
            "success", false,
            "message", e.getMessage()
    ));
}
    catch (Exception e) {
        e.printStackTrace();
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "success", false,
                "message", "Erreur : " + e.getMessage()
        ));
    }
}
/**
 * 🛠️ MÉTHODE UTILITAIRE POUR PLANIFIER UN ROUND
 */
private LocalDateTime planifierRound(
        List<Match> matches,
        String roundName,
        LocalDate date,
        LocalDateTime currentTime,
        int numberOfFields,
        int matchDuration,
        int breakDuration,
        int tempsRepos,
        LocalTime endTimeLimit
) {
    if (matches == null || matches.isEmpty()) {
        return currentTime;
    }

    // ✅ Nombre de terrains effectif
    int effectiveFields = numberOfFields;

    // ✅ Prestige: la FINALE se joue seule (un seul terrain)
    // (tu peux ajouter aussi "BRACKET-FINAL" si tu passes ce nom-là en roundName)
    if ("FINALE".equalsIgnoreCase(roundName) || roundName.contains("BRACKET-FINAL")) {
        effectiveFields = 1;
    }

    // ✅ CAPACITÉ : empêcher de dépasser endTimeLimit (matin/aprem strict)
    int slotMinutes = matchDuration + breakDuration;

    int windowMinutes = (int) java.time.Duration
            .between(currentTime.toLocalTime(), endTimeLimit)
            .toMinutes();

    int slotsPerField = (windowMinutes - matchDuration) >= 0
            ? ((windowMinutes - matchDuration) / slotMinutes) + 1
            : 0;

    int capacity = slotsPerField * effectiveFields;

    if (matches.size() > capacity) {
        throw new IllegalArgumentException(
                "Pas assez de créneaux pour " + roundName + " : " + matches.size()
                        + " matchs, capacité=" + capacity
                        + " (fields=" + effectiveFields
                        + ", window=" + currentTime.toLocalTime() + "-" + endTimeLimit
                        + ", slot=" + slotMinutes + "min)"
        );
    }

    System.out.println("🎯 Planification: " + roundName + " (" + matches.size() + " matchs) le " + date
            + " | fields=" + effectiveFields);

    for (int i = 0; i < matches.size(); i++) {
        Match match = matches.get(i);

        int fieldIndex = i % effectiveFields;
        int creneauIndex = i / effectiveFields;
        int timeOffset = creneauIndex * slotMinutes;

        match.setDate(date);
        match.setTime(currentTime.plusMinutes(timeOffset).toLocalTime());
        match.setField("Terrain " + (fieldIndex + 1));
    }

    int nbCreneaux = (int) Math.ceil((double) matches.size() / effectiveFields);
    int dureeRound = nbCreneaux * slotMinutes;

    return currentTime.plusMinutes(dureeRound + tempsRepos);
}

/**
 * ✏️ MODIFICATION MANUELLE DE L'HORAIRE D'UN MATCH
 */
@PutMapping("/matches/{matchId}/schedule")
public ResponseEntity<?> updateMatchSchedule(
        @PathVariable Long matchId,
        @RequestBody Map<String, String> scheduleData) {
    
    try {
        Match match = matchRepository.findById(matchId)
            .orElseThrow(() -> new EntityNotFoundException("Match non trouvé"));
        
        // Mettre à jour les données
        if (scheduleData.containsKey("date")) {
            match.setDate(LocalDate.parse(scheduleData.get("date")));
        }
        
        if (scheduleData.containsKey("time")) {
            match.setTime(LocalTime.parse(scheduleData.get("time")));
        }
        
        if (scheduleData.containsKey("field")) {
            match.setField(scheduleData.get("field"));
        }
        
        matchRepository.save(match);
        
        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "Horaire modifié avec succès"
        ));
        
    } catch (Exception e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
            "success", false,
            "message", "Erreur: " + e.getMessage()
        ));
    }
}

/**
 * 🗑️ RÉINITIALISER LE PLANNING (safe)
 */
@DeleteMapping("/{eventId}/matches/reset")
public ResponseEntity<?> resetPlanning(
        @PathVariable Long eventId,
        Principal principal
) {
    try {
        User user = getUser(principal);
        Event event = eventService.getEventById(eventId);
        eventAccessService.assertCanManage(event, user);

        List<Match> allMatches = matchRepository.findByEventIdOrderByDateTime(eventId);

        int resetCount = 0;
        List<Match> changed = new ArrayList<>();

        for (Match m : allMatches) {

            // ✅ 1) skip soft deleted
            if (m.isDeleted()) continue;

            // ✅ 2) skip match locké
            if (isLocked(m)) continue;

            // ✅ 3) reset uniquement si déjà planifié
            boolean planned = (m.getDate() != null || m.getTime() != null || m.getField() != null);
            if (!planned) continue;

            m.setDate(null);
            m.setTime(null);
            m.setField(null);

            changed.add(m);
            resetCount++;
        }

        if (!changed.isEmpty()) {
            matchRepository.saveAll(changed);
        }

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Planning réinitialisé",
                "data", Map.of(
                        "eventId", eventId,
                        "resetCount", resetCount,
                        "totalMatches", allMatches.size()
                )
        ));

    } catch (Exception e) {
        e.printStackTrace();
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "success", false,
                "message", "Erreur : " + e.getMessage()
        ));
    }
}

// ==========================================================
// 🆕 CRUD ADMIN - MATCHS
// ==========================================================

/**
 * Supprimer UN match (soft delete)
 */
@DeleteMapping("/matches/{matchId}")
public ResponseEntity<ApiResponse<Void>> deleteMatch(
        @PathVariable Long matchId,
        Principal principal) {
    
    User user = getUser(principal);
    matchAdminService.deleteMatch(matchId, user);
    
    return ResponseEntity.ok(
        new ApiResponse<>(true, "Match supprimé avec succès", null)
    );
}

/**
 * Restaurer un match supprimé
 */
@PostMapping("/matches/{matchId}/restore")
public ResponseEntity<ApiResponse<Void>> restoreMatch(
        @PathVariable Long matchId,
        Principal principal) {
    
    User user = getUser(principal);
    matchAdminService.restoreMatch(matchId, user);
    
    return ResponseEntity.ok(
        new ApiResponse<>(true, "Match restauré avec succès", null)
    );
}

/**
 * Supprimer tous les matchs d'un round
 */
@DeleteMapping("/{eventId}/matches/round/{round}")
public ResponseEntity<ApiResponse<Integer>> deleteMatchesByRound(
        @PathVariable Long eventId,
        @PathVariable String round,
        Principal principal) {
    
    User user = getUser(principal);
    int count = matchAdminService.deleteMatchesByRound(eventId, round, user);
    
    if (count == 0) {
        return ResponseEntity.ok(
            new ApiResponse<>(false, "Aucun match trouvé pour le round: " + round, 0)
        );
    }
    
    return ResponseEntity.ok(
        new ApiResponse<>(true, count + " match(s) du round " + round + " supprimé(s) avec succès", count)
    );
}

/**
 * Modifier un match (équipes, horaire, statut)
 */
@PutMapping("/matches/{matchId}")
public ResponseEntity<ApiResponse<Void>> updateMatch(
        @PathVariable Long matchId,
        @RequestBody Map<String, Object> updateData,
        Principal principal) {
    
    User user = getUser(principal);
    
    // Extraction des données
    Long teamAId = updateData.containsKey("teamAId") 
        ? Long.valueOf(updateData.get("teamAId").toString()) 
        : null;
    
    Long teamBId = updateData.containsKey("teamBId") 
        ? Long.valueOf(updateData.get("teamBId").toString()) 
        : null;
    
    LocalDate date = updateData.containsKey("date") 
        ? LocalDate.parse(updateData.get("date").toString()) 
        : null;
    
    LocalTime time = updateData.containsKey("time") 
        ? LocalTime.parse(updateData.get("time").toString()) 
        : null;
    
    String field = updateData.containsKey("field") 
        ? updateData.get("field").toString() 
        : null;
    
    MatchStatus status = updateData.containsKey("status") 
        ? MatchStatus.valueOf(updateData.get("status").toString()) 
        : null;
    
    matchAdminService.updateMatch(
    matchId, teamAId, teamBId, date, time, field, status, user
);
    
   return ResponseEntity.ok(
    new ApiResponse<>(true, "Match modifié avec succès", null)
    );
}

/**
 * Récupérer les matchs supprimés d'un event (admin)
 */
@GetMapping("/{eventId}/matches/deleted")
public ResponseEntity<ApiResponse<List<Match>>> getDeletedMatches(
        @PathVariable Long eventId,
        Principal principal) {
    
    User user = getUser(principal);
    List<Match> deleted = matchAdminService.getDeletedMatches(eventId, user);
    
    return ResponseEntity.ok(
        new ApiResponse<>(true, "Matchs supprimés récupérés", deleted)
    );
}


/**
 * Récupérer TOUS les matchs supprimés (avec filtres optionnels)
 */
@GetMapping("/matches/deleted")
public ResponseEntity<ApiResponse<List<DeletedMatchDto>>> getAllDeletedMatches(
        @RequestParam(required = false) Long eventId,
        @RequestParam(required = false) String round,
        Principal principal
) {

    User user = getUser(principal);

    List<DeletedMatchDto> deleted =
        matchAdminService.getAllDeletedMatches(eventId, round, user);

    return ResponseEntity.ok(
        new ApiResponse<>(true, "Matchs supprimés récupérés", deleted)
    );
}


@GetMapping("/{eventId}/matches/debug")
public ResponseEntity<?> debugMatches(@PathVariable Long eventId, Principal principal) {

    User user = getUser(principal);
    Event event = eventService.getEventById(eventId);
    eventAccessService.assertCanManage(event, user);

    List<Match> all = matchRepository.findByEventIdOrderByDateTime(eventId);

    long withGroup = all.stream().filter(m -> m.getGroup() != null).count();
    long withRound = all.stream().filter(m -> m.getRound() != null && !m.getRound().isBlank()).count();
    long deleted   = all.stream().filter(Match::isDeleted).count();

    // ✅ NOUVEAUX COMPTEURS
    long planned = all.stream().filter(m ->
            m.getDate() != null || m.getTime() != null || m.getField() != null
    ).count();

    long locked = all.stream().filter(this::isLocked).count();

    Map<String, Long> byStatus = new java.util.LinkedHashMap<>();
    for (Match m : all) {
        String s = (m.getStatus() == null) ? "NULL" : m.getStatus().name();
        byStatus.put(s, byStatus.getOrDefault(s, 0L) + 1L);
    }

    // rounds distincts
    List<String> roundSamples = all.stream()
            .map(Match::getRound)
            .filter(r -> r != null && !r.isBlank())
            .distinct()
            .limit(30)
            .toList();

    return ResponseEntity.ok(Map.of(
            "eventId", eventId,
            "total", all.size(),
            "withGroup", withGroup,
            "withRound", withRound,
            "deleted", deleted,
            "planned", planned,
            "locked", locked,
            "byStatus", byStatus,
            "roundSamples", roundSamples
    ));
}

}