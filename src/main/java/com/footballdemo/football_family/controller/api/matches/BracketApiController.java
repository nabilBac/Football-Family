package com.footballdemo.football_family.controller.api.matches;

import com.footballdemo.football_family.dto.ApiResponse;
import com.footballdemo.football_family.dto.BracketMatchDTO;
import com.footballdemo.football_family.dto.FinalResultsDTO;
import com.footballdemo.football_family.dto.TeamStats;
import com.footballdemo.football_family.dto.TournamentSummaryDTO;
import com.footballdemo.football_family.model.Event;
import com.footballdemo.football_family.model.Match;
import com.footballdemo.football_family.model.TournamentPhase;
import com.footballdemo.football_family.repository.MatchRepository;
import com.footballdemo.football_family.security.EventSecurityService;
import com.footballdemo.football_family.service.BracketService;
import com.footballdemo.football_family.service.ClassementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.footballdemo.football_family.service.ConsolanteService;
import com.footballdemo.football_family.service.EventService;
import com.footballdemo.football_family.service.FinalResultService;
import com.footballdemo.football_family.service.TournamentSummaryService;
import com.footballdemo.football_family.model.User;
import com.footballdemo.football_family.service.TournamentRulesService;
import com.footballdemo.football_family.service.UserService;




import org.springframework.transaction.annotation.Transactional;

import java.security.Principal;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class BracketApiController {

    private final ClassementService classementService;
    private final BracketService bracketService;
    private final ConsolanteService consolanteService;
    private final MatchRepository matchRepository;
    private final FinalResultService finalResultService;
    private final TournamentSummaryService tournamentSummaryService;
    private final EventSecurityService eventSecurityService;
        private final TournamentRulesService tournamentRulesService;
        private final UserService userService;
        private final EventService eventService;



    /**
     * Génère automatiquement le bracket KO complet d'un événement.
     */
@PostMapping("/{eventId}/bracket/generate")
public ResponseEntity<ApiResponse<List<BracketMatchDTO>>> generateBracket(
        @PathVariable Long eventId,
        Principal principal
) {
    try {
        // 🔐 USER AUTHENTIFIÉ (ROBUSTE)
        User currentUser = userService
                .getUserByUsername(principal.getName())
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        // 🔒 SÉCURITÉ
        eventSecurityService.assertAdminOrOrganizer(eventId, currentUser);

        // 1️⃣ Classements des groupes
        Map<Long, List<TeamStats>> groupRankings =
                classementService.computeRankingsForEvent(eventId);

        Map<String, List<TeamStats>> rankings =
                groupRankings.entrySet().stream()
                        .filter(e -> e.getKey() != null)
                        .collect(Collectors.toMap(
                                e -> e.getKey().toString(),
                                Map.Entry::getValue
                        ));

        // 2️⃣ Génération du bracket
        List<Match> matches = bracketService.generateBracket(eventId, rankings);

        // 3️⃣ DTO
        List<BracketMatchDTO> dto = matches.stream()
                .map(BracketMatchDTO::from)
                .toList();

        return ResponseEntity.ok(
                new ApiResponse<>(true, "Bracket généré avec succès", dto)
        );

    } catch (Exception e) {
        return ResponseEntity.status(500)
                .body(new ApiResponse<>(
                        false,
                        "Erreur lors de la génération du bracket : " + e.getMessage(),
                        null
                ));
    }
}

/**
 * Génère la phase finale après les barrages
 */


    /**
     * Récupère la totalité du bracket KO.
     */
    @GetMapping("/{eventId}/bracket")
    public ResponseEntity<ApiResponse<List<BracketMatchDTO>>> getBracket(
            @PathVariable Long eventId
    ) {
        try {
            List<Match> matches = bracketService.getBracket(eventId);

            List<BracketMatchDTO> dto = matches.stream()
                    .map(BracketMatchDTO::from)
                    .toList();

            return ResponseEntity.ok(
                    new ApiResponse<>(true, "Bracket récupéré", dto)
            );

        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(new ApiResponse<>(false,
                            "Erreur lors de la récupération du bracket : " + e.getMessage(),
                            null));
        }
    }


    /**
 * Génère le bracket de CONSOLANTE (tournoi B) pour un événement.
 */
@PostMapping("/{eventId}/consolante/generate")
public ResponseEntity<ApiResponse<List<BracketMatchDTO>>> generateConsolante(
        @PathVariable Long eventId,
        Principal principal
) {
    try {
        // 🔐 USER AUTHENTIFIÉ (ROBUSTE)
        User currentUser = userService
                .getUserByUsername(principal.getName())
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        // 🔒 SÉCURITÉ
        eventSecurityService.assertAdminOrOrganizer(eventId, currentUser);

        // 1️⃣ Classements des groupes
        Map<Long, List<TeamStats>> groupRankings =
                classementService.computeRankingsForEvent(eventId);

        Map<String, List<TeamStats>> rankings =
                groupRankings.entrySet().stream()
                        .filter(e -> e.getKey() != null)
                        .collect(Collectors.toMap(
                                e -> e.getKey().toString(),
                                Map.Entry::getValue
                        ));

        // 2️⃣ Génération consolante
        List<Match> matches =
                consolanteService.generateConsolanteBracket(eventId, rankings);

        // 3️⃣ DTO
        List<BracketMatchDTO> dto = matches.stream()
                .map(BracketMatchDTO::from)
                .toList();

        return ResponseEntity.ok(
                new ApiResponse<>(true, "Bracket de consolante généré avec succès", dto)
        );

    } catch (Exception e) {
        return ResponseEntity.status(500)
                .body(new ApiResponse<>(
                        false,
                        "Erreur lors de la génération du bracket de consolante : " + e.getMessage(),
                        null
                ));
    }
}



/**
 * Récupère la totalité du bracket de CONSOLANTE.
 */
@GetMapping("/{eventId}/consolante")
public ResponseEntity<ApiResponse<List<BracketMatchDTO>>> getConsolante(
        @PathVariable Long eventId
) {
    try {
        List<Match> matches = consolanteService.getConsolanteBracket(eventId);

        List<BracketMatchDTO> dto = matches.stream()
                .map(BracketMatchDTO::from)
                .toList();

        return ResponseEntity.ok(
                new ApiResponse<>(true, "Bracket de consolante récupéré", dto)
        );

    } catch (Exception e) {
        e.printStackTrace();
        return ResponseEntity.status(500)
                .body(new ApiResponse<>(false,
                        "Erreur lors de la récupération du bracket de consolante : " + e.getMessage(),
                        null));
    }
}


@DeleteMapping("/{eventId}/matches/reset")
@Transactional
public ResponseEntity<ApiResponse<String>> resetMatches(
        @PathVariable Long eventId,
        Principal principal
) {
    try {
        User currentUser = userService
                .getUserByUsername(principal.getName())
                .orElseThrow();

        eventSecurityService.assertAdminOrOrganizer(eventId, currentUser);
        tournamentRulesService.assertNoScoresExist(eventId);

        matchRepository.clearNextMatchLinks(eventId);
        matchRepository.deleteByEventId(eventId);

        // ✅ LA LIGNE QUI MANQUAIT
        Event event = eventService.getEventById(eventId);
        event.setTournamentPhase(TournamentPhase.GROUP_STAGE_FINISHED);
        eventService.save(event);

        return ResponseEntity.ok(
                new ApiResponse<>(true, "Matchs supprimés avec succès", "OK")
        );

    } catch (Exception e) {
        return ResponseEntity.status(500)
                .body(new ApiResponse<>(
                        false,
                        "Erreur lors de la suppression des matchs : " + e.getMessage(),
                        null
                ));
    }
}



@GetMapping("/{eventId}/final-results")
public ResponseEntity<ApiResponse<FinalResultsDTO>> getFinalResults(
        @PathVariable Long eventId
) {
    try {
        FinalResultsDTO results = finalResultService.getFinalResults(eventId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Résultats finaux", results));

    } catch (Exception e) {
        return ResponseEntity.status(500)
                .body(new ApiResponse<>(false, "Erreur : " + e.getMessage(), null));
    }
}

        @GetMapping("/{eventId}/tournament-summary")
public ResponseEntity<ApiResponse<TournamentSummaryDTO>> getTournamentSummary(
        @PathVariable Long eventId
) {
    try {
        TournamentSummaryDTO summary = tournamentSummaryService.getSummary(eventId);

        return ResponseEntity.ok(
                new ApiResponse<>(true, "Résumé du tournoi", summary)
        );

    } catch (Exception e) {
        return ResponseEntity.status(500)
                .body(new ApiResponse<>(false, "Erreur : " + e.getMessage(), null));
    }
}


}
