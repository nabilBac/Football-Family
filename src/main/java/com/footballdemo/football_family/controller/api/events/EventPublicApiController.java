package com.footballdemo.football_family.controller.api.events;

import com.footballdemo.football_family.dto.ApiResponse;
import com.footballdemo.football_family.dto.EventDTO;
import com.footballdemo.football_family.dto.MatchDTO;
import com.footballdemo.football_family.dto.TeamResponseDTO;
import com.footballdemo.football_family.mapper.TeamMapper;
import com.footballdemo.football_family.model.Event;
import com.footballdemo.football_family.model.EventStatus;
import com.footballdemo.football_family.model.EventVisibility;
import com.footballdemo.football_family.model.RegistrationType;
import com.footballdemo.football_family.model.Team;
import com.footballdemo.football_family.service.EventService;
import com.footballdemo.football_family.service.MatchService;
import com.footballdemo.football_family.service.UserService;
import java.util.List;
import java.util.stream.Collectors;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.security.Principal;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import com.footballdemo.football_family.repository.EventRepository;
import com.footballdemo.football_family.model.EventType;


@Tag(name = "Events - Public", description = "Endpoints publics pour explorer les événements")
@RestController
@RequestMapping("/api/events/public")
@RequiredArgsConstructor
public class EventPublicApiController {

private final EventService eventService;
private final UserService userService;
private final MatchService matchService;
private final EventRepository eventRepository;  // 🔥 AJOUTE CETTE LIGNE


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
// 🟦 MATCHS D'UN ÉVÉNEMENT (PUBLIC)
// ============================================================
@Operation(summary = "Obtenir tous les matchs d'un événement public")
@GetMapping("/{eventId}/matches")
public ApiResponse<List<MatchDTO>> getPublicEventMatches(
        @PathVariable Long eventId
) {
    List<MatchDTO> matches = matchService.getPublicMatchesForEvent(eventId);


    return new ApiResponse<>(true, "Matchs de l'événement", matches);
}


// ============================================================
// 🟦 ÉQUIPES D'UN ÉVÉNEMENT (PUBLIC)
// ============================================================
@Operation(summary = "Obtenir les équipes inscrites à un événement public")
@GetMapping("/{eventId}/teams")
public ApiResponse<List<TeamResponseDTO>> getPublicEventTeams(@PathVariable Long eventId) {
    Event event = eventService.getEventById(eventId);
    
    if (event.getVisibility() != EventVisibility.PUBLIC) {
        return new ApiResponse<>(false, "Événement privé", null);
    }
    
    List<Team> teams = eventService.getTeamsByEventId(eventId);
    List<TeamResponseDTO> dtos = teams.stream()
            .map(TeamMapper::toDTO)
            .collect(Collectors.toList());
    
    return new ApiResponse<>(true, "Équipes récupérées", dtos);
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



                    /**
 * Récupérer les events COMPLETED (historique public)
 */
@GetMapping("/completed")
public ResponseEntity<ApiResponse<Page<Event>>> getCompletedEvents(
        @RequestParam(required = false) String type,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size) {
    
    Pageable pageable = PageRequest.of(page, size, Sort.by("date").descending());
    
    Page<Event> events;
    
    if (type != null && !type.equals("all")) {
        events = eventRepository.findByStatusAndTypeAndDeletedFalse(
            EventStatus.COMPLETED,
            EventType.valueOf(type),
            pageable
        );
    } else {
        events = eventRepository.findByStatusAndDeletedFalse(
            EventStatus.COMPLETED,
            pageable
        );
    }
    
    return ResponseEntity.ok(
        new ApiResponse<>(true, "Events terminés récupérés", events)
    );
}

@GetMapping("/active")
public ResponseEntity<ApiResponse<Page<Event>>> getActiveEvents(
        @RequestParam(required = false) String type,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size) {
    
    Pageable pageable = PageRequest.of(page, size);
    
    Page<Event> events = eventRepository.findByStatusInAndDeletedFalse(
        List.of(EventStatus.PUBLISHED, EventStatus.ONGOING),
        pageable
    );
    
    return ResponseEntity.ok(new ApiResponse<>(true, "Events actifs récupérés", events));
}
}