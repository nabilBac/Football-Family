package com.footballdemo.football_family.controller.api.events;

import com.footballdemo.football_family.dto.*;
import com.footballdemo.football_family.exception.ForbiddenException;
import com.footballdemo.football_family.model.*;
import com.footballdemo.football_family.repository.EventRegistrationRepository;
import com.footballdemo.football_family.service.EventService;
import com.footballdemo.football_family.service.UserService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;


@Tag(name = "Events - Organizer", description = "Actions disponibles pour les organisateurs et clubs")
@Slf4j
@RestController
@RequestMapping("/api/events/manage")
@RequiredArgsConstructor
public class EventOrganizerApiController {

    private final EventService eventService;
    private final EventRegistrationRepository eventRegistrationRepo;
    private final UserService userService;

    private User getCurrentUser(Principal principal) {
        return userService.getUserByUsername(principal.getName())
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
    }

    // ============================================================
    // 🟦 AJOUT D'ÉQUIPE À L'ÉVÉNEMENT
    // ============================================================
@Operation(summary = "Ajouter une équipe à un événement")
@PostMapping("/{eventId}/add-team")
public ResponseEntity<ApiResponse<EventDTO>> addTeam(
        @PathVariable Long eventId,
        @RequestParam Long teamId,
        Principal principal) {

    User currentUser = getCurrentUser(principal);
    Event event = eventService.getEventById(eventId);

    if (!eventService.canManageEvent(event, currentUser)) {
        throw new ForbiddenException("Vous ne pouvez pas modifier cet événement");
    }

    eventService.addTeamToEvent(eventId, teamId);
    event = eventService.getEventById(eventId);
    
    EventDTO dto = EventDTO.from(event, currentUser.getId());
    return ResponseEntity.ok(new ApiResponse<>(true, "Équipe inscrite", dto));
}

    // ============================================================
    // 🟦 LISTE DES INSCRIPTIONS
    // ============================================================
    @Operation(summary = "Voir les inscriptions à un événement")
@GetMapping("/{eventId}/registrations")

    public ResponseEntity<ApiResponse<Page<EventRegistrationDTO>>> getEventRegistrations(
            @PathVariable Long eventId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Principal principal) {

        User currentUser = getCurrentUser(principal);
        Event event = eventService.getEventById(eventId);

        if (!eventService.canManageEvent(event, currentUser)) {
            throw new ForbiddenException("Accès refusé : vous ne pouvez pas gérer cet événement");
        }

        Page<EventRegistration> regs =
                eventRegistrationRepo.findByEventId(eventId, PageRequest.of(page, size));

        Page<EventRegistrationDTO> dtos = regs.map(EventRegistrationDTO::from);

        return ResponseEntity.ok(new ApiResponse<>(true, "Inscriptions récupérées", dtos));
    }

    // ============================================================
    // 🟦 VALIDER UNE INSCRIPTION
    // ============================================================
    @Operation(summary = "Valider une inscription")
@PostMapping("/{eventId}/registrations/{registrationId}/validate")

    public ResponseEntity<ApiResponse<EventRegistrationDTO>> validateRegistration(
            @PathVariable Long eventId,
            @PathVariable Long registrationId,
            Principal principal) {

        User currentUser = getCurrentUser(principal);

       EventRegistration updated = 
    eventService.acceptTeamRegistration(eventId, registrationId, currentUser);

        return ResponseEntity.ok(
                new ApiResponse<>(true, "Inscription validée", EventRegistrationDTO.from(updated))
        );
    }

    // ============================================================
    // 🟦 AJOUT MEDIA
    // ============================================================
@Operation(summary = "Ajouter un média à un événement")
@PostMapping("/{eventId}/media/custom")

public ResponseEntity<ApiResponse<Media>> addMedia(
        @PathVariable Long eventId,
        @RequestBody Media media,
        Principal principal) {

    User currentUser = getCurrentUser(principal);

    Media savedMedia = eventService.addMediaToEvent(eventId, media, currentUser);

    return ResponseEntity.status(201)
            .body(new ApiResponse<>(true, "Média ajouté", savedMedia));
}


    // ============================================================
    // 🟦 SUPPRESSION MEDIA
    // ============================================================
    @Operation(summary = "Supprimer un média d'un événement")
@DeleteMapping("/{eventId}/media/{mediaId}")

    public ResponseEntity<ApiResponse<String>> deleteMedia(
            @PathVariable Long eventId,
            @PathVariable Long mediaId,
            Principal principal) {

        User currentUser = getCurrentUser(principal);

        eventService.removeMediaFromEvent(eventId, mediaId, currentUser);

        return ResponseEntity.ok(new ApiResponse<>(true, "Média supprimé", null));
    }
}
