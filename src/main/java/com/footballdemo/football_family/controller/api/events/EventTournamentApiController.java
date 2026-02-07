package com.footballdemo.football_family.controller.api.events;

import java.security.Principal;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.footballdemo.football_family.dto.ApiResponse;
import com.footballdemo.football_family.dto.GroupRankingDTO;
import com.footballdemo.football_family.dto.TournamentGroupDTO;
import com.footballdemo.football_family.exception.ForbiddenException;
import com.footballdemo.football_family.model.Event;
import com.footballdemo.football_family.model.EventVisibility;
import com.footballdemo.football_family.model.User;
import com.footballdemo.football_family.service.EventAccessService;
import com.footballdemo.football_family.service.EventService;
import com.footballdemo.football_family.service.UserService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/events/tournament")
@RequiredArgsConstructor
public class EventTournamentApiController {

    private final EventService eventService;
    private final UserService userService;
    private final EventAccessService eventAccessService;

    private User getUser(Principal p) {
        return userService.getUserByUsername(p.getName()).orElseThrow();
    }

    // ==========================================================
    // 1️⃣ Lecture : Récupérer les poules
    // ==========================================================
   @GetMapping("/{eventId}/groups")
public ResponseEntity<ApiResponse<List<TournamentGroupDTO>>> getGroups(
        @PathVariable Long eventId,
        Principal principal) {

    User user = getUser(principal);
    Event event = eventService.getEventById(eventId);

    eventAccessService.assertCanView(event, user);

    var groups = eventService.getGroups(eventId)
            .stream()
            .map(TournamentGroupDTO::from)
            .toList();

    return ResponseEntity.ok(new ApiResponse<>(true, "Groupes récupérés", groups));
}

    // ==========================================================
    // 2️⃣ Lecture : Classements des poules
    // ==========================================================
@GetMapping("/{eventId}/group-rankings")
public ResponseEntity<ApiResponse<Map<Long, List<GroupRankingDTO>>>> getRankings(
        @PathVariable Long eventId,
        Principal principal) {

    try {
        Event event = eventService.getEventById(eventId);
        
        // ✅ SI L'ÉVÉNEMENT EST PUBLIC, ON PERMET L'ACCÈS SANS VÉRIFICATION
        if (event.getVisibility() == EventVisibility.PUBLIC) {
            
            try {
                // ⚠️ On passe null comme user pour les événements publics
                Map<Long, List<GroupRankingDTO>> data = 
                    eventService.computeGroupRankings(eventId, null);
                
                log.debug("Rankings computed for public event {}: {} groups", eventId, data.size());
                return ResponseEntity.ok(new ApiResponse<>(true, "Classements récupérés", data));
                
            } catch (Exception e) {
                log.error("Error computing rankings for public event {}", eventId, e);
                
                // Retourner un message vide plutôt qu'une erreur
                return ResponseEntity.ok(new ApiResponse<>(true, "Aucun classement disponible", Map.of()));
            }
        }
        
        // ❌ ÉVÉNEMENT PRIVÉ : vérifier les droits
        if (principal == null) {
            log.warn("Access denied to private event {} - no principal", eventId);
            return ResponseEntity.status(403)
                .body(new ApiResponse<>(false, "Accès refusé", null));
        }
        
        User user = getUser(principal);
        eventAccessService.assertCanView(event, user);
        
        Map<Long, List<GroupRankingDTO>> data = 
            eventService.computeGroupRankings(eventId, user);
        
        return ResponseEntity.ok(new ApiResponse<>(true, "Classements récupérés", data));
        
    } catch (ForbiddenException e) {
        log.warn("Forbidden access to event {} rankings: {}", eventId, e.getMessage());
        return ResponseEntity.status(403)
            .body(new ApiResponse<>(false, e.getMessage(), null));
            
    } catch (Exception e) {
        log.error("Unexpected error in getRankings for event {}", eventId, e);
        return ResponseEntity.status(500)
            .body(new ApiResponse<>(false, "Erreur serveur", null));
    }
}

}