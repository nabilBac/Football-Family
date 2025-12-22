package com.footballdemo.football_family.controller.api.events;

import com.footballdemo.football_family.dto.ApiResponse;
import com.footballdemo.football_family.dto.EventDTO;
import com.footballdemo.football_family.model.Event;
import com.footballdemo.football_family.model.EventVisibility;
import com.footballdemo.football_family.model.RegistrationType;
import com.footballdemo.football_family.service.EventService;
import com.footballdemo.football_family.service.UserService;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.*;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.security.Principal;

@Tag(name = "Events - Public", description = "Endpoints publics pour explorer les événements")
@RestController
@RequestMapping("/api/events/public")
@RequiredArgsConstructor
public class EventPublicApiController {

    private final EventService eventService;
    private final UserService userService;

    // 🆕 CLASSE INTERNE POUR LES STATS CLUB
    @lombok.Data
    @lombok.AllArgsConstructor
    private static class ClubStats {
        Integer accepted;
        Integer pending;
    }

    private Long getCurrentUserId(Principal principal) {
        if (principal == null) return null;
        return userService.getUserByUsername(principal.getName())
                .map(u -> u.getId())
                .orElse(null);
    }

    // ============================================================
    // 🟦 LISTE DES ÉVÉNEMENTS PUBLICS
    // ============================================================
    @Operation(summary = "Obtenir tous les événements publics")
    @GetMapping("/all")
    public ApiResponse<Page<EventDTO>> getPublicEvents(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Principal principal) {

        Long currentUserId = getCurrentUserId(principal);
        Page<Event> events = eventService.getPublicEvents(PageRequest.of(page, size));

        Page<EventDTO> dtos = events.map(event -> {
            int accepted = eventService.countAcceptedParticipants(event.getId());
            ClubStats clubStats = computeClubStats(event, principal); // 🆕

            return EventDTO.from(
                    event,
                    currentUserId,
                    accepted,
                    clubStats.accepted,  // 🆕
                    clubStats.pending    // 🆕
            );
        });

        return new ApiResponse<>(true, "Événements publics", dtos);
    }

    // ============================================================
    // 🟦 DETAILS D'UN ÉVÉNEMENT PUBLIC
    // ============================================================
    @Operation(summary = "Obtenir un événement public par son ID")
    @GetMapping("/{eventId}")
    public ApiResponse<EventDTO> getEvent(
            @PathVariable Long eventId,
            Principal principal) {

        Long currentUserId = getCurrentUserId(principal);
        Event event = eventService.getEventById(eventId);

        // Seuls les événements PUBLIC sont visibles
        if (event.getVisibility() != EventVisibility.PUBLIC) {
            return new ApiResponse<>(false, "Événement privé, accès refusé", null);
        }

        int accepted = eventService.countAcceptedParticipants(event.getId());
        ClubStats clubStats = computeClubStats(event, principal); // 🆕

        return new ApiResponse<>(
                true,
                "Événement récupéré",
                EventDTO.from(
                    event, 
                    currentUserId, 
                    accepted, 
                    clubStats.accepted,  // 🆕
                    clubStats.pending    // 🆕
                )
        );
    }

    // ============================================================
    // 🟦 EVENTS VISIBLES (OPEN + CLUB si membre club)
    // ============================================================
    @Operation(summary = "Obtenir les événements visibles par un utilisateur")
    @GetMapping("/visible")
    public ApiResponse<Page<EventDTO>> getVisibleEvents(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Principal principal) {

        Long currentUserId = getCurrentUserId(principal);
        Page<Event> events = eventService.getVisibleEvents(true, PageRequest.of(page, size));
        
        Page<EventDTO> dtos = events.map(event -> {
            int accepted = eventService.countAcceptedParticipants(event.getId());
            ClubStats clubStats = computeClubStats(event, principal); // 🆕

            return EventDTO.from(
                    event,
                    currentUserId,
                    accepted,
                    clubStats.accepted,  // 🆕
                    clubStats.pending    // 🆕
            );
        });

        return new ApiResponse<>(true, "Événements visibles", dtos);
    }

    // ============================================================
    // 🟦 FILTRE PUBLIC
    // ============================================================
    @Operation(summary = "Filtrer les événements publics")
    @GetMapping("/filter")
    public ApiResponse<Page<EventDTO>> filterEvents(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String term,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Principal principal) {

        Long currentUserId = getCurrentUserId(principal);
        Page<Event> events = eventService.filterAndSearch(type, term, PageRequest.of(page, size));

        Page<EventDTO> dtos = events.map(event -> {
            int accepted = eventService.countAcceptedParticipants(event.getId());
            ClubStats clubStats = computeClubStats(event, principal); // 🆕

            return EventDTO.from(
                    event,
                    currentUserId,
                    accepted,
                    clubStats.accepted,  // 🆕
                    clubStats.pending    // 🆕
            );
        });

        return new ApiResponse<>(true, "Événements filtrés", dtos);
    }

    // ============================================================
    // 🆕 HELPER : CALCULER LES STATS CLUB (ACCEPTED + PENDING)
    // ============================================================
    private ClubStats computeClubStats(Event event, Principal principal) {
        if (principal == null) return new ClubStats(null, null);

        var userOpt = userService.getUserByUsername(principal.getName());
        if (userOpt.isEmpty()) return new ClubStats(null, null);

        var user = userOpt.get();

        if (event.getRegistrationType() != RegistrationType.CLUB_ONLY) {
            return new ClubStats(null, null);
        }
        
        if (user.getPrimaryClubId() == null) {
            return new ClubStats(null, null);
        }

        Integer accepted = eventService.countTeamsRegisteredByClub(
                event.getId(),
                user.getPrimaryClubId()
        );
        
        Integer pending = eventService.countPendingTeamsByClub(
                event.getId(),
                user.getPrimaryClubId()
        );

        return new ClubStats(accepted, pending);
    }
}