package com.footballdemo.football_family.controller.api.events;

import com.footballdemo.football_family.dto.ApiResponse;
import com.footballdemo.football_family.dto.MatchDTO;
import com.footballdemo.football_family.model.Match;
import com.footballdemo.football_family.model.User;
import com.footballdemo.football_family.service.EventService;
import com.footballdemo.football_family.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import com.footballdemo.football_family.security.EventSecurityService;
import com.footballdemo.football_family.service.TournamentRulesService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;


import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/events/tournament")
@RequiredArgsConstructor
public class EventTournamentMatchesApiController {

    private final EventService eventService;
    private final UserService userService;
    private final EventSecurityService eventSecurityService;
    private final TournamentRulesService tournamentRulesService;


    private User getUser(Principal p) {
        return userService.getUserByUsername(p.getName()).orElseThrow();
    }

    @Operation(summary = "Générer automatiquement les matchs après génération des poules")
@PostMapping("/{eventId}/generate-matches")
@PreAuthorize("isAuthenticated()")
public ResponseEntity<ApiResponse<List<MatchDTO>>> generateMatches(
        @PathVariable Long eventId,
        Principal principal
)
 {
    try {

        User currentUser = getUser(principal);

        // 🔒 SÉCURITÉ : QUI A LE DROIT
        eventSecurityService.assertAdminOrOrganizer(eventId, currentUser);

        // 🔒 RÈGLES MÉTIER : EST-CE AUTORISÉ
        tournamentRulesService.assertNoMatchesAlreadyGenerated(eventId);
        tournamentRulesService.assertNoScoresExist(eventId);

        // ⚙️ GÉNÉRATION (LOGIQUE PURE)
        List<Match> matches =
    eventService.generateMatchesForEvent(eventId);


        return ResponseEntity.ok(
                new ApiResponse<>(
                        true,
                        "Matchs générés avec succès",
                        matches.stream().map(MatchDTO::from).toList()
                )
        );

    } catch (Exception e) {
        return ResponseEntity.status(500)
                .body(new ApiResponse<>(
                        false,
                        "Erreur lors de la génération des matchs : " + e.getMessage(),
                        null
                ));
    }
}

}