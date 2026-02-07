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
import org.slf4j.Logger; // ✅ AJOUT
import org.slf4j.LoggerFactory; // ✅ AJOUT

import java.security.Principal;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class BracketApiController {

    // ✅ AJOUT : Logger pour sécurité
    private static final Logger log = LoggerFactory.getLogger(BracketApiController.class);

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
     * ✅ Génère automatiquement le bracket KO complet d'un événement.
     */
    @PostMapping("/{eventId}/bracket/generate")
    public ResponseEntity<ApiResponse<List<BracketMatchDTO>>> generateBracket(
            @PathVariable Long eventId,
            Principal principal
    ) {
        try {
            // 🔐 USER AUTHENTIFIÉ
            User currentUser = userService
                    .getUserByUsername(principal.getName())
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

            // 🔒 SÉCURITÉ
            eventSecurityService.assertAdminOrOrganizer(eventId, currentUser);

            // 1️⃣ Classements des groupes
            Map<Long, List<TeamStats>> groupRankings =
                    classementService.computeRankingsForEvent(eventId);

            // ✅ FIX : Passer directement Map<Long, List<TeamStats>>
            // (Suppression de la conversion String inutile)
            List<Match> matches = bracketService.generateBracket(eventId, groupRankings);

            // 3️⃣ DTO
            List<BracketMatchDTO> dto = matches.stream()
                    .map(BracketMatchDTO::from)
                    .toList();

            return ResponseEntity.ok(
                    new ApiResponse<>(true, "Bracket généré avec succès", dto)
            );

        } catch (IllegalStateException e) {
            // ✅ Erreurs métier (phase incorrecte, etc.)
            log.warn("Erreur métier génération bracket eventId={}: {}", eventId, e.getMessage());
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, e.getMessage(), null));

        } catch (IllegalArgumentException e) {
            // ✅ Erreurs de validation (pas assez d'équipes, etc.)
            log.warn("Erreur validation génération bracket eventId={}: {}", eventId, e.getMessage());
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, e.getMessage(), null));

        } catch (Exception e) {
            // ❌ Erreurs inattendues (ne JAMAIS exposer au client)
            log.error("Erreur interne génération bracket eventId=" + eventId, e);
            return ResponseEntity.status(500)
                    .body(new ApiResponse<>(
                            false,
                            "Erreur interne du serveur. Contactez l'administrateur.",
                            null
                    ));
        }
    }

    /**
     * ✅ Récupère la totalité du bracket KO.
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
            log.error("Erreur récupération bracket eventId={}", eventId, e);
            return ResponseEntity.status(500)
                    .body(new ApiResponse<>(false,
                            "Erreur lors de la récupération du bracket",
                            null));
        }
    }

    /**
     * ✅ Génère le bracket de CONSOLANTE (tournoi B) pour un événement.
     */
@PostMapping("/{eventId}/consolante/generate")
public ResponseEntity<ApiResponse<List<BracketMatchDTO>>> generateConsolante(
        @PathVariable Long eventId,
        @RequestParam(name = "overwrite", defaultValue = "false") boolean overwrite,
        Principal principal
) {
    try {
        User currentUser = userService
                .getUserByUsername(principal.getName())
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        eventSecurityService.assertAdminOrOrganizer(eventId, currentUser);

        Map<Long, List<TeamStats>> groupRankings =
                classementService.computeRankingsForEvent(eventId);

        Map<String, List<TeamStats>> rankings =
                groupRankings.entrySet().stream()
                        .filter(e -> e.getKey() != null)
                        .collect(Collectors.toMap(
                                e -> e.getKey().toString(),
                                Map.Entry::getValue,
                                (v1, v2) -> v1,
                                LinkedHashMap::new
                        ));

        List<Match> matches =
                consolanteService.generateConsolanteBracket(eventId, rankings, overwrite);

        List<BracketMatchDTO> dto = matches.stream()
                .map(BracketMatchDTO::from)
                .toList();

        return ResponseEntity.ok(
                new ApiResponse<>(true, "Bracket de consolante généré avec succès", dto)
        );

    } catch (com.footballdemo.football_family.exception.DuplicateResourceException e) {
        return ResponseEntity.status(409)
                .body(new ApiResponse<>(false, e.getMessage(), null));

    } catch (IllegalStateException e) {
        return ResponseEntity.badRequest()
                .body(new ApiResponse<>(false, e.getMessage(), null));

    } catch (IllegalArgumentException e) {
        return ResponseEntity.badRequest()
                .body(new ApiResponse<>(false, e.getMessage(), null));

    } catch (Exception e) {
        log.error("Erreur interne génération consolante eventId=" + eventId, e);
        return ResponseEntity.status(500)
                .body(new ApiResponse<>(false, "Erreur interne du serveur. Contactez l'administrateur.", null));
    }
}



    /**
     * ✅ Récupère la totalité du bracket de CONSOLANTE.
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
            log.error("Erreur récupération consolante eventId=" + eventId, e);
            return ResponseEntity.status(500)
                    .body(new ApiResponse<>(false,
                            "Erreur lors de la récupération du bracket de consolante",
                            null));
        }
    }

    /**
     * ✅ Supprime tous les matchs d'un événement (DANGEREUX)
     */
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

            Event event = eventService.getEventById(eventId);
            event.setTournamentPhase(TournamentPhase.GROUP_STAGE_FINISHED);
            eventService.save(event);

            log.info("Matchs supprimés pour eventId={} par userId={}", eventId, currentUser.getId());

            return ResponseEntity.ok(
                    new ApiResponse<>(true, "Matchs supprimés avec succès", "OK")
            );

        } catch (IllegalStateException e) {
            log.warn("Erreur métier reset matches eventId={}: {}", eventId, e.getMessage());
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, e.getMessage(), null));

        } catch (Exception e) {
            log.error("Erreur interne reset matches eventId=" + eventId, e);
            return ResponseEntity.status(500)
                    .body(new ApiResponse<>(
                            false,
                            "Erreur interne du serveur",
                            null
                    ));
        }
    }

    /**
     * ✅ Récupère les résultats finaux d'un tournoi
     */
    @GetMapping("/{eventId}/final-results")
    public ResponseEntity<ApiResponse<FinalResultsDTO>> getFinalResults(
            @PathVariable Long eventId
    ) {
        try {
            FinalResultsDTO results = finalResultService.getFinalResults(eventId);
            return ResponseEntity.ok(new ApiResponse<>(true, "Résultats finaux", results));

        } catch (Exception e) {
            log.error("Erreur récupération résultats finaux eventId=" + eventId, e);
            return ResponseEntity.status(500)
                    .body(new ApiResponse<>(false, "Erreur lors de la récupération des résultats", null));
        }
    }

    /**
     * ✅ Récupère le résumé complet d'un tournoi
     */
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
            log.error("Erreur récupération résumé tournoi eventId=" + eventId, e);
            return ResponseEntity.status(500)
                    .body(new ApiResponse<>(false, "Erreur lors de la récupération du résumé", null));
        }
    }
}