package com.footballdemo.football_family.controller.api.events;

import com.footballdemo.football_family.dto.*;
import com.footballdemo.football_family.model.Event;
import com.footballdemo.football_family.model.EventStatus;
import com.footballdemo.football_family.model.User;
import com.footballdemo.football_family.security.EventSecurityService;
import com.footballdemo.football_family.service.EventService;
import com.footballdemo.football_family.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.security.Principal;


/**
 * ✅ VERSION SÉCURISÉE - Contrôleur de gestion d'événements
 * 
 * Améliorations :
 * - @Valid sur tous les DTOs
 * - Gestion d'erreur propre avec messages sécurisés
 * - Logging SLF4J au lieu de printStackTrace
 * - Validation des autorisations
 * - Messages d'erreur user-friendly
 */
@Tag(name = "Events - Management", description = "Gestion d'événements (admin et organisateur)")
@RestController
@RequestMapping("/api/events/manage")
@RequiredArgsConstructor
@Slf4j
public class EventManagementApiController {

    private final EventService eventService;
    private final UserService userService;
     private final EventSecurityService eventSecurityService;

    /**
     * ✅ Récupère l'utilisateur connecté depuis le Principal
     * @throws IllegalStateException si l'utilisateur n'existe pas
     */
    private User getCurrentUser(Principal principal) {
        if (principal == null) {
            log.error("Principal is null - user not authenticated");
            throw new IllegalStateException("Utilisateur non authentifié");
        }

        return userService.getUserByUsername(principal.getName())
                .orElseThrow(() -> {
                    log.error("User not found for principal: {}", principal.getName());
                    return new IllegalStateException("Utilisateur introuvable");
                });
    }

    // ============================================================
    // 🟦 CRÉATION D'ÉVÉNEMENTS (OPEN ou CLUB)
    // ============================================================
    
    /**
     * ✅ Créer un événement (public ou club)
     * 
     * Validations effectuées :
     * - Données du DTO (via @Valid)
     * - Autorisations (via EventService)
     * - Cohérence des dates et quotas
     * 
     * @param dto DTO de création avec validations Jakarta
     * @param principal Utilisateur connecté
     * @return Événement créé avec détails
     */
    @Operation(summary = "Créer un événement (public ou club)")
    @PostMapping
    public ResponseEntity<ApiResponse<EventDTO>> createEvent(
            @Valid @RequestBody CreateEventDTO dto,
            Principal principal) {

        try {
            log.info("Création d'événement demandée - Type: {}, Nom: {}", 
                    dto.getType(), dto.getName());

            User organizer = getCurrentUser(principal);

            // 🔒 Toute la logique d'autorisation est dans EventService
            Event event = eventService.createEvent(dto, organizer);

          EventDTO response = EventDTO.from(
    event,
    organizer.getId(),
    0,      // acceptedParticipants
    null,   // teamsRegisteredByMyClub
    null    // 🆕 pendingTeamsByMyClub
);

            log.info("Événement créé avec succès - ID: {}, Nom: {}", 
                    event.getId(), event.getName());

            return ResponseEntity
                    .status(201)
                    .body(new ApiResponse<>(true, "Événement créé avec succès", response));

        } catch (AccessDeniedException e) {
            log.warn("Accès refusé lors de la création d'événement - User: {}, Reason: {}", 
                    principal != null ? principal.getName() : "null"
, e.getMessage());
            return ResponseEntity
                    .status(403)
                    .body(new ApiResponse<>(false, "Accès refusé : " + e.getMessage(), null));

        } catch (IllegalArgumentException e) {
            log.warn("Données invalides pour création d'événement - {}", e.getMessage());
            return ResponseEntity
                    .status(400)
                    .body(new ApiResponse<>(false, e.getMessage(), null));

       } catch (Exception e) {
    log.error("Erreur lors de la création d'événement (user={}, dto={})",
            principal != null ? principal.getName() : "null",
            dto,
            e);

    return ResponseEntity
            .status(500)
            .body(new ApiResponse<>(false,
                    "Erreur création: " + e.getClass().getSimpleName() + " - " + e.getMessage(),
                    null));
}

    }
    
    /**
     * ✅ Ajouter une image/logo à un événement existant
     * 
     * Validations :
     * - Format de fichier (jpg, png, gif, webp)
     * - Taille maximale (gérée par Spring)
     * - Autorisation de l'organisateur
     * 
     * @param eventId ID de l'événement
     * @param file Fichier image à uploader
     * @param principal Utilisateur connecté
     * @return Événement mis à jour avec URL de l'image
     */
    @Operation(summary = "Ajouter une image à un événement")
    @PostMapping("/{eventId}/media")
    public ResponseEntity<ApiResponse<EventDTO>> uploadEventMedia(
            @PathVariable Long eventId,
            @RequestParam("file") MultipartFile file,
            Principal principal) {

        try {
            log.info("Upload média demandé - EventId: {}, Filename: {}, Size: {} bytes", 
                    eventId, file.getOriginalFilename(), file.getSize());

            // Validation du fichier
            if (file.isEmpty()) {
                return ResponseEntity
                        .status(400)
                        .body(new ApiResponse<>(false, "Le fichier est vide", null));
            }

            // Validation du type MIME
            String contentType = file.getContentType();
            if (contentType == null || 
                !contentType.matches("image/(jpeg|png|gif|webp)")) {
                return ResponseEntity
                        .status(400)
                        .body(new ApiResponse<>(false, 
                                "Format de fichier non supporté. Utilisez jpg, png, gif ou webp", 
                                null));
            }

            User organizer = getCurrentUser(principal);

            Event updated = eventService.uploadEventMedia(eventId, file, organizer);

          EventDTO response = EventDTO.from(
    updated,
    organizer.getId(),
    eventService.countAcceptedParticipants(updated.getId()),
    null,   // teamsRegisteredByMyClub
    null    // 🆕 pendingTeamsByMyClub
);

            log.info("Média uploadé avec succès - EventId: {}, URL: {}", 
                    eventId, updated.getImageUrl());

            return ResponseEntity.ok(
                    new ApiResponse<>(true, "Logo ajouté avec succès", response)
            );

        } catch (AccessDeniedException e) {
            log.warn("Accès refusé pour upload média - EventId: {}, User: {}", 
                    eventId, principal.getName());
            return ResponseEntity
                    .status(403)
                    .body(new ApiResponse<>(false, "Vous n'avez pas les droits pour modifier cet événement", null));

        } catch (IllegalArgumentException e) {
            log.warn("Données invalides pour upload média - EventId: {}, Error: {}", 
                    eventId, e.getMessage());
            return ResponseEntity
                    .status(400)
                    .body(new ApiResponse<>(false, e.getMessage(), null));

        } catch (Exception e) {
            log.error("Erreur lors de l'upload du média - EventId: {}", eventId, e);
            return ResponseEntity
                    .status(500)
                    .body(new ApiResponse<>(false, 
                            "Erreur lors de l'upload de l'image", 
                            null));
        }
    }

    
    /**
     * ✅ Mettre à jour le statut d'un événement
     * 
     * Statuts possibles : UPCOMING, LIVE, COMPLETED, CANCELLED
     * 
     * @param eventId ID de l'événement
     * @param status Nouveau statut (enum EventStatus)
     * @param principal Utilisateur connecté
     * @return Événement avec statut mis à jour
     */
    @Operation(summary = "Mettre à jour le statut d'un événement")
    @PatchMapping("/{eventId}/status")
    public ResponseEntity<ApiResponse<EventDTO>> updateStatus(
            @PathVariable Long eventId,
            @RequestParam String status,
            Principal principal) {

        try {
            log.info("Mise à jour statut demandée - EventId: {}, NewStatus: {}", 
                    eventId, status);

            User current = getCurrentUser(principal);

            Event event = eventService.getEventById(eventId);

            // 🔒 Vérification d'autorisation
            if (!eventService.canManageEvent(event, current)) {
                log.warn("Accès refusé pour mise à jour statut - EventId: {}, User: {}", 
                        eventId, current.getUsername());
                return ResponseEntity
                        .status(403)
                        .body(new ApiResponse<>(false, 
                                "Vous n'avez pas les droits pour modifier cet événement", 
                                null));
            }

            // Validation du statut
            EventStatus newStatus;
            try {
                newStatus = EventStatus.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException e) {
                log.warn("Statut invalide - EventId: {}, Status: {}", eventId, status);
                return ResponseEntity
        .status(400)
        .body(new ApiResponse<>(false, 
                "Statut invalide. Valeurs acceptées : DRAFT, PUBLISHED, REGISTRATION_CLOSED, ONGOING, COMPLETED, CANCELED", 
                null));
            }

            Event updated = eventService.updateEventStatus(eventId, newStatus);

            int accepted = eventService.countAcceptedParticipants(updated.getId());

           EventDTO response = EventDTO.from(
    updated,
    current.getId(),
    accepted,
    null,   // teamsRegisteredByMyClub
    null    // 🆕 pendingTeamsByMyClub
);

            log.info("Statut mis à jour avec succès - EventId: {}, NewStatus: {}", 
                    eventId, newStatus);

            return ResponseEntity.ok(
                    new ApiResponse<>(true, "Statut mis à jour avec succès", response)
            );

        } catch (IllegalArgumentException e) {
            log.warn("Erreur mise à jour statut - EventId: {}, Error: {}", 
                    eventId, e.getMessage());
            return ResponseEntity
                    .status(400)
                    .body(new ApiResponse<>(false, e.getMessage(), null));

        } catch (Exception e) {
            log.error("Erreur lors de la mise à jour du statut - EventId: {}", eventId, e);
            return ResponseEntity
                    .status(500)
                    .body(new ApiResponse<>(false, 
                            "Erreur lors de la mise à jour du statut", 
                            null));
        }
    }

    
    /**
     * ✅ Supprimer un événement
     * 
     * Règles :
     * - Seul l'organisateur ou un admin peut supprimer
     * - Impossible de supprimer un événement en cours (LIVE)
     * - Suppression en cascade des inscriptions et matchs
     * 
     * @param eventId ID de l'événement
     * @param principal Utilisateur connecté
     * @return Message de confirmation
     */
    @Operation(summary = "Supprimer un événement")
    @DeleteMapping("/{eventId}")
    public ResponseEntity<ApiResponse<String>> deleteEvent(
            @PathVariable Long eventId,
            Principal principal) {

        try {
            log.info("Suppression d'événement demandée - EventId: {}", eventId);

            User currentUser = getCurrentUser(principal);

            Event event = eventService.getEventById(eventId);

            // 🔒 Vérification d'autorisation
            if (!eventService.canManageEvent(event, currentUser)) {
                log.warn("Accès refusé pour suppression - EventId: {}, User: {}", 
                        eventId, currentUser.getUsername());
                return ResponseEntity
                        .status(403)
                        .body(new ApiResponse<>(false, 
                                "Vous n'avez pas les droits pour supprimer cet événement", 
                                null));
            }

           if (event.getStatus() == EventStatus.ONGOING) {
    log.warn("Tentative de suppression d'événement en cours - EventId: {}", eventId);
    return ResponseEntity
            .status(400)
            .body(new ApiResponse<>(false, 
                    "Impossible de supprimer un événement en cours", 
                    null));
}

            eventService.deleteEvent(eventId, currentUser);

            log.info("Événement supprimé avec succès - EventId: {}", eventId);

            return ResponseEntity.ok(
                    new ApiResponse<>(true, "Événement supprimé avec succès", null)
            );

        } catch (IllegalArgumentException e) {
            log.warn("Erreur suppression événement - EventId: {}, Error: {}", 
                    eventId, e.getMessage());
            return ResponseEntity
                    .status(400)
                    .body(new ApiResponse<>(false, e.getMessage(), null));

        } catch (Exception e) {
            log.error("Erreur lors de la suppression de l'événement - EventId: {}", eventId, e);
            return ResponseEntity
                    .status(500)
                    .body(new ApiResponse<>(false, 
                            "Erreur lors de la suppression de l'événement", 
                            null));
        }
    }
    
    /**
     * Démarre un tournoi (passe en ONGOING)
     * POST /api/events/manage/{eventId}/start
     */
 @PostMapping("/{eventId}/start")
public ResponseEntity<ApiResponse<EventDTO>> startTournament(
        @PathVariable Long eventId,
        Principal principal) {
    
    try {
        log.info("Démarrage tournoi demandé - EventId: {}", eventId);
        
        User currentUser = getCurrentUser(principal);
        Event event = eventService.getEventById(eventId);
        
        // Vérification des droits
        if (!eventService.canManageEvent(event, currentUser)) {
            return ResponseEntity.status(403)
                .body(new ApiResponse<>(false, "Accès refusé", null));
        }
        
        // Vérifications métier
        if (event.getStatus() == EventStatus.ONGOING) {
            return ResponseEntity.status(400)
                .body(new ApiResponse<>(false, "Tournoi déjà en cours", null));
        }
        
        if (event.getStatus() == EventStatus.COMPLETED) {
            return ResponseEntity.status(400)
                .body(new ApiResponse<>(false, "Tournoi déjà terminé", null));
        }
        
        // ✅ CORRECTION : Tout faire dans le service
        Event savedEvent = eventService.startTournament(eventId);
        
        EventDTO response = EventDTO.from(
            savedEvent,
            currentUser.getId(),
            eventService.countAcceptedParticipants(savedEvent.getId()),
            null,
            null
        );
        
        log.info("✅ Tournoi démarré - EventId: {}", eventId);
        
        return ResponseEntity.ok(
            new ApiResponse<>(true, "Tournoi démarré avec succès", response)
        );
        
    } catch (Exception e) {
        log.error("❌ Erreur démarrage tournoi - EventId: {}", eventId, e);
        return ResponseEntity.status(500)
            .body(new ApiResponse<>(false, "Erreur serveur", null));
    }
}
    
    // ========== ✅ NOUVEAU : TERMINER UN TOURNOI ==========
    
    /**
     * Termine un tournoi (passe en COMPLETED)
     * POST /api/events/manage/{eventId}/finish
     */
    @PostMapping("/{eventId}/finish")
public ResponseEntity<ApiResponse<EventDTO>> finishTournament(
        @PathVariable Long eventId,
        @RequestParam(required = false, defaultValue = "false") boolean force,
        Principal principal) {
    
    try {
        log.info("Fin tournoi demandée - EventId: {}, Force: {}", eventId, force);
        
        User currentUser = getCurrentUser(principal);
        Event event = eventService.getEventById(eventId);
        
        // Vérification des droits
        if (!eventService.canManageEvent(event, currentUser)) {
            return ResponseEntity.status(403)
                .body(new ApiResponse<>(false, "Accès refusé", null));
        }
        
        // Vérifications métier
        if (event.getStatus() == EventStatus.COMPLETED) {
            return ResponseEntity.status(400)
                .body(new ApiResponse<>(false, "Tournoi déjà terminé", null));
        }
        
        if (event.getStatus() != EventStatus.ONGOING && !force) {
            return ResponseEntity.status(400)
                .body(new ApiResponse<>(false, "Le tournoi n'est pas en cours. Utilisez force=true pour terminer quand même.", null));
        }
        
        // ✅ CORRECTION : Appel direct au service
        Event savedEvent = eventService.finishTournament(eventId);
        
        EventDTO response = EventDTO.from(
            savedEvent,
            currentUser.getId(),
            eventService.countAcceptedParticipants(savedEvent.getId()),
            null,
            null
        );
        
        log.info("✅ Tournoi terminé - EventId: {}", eventId);
        
        return ResponseEntity.ok(
            new ApiResponse<>(true, "Tournoi terminé avec succès", response)
        );
        
    } catch (Exception e) {
        log.error("❌ Erreur fin tournoi - EventId: {}", eventId, e);
        return ResponseEntity.status(500)
            .body(new ApiResponse<>(false, "Erreur serveur", null));
    }
}



/**
 * Annule un événement (passe en CANCELED)
 * POST /api/events/manage/{eventId}/cancel
 */
@Operation(summary = "Annuler un événement")
@RequestMapping(value = "/{eventId}/cancel", method = {RequestMethod.PATCH, RequestMethod.PUT})
public ResponseEntity<ApiResponse<EventDTO>> cancelEvent(
        @PathVariable Long eventId,
        Principal principal) {
    
    try {
        log.info("Annulation événement demandée - EventId: {}", eventId);
        
        User currentUser = getCurrentUser(principal);
        Event event = eventService.getEventById(eventId);
        
        // Vérification des droits
        if (!eventService.canManageEvent(event, currentUser)) {
            log.warn("Accès refusé pour annulation - EventId: {}, User: {}", 
                    eventId, currentUser.getUsername());
            return ResponseEntity.status(403)
                .body(new ApiResponse<>(false, "Accès refusé", null));
        }
        
        // Vérifications métier
        if (event.getStatus() == EventStatus.COMPLETED) {
            return ResponseEntity.status(400)
                .body(new ApiResponse<>(false, "Impossible d'annuler un événement terminé", null));
        }
        
        if (event.getStatus() == EventStatus.CANCELED) {
            return ResponseEntity.status(400)
                .body(new ApiResponse<>(false, "Événement déjà annulé", null));
        }
        
        // Mise à jour du statut
        Event updated = eventService.updateEventStatus(eventId, EventStatus.CANCELED);
        
        EventDTO response = EventDTO.from(
            updated,
            currentUser.getId(),
            eventService.countAcceptedParticipants(updated.getId()),
            null,
            null
        );
        
        log.info("✅ Événement annulé - EventId: {}", eventId);
        
        return ResponseEntity.ok(
            new ApiResponse<>(true, "Événement annulé avec succès", response)
        );
        
    } catch (Exception e) {
        log.error("❌ Erreur annulation événement - EventId: {}", eventId, e);
        return ResponseEntity.status(500)
            .body(new ApiResponse<>(false, "Erreur lors de l'annulation", null));
    }
}
}