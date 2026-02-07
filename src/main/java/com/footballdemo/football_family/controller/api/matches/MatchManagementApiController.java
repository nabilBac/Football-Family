package com.footballdemo.football_family.controller.api.matches;

import com.footballdemo.football_family.dto.ApiResponse;
import com.footballdemo.football_family.dto.CreateMatchEventDTO;
import com.footballdemo.football_family.dto.MatchDTO;
import com.footballdemo.football_family.dto.MatchEventDTO;
import com.footballdemo.football_family.model.Match;
import com.footballdemo.football_family.model.MatchStatus;
import com.footballdemo.football_family.repository.MatchRepository;
import com.footballdemo.football_family.service.MatchEventService;
import com.footballdemo.football_family.service.MatchService;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/matches")
@RequiredArgsConstructor
public class MatchManagementApiController {

    private final MatchRepository matchRepository;
    private final MatchService matchService;
    private final MatchEventService matchEventService;

    @GetMapping
    public ResponseEntity<ApiResponse<?>> getAllMatches() {
        List<MatchDTO> matches = matchRepository.findAll()
                .stream()
                .map(MatchDTO::from)
                .toList();

        return ResponseEntity.ok(
                new ApiResponse<>(true, "Liste complète des matchs", matches)
        );
    }

   @GetMapping("/event/{eventId}")
public ResponseEntity<ApiResponse<?>> getMatchesForEvent(@PathVariable Long eventId) {

    List<MatchDTO> matches = matchRepository
        .findByEventIdAndDateIsNotNullAndTimeIsNotNullOrderByDateAscTimeAscFieldAsc(eventId)
        .stream()
        .map(MatchDTO::from)
        .toList();

    return ResponseEntity.ok(
        new ApiResponse<>(true, "Planning de l'événement", matches)
    );
}


    // ================================
    // ⚽ GESTION DES ÉVÉNEMENTS - AVANT /{id} !
    // ================================

    /**
     * 📊 RÉCUPÉRER LES ÉVÉNEMENTS D'UN MATCH
     */
    @GetMapping("/{matchId}/events")
    public ResponseEntity<ApiResponse<?>> getMatchEvents(@PathVariable Long matchId) {
        try {
            List<MatchEventDTO> events = matchEventService.getMatchEvents(matchId);
            return ResponseEntity.ok(
                    new ApiResponse<>(true, "Événements du match", events)
            );
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.ok(
                    new ApiResponse<>(true, "Événements du match", new java.util.ArrayList<>())
            );
        }
    }

    /**
     * ➕ CRÉER UN ÉVÉNEMENT (ADMIN)
     */
    @PostMapping("/{matchId}/events")
    public ResponseEntity<ApiResponse<?>> createEvent(
            @PathVariable Long matchId,
            @RequestBody CreateMatchEventDTO dto) {
        
        dto.setMatchId(matchId);
        MatchEventDTO event = matchEventService.createEvent(dto);
        
        return ResponseEntity.ok(
                new ApiResponse<>(true, "Événement créé", event)
        );
    }

    /**
     * 🗑️ SUPPRIMER UN ÉVÉNEMENT (ADMIN)
     */
    @DeleteMapping("/{matchId}/events/{eventId}")
    public ResponseEntity<ApiResponse<?>> deleteEvent(
            @PathVariable Long matchId,
            @PathVariable Long eventId) {
        
        matchEventService.deleteEvent(eventId);
        
        return ResponseEntity.ok(
                new ApiResponse<>(true, "Événement supprimé", null)
        );
    }

    // ================================
    // 📋 RÉCUPÉRATION MATCH - APRÈS /events !
    // ================================

    /**
     * 📋 RÉCUPÉRER UN MATCH PAR ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> getMatch(@PathVariable Long id) {
        Match match = matchRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Match non trouvé"));
        
        return ResponseEntity.ok(
                new ApiResponse<>(true, "Match récupéré", MatchDTO.from(match))
        );
    }

    @PatchMapping("/{id}/finish")
    public ResponseEntity<ApiResponse<MatchDTO>> finishMatch(
            @PathVariable Long id,
            @RequestParam int scoreA,
            @RequestParam int scoreB
    ) {
        Match finished = matchService.finishMatch(id, scoreA, scoreB);

        return ResponseEntity.ok(
                new ApiResponse<>(true, "Match terminé", MatchDTO.from(finished))
        );
    }
    /**
 * ▶️ DÉMARRER UN MATCH
 */
@PostMapping("/{matchId}/start")
public ResponseEntity<ApiResponse<?>> startMatch(@PathVariable Long matchId) {
    try {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Match non trouvé"));

        // ✅ PROTECTION : match doit avoir 2 équipes
        // (adapte si tes getters s’appellent autrement)
        if (match.getTeamA() == null || match.getTeamB() == null) {
            throw new IllegalStateException("Match impossible : équipes non définies (en attente des qualifiés).");
        }

        // ✅ PROTECTION : on ne démarre que si SCHEDULED
        if (match.getStatus() != MatchStatus.SCHEDULED) {
            throw new IllegalStateException("Match impossible : statut actuel = " + match.getStatus());
        }

        // Mettre en IN_PROGRESS
        match.setStatus(MatchStatus.IN_PROGRESS);
        match.setActualStartTime(java.time.LocalDateTime.now());
        matchRepository.save(match);

        // Créer l'événement MATCH_STARTED
        matchEventService.createMatchStartedEvent(match);

        return ResponseEntity.ok(
                new ApiResponse<>(true, "Match démarré", MatchDTO.from(match))
        );

    } catch (IllegalStateException e) {
        // ✅ 400 (erreur métier)
        return ResponseEntity.badRequest().body(
                new ApiResponse<>(false, e.getMessage(), null)
        );

    } catch (Exception e) {
        return ResponseEntity.status(500).body(
                new ApiResponse<>(false, "Erreur : " + e.getMessage(), null)
        );
    }
}

}