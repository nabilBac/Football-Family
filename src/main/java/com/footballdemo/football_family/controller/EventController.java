package com.footballdemo.football_family.controller;

import com.footballdemo.football_family.dto.*;
import com.footballdemo.football_family.exception.DuplicateResourceException;
import com.footballdemo.football_family.exception.ForbiddenException;
import com.footballdemo.football_family.exception.ResourceNotFoundException;
import com.footballdemo.football_family.model.*;
import com.footballdemo.football_family.repository.EventRegistrationRepository;
import com.footballdemo.football_family.service.EventService;
import com.footballdemo.football_family.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDate;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class EventController {

    private final EventService eventService;
    private final EventRegistrationRepository eventRegistrationRepo;
    private final UserService userService;

    /**
     * Récupère l'ID de l'utilisateur connecté
     */
    private Long getCurrentUserId(Principal principal) {
        if (principal == null)
            return null;
        return userService.getUserByUsername(principal.getName())
                .map(User::getId)
                .orElse(null);
    }

    @PostMapping
    public ResponseEntity<ApiResponse<EventDTO>> createEvent(
            @Valid @RequestBody CreateEventDTO request, // ✅ Utilise CreateEventDTO
            Principal principal) {

        log.info("Création d'un événement par {}",
                principal != null ? principal.getName() : "anonyme");

        // Récupérer l'utilisateur organisateur
        User organizer = userService.getUserByUsername(principal.getName())
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        // ✅ Appeler la NOUVELLE méthode du service (à créer)
        Event event = eventService.createEventFromDTO(request, organizer);

        // Retourner le DTO de réponse
        Long currentUserId = getCurrentUserId(principal);
        EventDTO dto = EventDTO.from(event, currentUserId);

        return ResponseEntity.status(201)
                .body(new ApiResponse<>(true, "Événement créé avec succès", dto));
    }

    @PostMapping("/{eventId}/add-team")
    public ResponseEntity<ApiResponse<EventDTO>> addTeam(
            @PathVariable Long eventId,
            @RequestParam Long teamId,
            Principal principal) {
        log.info("Ajout équipe {} à l'événement {} par {}",
                teamId, eventId, principal.getName());

        Event event = eventService.addTeamToEvent(eventId, teamId);
        Long currentUserId = getCurrentUserId(principal);
        EventDTO dto = EventDTO.from(event, currentUserId);

        return ResponseEntity.ok(new ApiResponse<>(true, "Équipe ajoutée", dto));
    }

    @GetMapping("/all")
    public ResponseEntity<ApiResponse<Page<EventDTO>>> getAllEvents(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Principal principal) {
        try {
            log.info("🔍 [DEBUG] Début getAllEvents - Page: {}, Size: {}", page, size);
            log.info("🔍 [DEBUG] Principal: {}", principal);

            Long currentUserId = getCurrentUserId(principal);
            log.info("🔍 [DEBUG] Current User ID: {}", currentUserId);

            Page<Event> events = eventService.getAllEvents(PageRequest.of(page, size));
            log.info("🔍 [DEBUG] Events récupérés: {}", events.getTotalElements());

            Page<EventDTO> dtos = events.map(event -> {
                log.debug("🔍 [DEBUG] Conversion Event ID: {}", event.getId());
                return EventDTO.from(event, currentUserId);
            });

            log.info("✅ [DEBUG] Succès getAllEvents");
            return ResponseEntity.ok(new ApiResponse<>(true, "Tous les événements", dtos));

        } catch (Exception e) {
            log.error("❌ [ERROR] Erreur dans getAllEvents", e);
            return ResponseEntity.status(500)
                    .body(new ApiResponse<>(false, "Erreur: " + e.getMessage(), null));
        }
    }

    @GetMapping("/{eventId}")
    public ResponseEntity<ApiResponse<EventDTO>> getEvent(
            @PathVariable Long eventId,
            Principal principal) {
        log.debug("Récupération événement {}", eventId);

        Event event = eventService.getEventById(eventId);
        Long currentUserId = getCurrentUserId(principal);
        EventDTO dto = EventDTO.from(event, currentUserId);

        return ResponseEntity.ok(new ApiResponse<>(true, "Événement récupéré", dto));
    }

    @GetMapping("/visible")
    public ResponseEntity<ApiResponse<Page<EventDTO>>> getVisibleEvents(
            @RequestParam(defaultValue = "false") boolean clubMember,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Principal principal) {
        log.debug("Récupération événements visibles - Membre: {}", clubMember);

        Long currentUserId = getCurrentUserId(principal);
        Page<Event> events = eventService.getVisibleEvents(clubMember, PageRequest.of(page, size));
        Page<EventDTO> dtos = events.map(event -> EventDTO.from(event, currentUserId));

        return ResponseEntity.ok(new ApiResponse<>(true, "Événements visibles", dtos));
    }

    @GetMapping("/filter")
    public ResponseEntity<ApiResponse<Page<EventDTO>>> filterEvents(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String term,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Principal principal) {
        log.debug("Filtrage événements - Type: {}, Terme: {}", type, term);

        Long currentUserId = getCurrentUserId(principal);
        Page<Event> events = eventService.filterAndSearch(type, term, PageRequest.of(page, size));
        Page<EventDTO> dtos = events.map(event -> EventDTO.from(event, currentUserId));

        return ResponseEntity.ok(new ApiResponse<>(true, "Événements filtrés", dtos));
    }

    @PostMapping("/{eventId}/register")
    public ResponseEntity<ApiResponse<EventRegistrationDTO>> registerPlayer(
            @PathVariable Long eventId,
            @Valid @RequestBody RegisterToEventDTO dto,
            Principal principal) {
        try {
            log.info("Inscription à l'événement {} par {}", eventId, principal.getName());

            // Récupérer l'utilisateur connecté
            User player = userService.getUserByUsername(principal.getName())
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

            // Vérifier que l'eventId du DTO correspond au path
            if (!eventId.equals(dto.getEventId())) {
                return ResponseEntity.badRequest()
                        .body(new ApiResponse<>(false, "L'ID de l'événement ne correspond pas", null));
            }

            // Appeler la NOUVELLE méthode du service
            EventRegistration reg = eventService.registerPlayerToEvent(dto, player);
            EventRegistrationDTO responseDto = EventRegistrationDTO.from(reg);

            return ResponseEntity.status(201)
                    .body(new ApiResponse<>(true, "Inscription réussie", responseDto));

        } catch (DuplicateResourceException e) {
            log.warn("Tentative d'inscription en double: {}", e.getMessage());
            return ResponseEntity.status(409)
                    .body(new ApiResponse<>(false, e.getMessage(), null));

        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(404)
                    .body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @GetMapping("/{eventId}/registrations")
    public ResponseEntity<ApiResponse<Page<EventRegistrationDTO>>> getEventRegistrations(
            @PathVariable Long eventId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        log.debug("Récupération inscriptions événement {}", eventId);

        Page<EventRegistration> regs = eventRegistrationRepo.findByEventId(eventId, PageRequest.of(page, size));
        Page<EventRegistrationDTO> dtos = regs.map(EventRegistrationDTO::from);

        return ResponseEntity.ok(new ApiResponse<>(true, "Inscriptions récupérées", dtos));
    }

    @PostMapping("/{eventId}/registrations/{registrationId}/validate")
    public ResponseEntity<ApiResponse<EventRegistrationDTO>> validateRegistration(
            @PathVariable Long eventId,
            @PathVariable Long registrationId,
            Principal principal) {
        log.info("Validation inscription {} par {}", registrationId, principal.getName());

        // Vérifier que l'utilisateur est organisateur
        Event event = eventService.getEventById(eventId);
        Long currentUserId = getCurrentUserId(principal);

        if (event.getOrganizer() != null &&
                !event.getOrganizer().getId().equals(currentUserId)) {
            throw new ForbiddenException("Seul l'organisateur peut valider les inscriptions");
        }

        EventRegistration updated = eventService.validateRegistration(eventId, registrationId);
        EventRegistrationDTO dto = EventRegistrationDTO.from(updated);

        return ResponseEntity.ok(new ApiResponse<>(true, "Inscription validée", dto));
    }

    @PostMapping("/{eventId}/media")
    public ResponseEntity<ApiResponse<Media>> addMedia(
            @PathVariable Long eventId,
            @RequestBody Media media) {
        log.info("Ajout média à l'événement {}", eventId);

        Media savedMedia = eventService.addMediaToEvent(eventId, media);
        return ResponseEntity.status(201)
                .body(new ApiResponse<>(true, "Média ajouté", savedMedia));
    }

    @DeleteMapping("/{eventId}/media/{mediaId}")
    public ResponseEntity<ApiResponse<String>> removeMedia(
            @PathVariable Long eventId,
            @PathVariable Long mediaId) {
        log.info("Suppression média {} de l'événement {}", mediaId, eventId);

        eventService.removeMediaFromEvent(eventId, mediaId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Média supprimé", null));
    }

    @GetMapping("/{eventId}/remaining-places")
    public ResponseEntity<ApiResponse<Integer>> getRemainingPlaces(
            @PathVariable Long eventId) {
        int remaining = eventService.getRemainingPlaces(eventId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Places restantes", remaining));
    }

    @PostMapping("/{eventId}/create-match")
    public ResponseEntity<ApiResponse<MatchDTO>> createMatch(
            @PathVariable Long eventId,
            @RequestParam String name,
            @RequestParam String date,
            @RequestParam String location,
            @RequestParam List<Long> teamIds) {
        LocalDate matchDate = LocalDate.parse(date); // gérer le format si nécessaire
        Match match = eventService.createMatch(eventId, name, matchDate, location, teamIds);
        return ResponseEntity.status(201)
                .body(new ApiResponse<>(true, "Match créé avec succès", MatchDTO.from(match)));
    }

}