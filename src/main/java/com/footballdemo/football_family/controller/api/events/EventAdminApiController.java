package com.footballdemo.football_family.controller.api.events;

import com.footballdemo.football_family.dto.ApiResponse;
import com.footballdemo.football_family.dto.EventDTO;
import com.footballdemo.football_family.dto.CreateEventDTO;
import com.footballdemo.football_family.dto.CreateSingleMatchDTO;
import com.footballdemo.football_family.model.Event;
import com.footballdemo.football_family.model.User;
import com.footballdemo.football_family.service.EventService;
import com.footballdemo.football_family.service.UserService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@Slf4j  // ✅ AJOUTER
@RestController
@RequestMapping("/api/events/admin")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CLUB_ADMIN')")  // ✅ AJOUTER CETTE LIGNE
public class EventAdminApiController {

    private final EventService eventService;
    private final UserService userService;

   private User getCurrentUser(Principal principal) {
    if (principal == null) {
        throw new IllegalStateException("Utilisateur non authentifié");
    }
    
    return userService.getUserByUsername(principal.getName())
            .orElseThrow(() -> new IllegalStateException("Utilisateur introuvable"));
}

    // 1️⃣ Liste des événements admin
@GetMapping("/all")
public ApiResponse<List<EventDTO>> getAllAdminEvents(Principal principal) {

User admin = getCurrentUser(principal); 

   List<EventDTO> dtos = eventService.getAllActiveEventDtos(admin);


    return new ApiResponse<>(true, "Liste chargée", dtos);
}



    // 2️⃣ Création d’un nouvel événement
  @PostMapping("/create")
public ApiResponse<EventDTO> createAdminEvent(
        @Valid @RequestBody CreateEventDTO dto,  // ✅ AJOUTER @Valid
        Principal principal) {

      User organizer = getCurrentUser(principal); 

        Event created = eventService.createEvent(dto, organizer);

  return new ApiResponse<>(
    true,
    "Événement créé",
    EventDTO.from(
        created,
        organizer.getId(),
        0,      // acceptedParticipants
        null,   // teamsRegisteredByMyClub
        null    // 🆕 pendingTeamsByMyClub
    )
);

    }

/**
 * Supprimer un event (soft delete)
 */
@DeleteMapping("/{eventId}")
public ApiResponse<Void> deleteEvent(@PathVariable Long eventId, Principal principal) {

    User user = getCurrentUser(principal);

    boolean changed = eventService.deleteEvent(eventId, user);

    if (!changed) {
        return new ApiResponse<>(true, "Événement déjà archivé", null);
    }
    return new ApiResponse<>(true, "Événement archivé avec succès", null);
}
/**
 * Restaurer un event supprimé
 */
@PostMapping("/{eventId}/restore")
public ApiResponse<EventDTO> restoreEvent(
        @PathVariable Long eventId,
        Principal principal) {
    
    User user = getCurrentUser(principal);
    Event restored = eventService.restoreEvent(eventId, user);
    
    EventDTO dto = EventDTO.from(
        restored,
        user.getId(),
        eventService.countAcceptedParticipants(eventId),
        null,
        null
    );
    
    return new ApiResponse<>(true, "Événement restauré avec succès", dto);
}

/**
 * Suppression définitive d'un event (HARD DELETE - RGPD)
 * ⚠️ IRRÉVERSIBLE - Réservé aux SUPER_ADMIN
 */
@DeleteMapping("/{eventId}/hard-delete")
@PreAuthorize("hasRole('SUPER_ADMIN')")
public ApiResponse<Void> hardDeleteEvent(
        @PathVariable Long eventId,
        @RequestParam(required = true) String confirmation,  // ✅ AJOUTER
        Principal principal) {
    
    // ✅ VÉRIFICATION CONFIRMATION
    if (!"DELETE_PERMANENT".equals(confirmation)) {
        throw new IllegalArgumentException(
            "Confirmation requise : confirmation=DELETE_PERMANENT"
        );
    }
    
    User user = getCurrentUser(principal);
    eventService.hardDeleteEvent(eventId, user);
    
    return new ApiResponse<>(true, "Événement supprimé définitivement", null);
}

/**
 * Récupérer tous les events supprimés (admin uniquement)
 */
@GetMapping("/deleted")
public ApiResponse<List<EventDTO>> getDeletedEvents(Principal principal) {

   User user = getCurrentUser(principal);

    List<EventDTO> dtos = eventService.getDeletedEventDtos(user);

    return new ApiResponse<>(true, "Événements supprimés récupérés", dtos);
}

/**
 * Récupérer un event par ID (même s'il est supprimé) - Admin uniquement
 */
@GetMapping("/{eventId}/including-deleted")
public ApiResponse<EventDTO> getEventIncludingDeleted(
        @PathVariable Long eventId,
        Principal principal) {

    User user = getCurrentUser(principal);

    EventDTO dto = eventService.getEventDtoByIdIncludingDeleted(eventId, user);

    return new ApiResponse<>(true, "Événement récupéré", dto);
}


/**
 * 🆕 Création d'un match unique (médiatisation)
 */
@PostMapping("/create-match")
public ApiResponse<EventDTO> createSingleMatch(
        @Valid @RequestBody CreateSingleMatchDTO dto,
        Principal principal) {

    User organizer = getCurrentUser(principal);

    Event created = eventService.createSingleMatchEvent(dto, organizer);

    return new ApiResponse<>(
        true,
        "Match créé avec succès",
        EventDTO.from(
            created,
            organizer.getId(),
            0,      // Pas de participants pour un match unique
            null,
            null
        )
    );
}



/**
 * Récupérer un événement par ID (pour l'admin)
 */
@GetMapping("/{eventId}")
public ApiResponse<EventDTO> getEventForAdmin(
        @PathVariable Long eventId,
        Principal principal) {
    
    User admin = getCurrentUser(principal);
    Event event = eventService.getEventById(eventId);
    
    if (!eventService.canManageEvent(event, admin)) {
        throw new com.footballdemo.football_family.exception.ForbiddenException(
            "Vous n'avez pas les droits pour voir cet événement"
        );
    }
    
    EventDTO dto = EventDTO.from(
        event,
        admin.getId(),
        eventService.countAcceptedParticipants(eventId),
        null,
        null
    );
    
    return new ApiResponse<>(true, "Événement récupéré", dto);
}


}
