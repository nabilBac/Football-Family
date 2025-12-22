package com.footballdemo.football_family.controller.api.events;

import com.footballdemo.football_family.dto.ApiResponse;
import com.footballdemo.football_family.model.Event;
import com.footballdemo.football_family.repository.EventRepository;
import com.footballdemo.football_family.model.User;
import com.footballdemo.football_family.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/events/manage")
@RequiredArgsConstructor
public class EventRegistrationManagementController {

    private final EventRepository eventRepository;
    private final UserService userService;

    /**
     * 🔒 Clôturer les inscriptions d'un événement
     */
    @PostMapping("/{eventId}/close-registrations")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> closeRegistrations(
            @PathVariable Long eventId,
            Principal principal
    ) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Événement introuvable"));

        User currentUser = userService.getUserByUsername(principal.getName())
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        // Vérifier que l'utilisateur est l'organisateur
        if (!event.getOrganizer().getId().equals(currentUser.getId())) {
            return ResponseEntity.status(403)
                    .body(new ApiResponse<>(false, "Non autorisé", null));
        }

        event.setRegistrationClosed(true);
        eventRepository.save(event);

        return ResponseEntity.ok(
                new ApiResponse<>(true, "Inscriptions clôturées avec succès", null)
        );
    }

    /**
     * 🔓 Rouvrir les inscriptions d'un événement
     */
    @PostMapping("/{eventId}/reopen-registrations")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> reopenRegistrations(
            @PathVariable Long eventId,
            Principal principal
    ) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Événement introuvable"));

        User currentUser = userService.getUserByUsername(principal.getName())
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        // Vérifier que l'utilisateur est l'organisateur
        if (!event.getOrganizer().getId().equals(currentUser.getId())) {
            return ResponseEntity.status(403)
                    .body(new ApiResponse<>(false, "Non autorisé", null));
        }

        event.setRegistrationClosed(false);
        eventRepository.save(event);

        return ResponseEntity.ok(
                new ApiResponse<>(true, "Inscriptions rouvertes avec succès", null)
        );
    }
}