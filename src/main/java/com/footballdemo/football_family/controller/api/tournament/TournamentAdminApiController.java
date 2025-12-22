package com.footballdemo.football_family.controller.api.tournament;

import com.footballdemo.football_family.dto.ApiResponse;
import com.footballdemo.football_family.dto.BracketMatchDTO;
import com.footballdemo.football_family.dto.GroupRankingDTO;
import com.footballdemo.football_family.dto.ScoreUpdateDTO;
import com.footballdemo.football_family.dto.TournamentGroupDTO;
import com.footballdemo.football_family.model.Event;
import com.footballdemo.football_family.model.Match;
import com.footballdemo.football_family.model.TournamentGroup;
import com.footballdemo.football_family.model.User;
import com.footballdemo.football_family.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.footballdemo.football_family.model.TournamentPhase;




import java.security.Principal;
import java.util.List;
import java.util.Map;

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

    private User getUser(Principal principal) {
        return userService.getUserByUsername(principal.getName())
                .orElseThrow();
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
}