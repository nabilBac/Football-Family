package com.footballdemo.football_family.controller.api.events;

import com.footballdemo.football_family.dto.ApiResponse;
import com.footballdemo.football_family.dto.EventRegistrationDTO;
import com.footballdemo.football_family.dto.RegisterClubToEventDTO;
import com.footballdemo.football_family.dto.RegisterToEventDTO;
import com.footballdemo.football_family.exception.DuplicateResourceException;
import com.footballdemo.football_family.exception.ResourceNotFoundException;
import com.footballdemo.football_family.model.Event;
import com.footballdemo.football_family.model.EventType;
import com.footballdemo.football_family.model.RegistrationStatus;
import com.footballdemo.football_family.model.EventRegistration;
import com.footballdemo.football_family.model.User;
import com.footballdemo.football_family.service.EventService;
import com.footballdemo.football_family.service.UserService;


import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.stream.Collectors;

@Tag(name = "Events - Registration", description = "Inscriptions aux événements publics")
@RestController
@RequestMapping("/api/events/registration")
@RequiredArgsConstructor
public class EventRegistrationApiController {

    private final EventService eventService;
    private final UserService userService;

    private User getCurrentUser(Principal principal) {
        return userService.getUserByUsername(principal.getName())
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
    }

    // ============================================================
    // 🟢 INSCRIPTION À UN ÉVÉNEMENT (OPEN_EVENT ONLY)
    // ============================================================
    @Operation(summary = "S'inscrire à un événement public")
    @PostMapping
    public ResponseEntity<ApiResponse<EventRegistrationDTO>> registerToEvent(
            @RequestBody RegisterToEventDTO dto,
            Principal principal) {

        try {
            User player = getCurrentUser(principal);

            // Charger l'événement UNE SEULE FOIS
            Event event = eventService.getEventById(dto.getEventId());

            // ✅ VÉRIFIER SI LES INSCRIPTIONS SONT FERMÉES
           if (event.isRegistrationClosed()) {
                return ResponseEntity.status(403)
                        .body(new ApiResponse<>(false, 
                                "Les inscriptions sont clôturées pour cet événement", 
                                null));
            }

            // ✅ VÉRIFIER SI LA DATE LIMITE EST DÉPASSÉE
            if (event.getRegistrationDeadline() != null && 
                java.time.LocalDateTime.now().isAfter(event.getRegistrationDeadline())) {
                return ResponseEntity.status(403)
                        .body(new ApiResponse<>(false, 
                                "La date limite d'inscription est dépassée", 
                                null));
            }

            // ✅ VÉRIFIER LE TYPE D'ÉVÉNEMENT
            if (event.getType() == EventType.CLUB_EVENT) {
                return ResponseEntity.status(403)
                        .body(new ApiResponse<>(false, 
                                "Les inscriptions individuelles ne sont pas autorisées pour les événements de club",
                                null));
            }

            EventRegistration reg = eventService.registerPlayerToEvent(dto, player);
            EventRegistrationDTO responseDto = EventRegistrationDTO.from(reg);

            return ResponseEntity.status(201)
                    .body(new ApiResponse<>(true, "Inscription réussie", responseDto));

        } catch (DuplicateResourceException e) {
            return ResponseEntity.status(409)
                    .body(new ApiResponse<>(false, e.getMessage(), null));

        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(404)
                    .body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    // ============================================================
    // 🟡 MES INSCRIPTIONS
    // ============================================================
  @Operation(summary = "Obtenir les inscriptions d'un utilisateur")
@GetMapping("/me")
public ResponseEntity<ApiResponse<List<EventRegistrationDTO>>> getMyRegistrations(Principal principal) {
    // ✅ Si pas connecté, retourne une liste vide
    if (principal == null) {
        return ResponseEntity.ok(new ApiResponse<>(
                true,
                "Aucune inscription (utilisateur non connecté)",
                List.of()  // Liste vide
        ));
    }
    
    User user = getCurrentUser(principal);
    List<EventRegistration> registrations = eventService.getRegistrationsForUser(user.getId());

    List<EventRegistrationDTO> dtos = registrations.stream()
            .map(EventRegistrationDTO::from)
            .collect(Collectors.toList());

    return ResponseEntity.ok(new ApiResponse<>(
            true,
            "Inscriptions de l'utilisateur",
            dtos));
}

    // ============================================================
    // 🔵 INSCRIPTION D'UNE ÉQUIPE (CLUB_ONLY)
    // ============================================================
  @PostMapping("/{eventId}/register-team")
@PreAuthorize("isAuthenticated()")
public ResponseEntity<ApiResponse<EventRegistrationDTO>> registerTeam(
        @PathVariable Long eventId,
        @RequestBody RegisterClubToEventDTO dto,
        Principal principal) {

    User currentUser = userService.getUserByUsername(principal.getName())
            .orElseThrow();

    // Charger l'événement
    Event event = eventService.getEventById(eventId);

    // ⛔ 1. INSCRIPTIONS FERMÉES
  if (event.isRegistrationClosed()) {
        return ResponseEntity.status(403)
                .body(new ApiResponse<>(
                        false,
                        "Les inscriptions sont clôturées pour cet événement",
                        null
                ));
    }

    // ⛔ 2. DATE LIMITE DÉPASSÉE
    if (event.getRegistrationDeadline() != null &&
        java.time.LocalDateTime.now().isAfter(event.getRegistrationDeadline())) {
        return ResponseEntity.status(403)
                .body(new ApiResponse<>(
                        false,
                        "La date limite d'inscription est dépassée",
                        null
                ));
    }

    // ⛔ 3. ÉVÉNEMENT COMPLET (CLUB_ONLY)
 

    // ✅ INSCRIPTION (SEULEMENT SI TOUT EST OK)
    EventRegistration reg = eventService.registerTeamToEvent(
            eventId,
            dto.getTeamId(),
            currentUser
    );

    return ResponseEntity.status(201)
            .body(new ApiResponse<>(
                    true,
                    "Équipe inscrite (en attente de validation)",
                    EventRegistrationDTO.from(reg)
            ));
}


    // ============================================================
    // 🔵 VALIDATION / REJET D'UNE INSCRIPTION D'ÉQUIPE (CLUB_EVENT)
    // ============================================================

    @Operation(summary = "Accepter une inscription d'équipe à un événement")
    @PutMapping("/{eventId}/registrations/{id}/accept")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<EventRegistrationDTO>> acceptTeam(
            @PathVariable Long eventId,
            @PathVariable Long id,
            Principal principal) {

        User currentUser = getCurrentUser(principal);

        EventRegistration reg =
                eventService.acceptTeamRegistration(eventId, id, currentUser);

        return ResponseEntity.ok(
                new ApiResponse<>(true, "Inscription acceptée", EventRegistrationDTO.from(reg))
        );
    }

    @Operation(summary = "Rejeter une inscription d'équipe à un événement")
    @PutMapping("/{eventId}/registrations/{id}/reject")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<EventRegistrationDTO>> rejectTeam(
            @PathVariable Long eventId,
            @PathVariable Long id,
            Principal principal) {

        User currentUser = getCurrentUser(principal);

        EventRegistration reg =
                eventService.rejectTeamRegistration(eventId, id, currentUser);

        return ResponseEntity.ok(
                new ApiResponse<>(true, "Inscription rejetée", EventRegistrationDTO.from(reg))
        );
    }


    // ============================================================
// 🔵 RÉCUPÉRER LES INSCRIPTIONS D'UN CLUB
// ============================================================

@Operation(summary = "Obtenir toutes les inscriptions d'un club pour un événement")
@GetMapping("/{eventId}/registrations/club/{clubId}")
@PreAuthorize("isAuthenticated()")
public ResponseEntity<ApiResponse<List<EventRegistrationDTO>>> getClubRegistrations(
        @PathVariable Long eventId,
        @PathVariable Long clubId,
        Principal principal
) {
    User currentUser = getCurrentUser(principal);

    // ✅ Sécurité MVP : seul le club lui-même peut lire ses inscriptions
    Long userClubId = userService.getPrimaryClubId(currentUser.getId());
    if (userClubId == null || !userClubId.equals(clubId)) {
        return ResponseEntity.status(403)
                .body(new ApiResponse<>(false, "Accès refusé (club)", null));
    }

    List<EventRegistration> registrations =
            eventService.getRegistrationsByEventAndClub(eventId, clubId);

    List<EventRegistrationDTO> dtos = registrations.stream()
            .map(EventRegistrationDTO::from)
            .collect(Collectors.toList());

    return ResponseEntity.ok(
            new ApiResponse<>(true, "Inscriptions du club", dtos));
}
// ============================================================
    // 💳 MARQUER UNE INSCRIPTION COMME PAYÉE (SIMULATION)
    // ============================================================

   @Operation(summary = "Marquer une inscription comme payée")
@PostMapping("/{eventId}/mark-as-paid")
@PreAuthorize("isAuthenticated()")
public ResponseEntity<ApiResponse<EventRegistrationDTO>> markAsPaid(
        @PathVariable Long eventId,
        Principal principal) {

    try {
        User currentUser = getCurrentUser(principal);

        List<EventRegistration> registrations = eventService.getRegistrationsForUser(currentUser.getId());

        List<EventRegistration> eventRegs = registrations.stream()
                .filter(r -> r.getEvent() != null && r.getEvent().getId().equals(eventId))
                .toList();

        if (eventRegs.isEmpty()) {
            throw new ResourceNotFoundException("Aucune inscription trouvée pour cet événement");
        }

        // 1) Priorité à ACCEPTED (et la plus récente)
        EventRegistration registration = eventRegs.stream()
           .filter(r -> r.getStatus() != null && r.getStatus() == RegistrationStatus.ACCEPTED)


                .max(java.util.Comparator.comparing(EventRegistration::getId))
                .orElseGet(() ->
                        // 2) Sinon la plus récente tout court (pour renvoyer un 403 propre)
                        eventRegs.stream()
                                .max(java.util.Comparator.comparing(EventRegistration::getId))
                                .orElseThrow(() -> new ResourceNotFoundException("Aucune inscription trouvée pour cet événement"))
                );

       if (registration.getStatus() != RegistrationStatus.ACCEPTED){
            return ResponseEntity.status(403)
                    .body(new ApiResponse<>(false, "Votre inscription doit d'abord être acceptée", null));
        }

        registration.setPaymentStatus("PAID");
        eventService.saveRegistration(registration);

        return ResponseEntity.ok(
                new ApiResponse<>(true, "Paiement enregistré avec succès", EventRegistrationDTO.from(registration))
        );

    } catch (ResourceNotFoundException e) {
        return ResponseEntity.status(404)
                .body(new ApiResponse<>(false, e.getMessage(), null));
    } catch (Exception e) {
        return ResponseEntity.status(500)
                .body(new ApiResponse<>(false, "Erreur lors de l'enregistrement du paiement", null));
    }
}

/**
 * 💳 PAIEMENT FRAIS DE PLATEFORME (5€ PAR ÉQUIPE)
 * 
 * Modèle économique FootballFamily :
 * - Chaque équipe ACCEPTED paie 5€ à FootballFamily (frais de plateforme)
 * - Les frais du tournoi (organisateur) se règlent hors plateforme
 * 
 * Workflow :
 * 1. Club inscrit équipe → PENDING
 * 2. Organisateur accepte → ACCEPTED
 * 3. Club paie 5€ par équipe → PAID
 * 4. Équipe peut jouer
 */
@Operation(summary = "Payer les frais de plateforme (5€ par équipe) - Simulation")
@PostMapping("/{eventId}/registrations/{registrationId}/pay")
@PreAuthorize("isAuthenticated()")
public ResponseEntity<ApiResponse<EventRegistrationDTO>> payRegistration(
        @PathVariable Long eventId,
        @PathVariable Long registrationId,
        Principal principal
) {
    User currentUser = getCurrentUser(principal);

    EventRegistration reg = eventService.getRegistrationById(registrationId);
    
    if (reg.getEvent() == null || !reg.getEvent().getId().equals(eventId)) {
        return ResponseEntity.status(404)
                .body(new ApiResponse<>(false, "Inscription introuvable pour cet événement", null));
    }

    if (reg.getStatus() == null || reg.getStatus() != RegistrationStatus.ACCEPTED) {
        return ResponseEntity.status(403)
                .body(new ApiResponse<>(false, "L'inscription doit être ACCEPTED", null));
    }

    // Sécurité : vérifier que le payeur est du même club que l'équipe
    if (reg.getTeam() == null || reg.getTeam().getClub() == null) {
        return ResponseEntity.status(403)
                .body(new ApiResponse<>(false, "Paiement réservé aux inscriptions d'équipe", null));
    }
    
    Long userClubId = userService.getPrimaryClubId(currentUser.getId());
    if (userClubId == null || !reg.getTeam().getClub().getId().equals(userClubId)) {
        return ResponseEntity.status(403)
                .body(new ApiResponse<>(false, "Vous ne pouvez pas payer pour ce club", null));
    }

    if ("PAID".equalsIgnoreCase(reg.getPaymentStatus())) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Déjà payé", EventRegistrationDTO.from(reg)));
    }

    // 💳 SIMULATION : Marquer comme payé (5€ à FootballFamily)
  
    reg.setPaymentStatus("PAID");
    eventService.saveRegistration(reg);

    return ResponseEntity.ok(
        new ApiResponse<>(true, "Frais de plateforme payés (5€)", EventRegistrationDTO.from(reg))
    );
}


}