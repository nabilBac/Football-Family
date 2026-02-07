package com.footballdemo.football_family.controller.api.events;

import com.footballdemo.football_family.dto.ApiResponse;
import com.footballdemo.football_family.model.Event;
import com.footballdemo.football_family.model.User;
import com.footballdemo.football_family.service.EventService;
import com.footballdemo.football_family.service.EventAccessService;
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

    private final EventService eventService;
    private final UserService userService;
    private final EventAccessService eventAccessService;

    /**
     * 🔒 Clôturer les inscriptions d'un événement
     */
    @PostMapping("/{eventId}/close-registrations")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> closeRegistrations(
            @PathVariable Long eventId,
            Principal principal
    ) {
        User currentUser = userService.getUserByUsername(principal.getName())
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        Event event = eventService.getEventById(eventId);

        // 🔒 Vérification des droits (centralisée)
        eventAccessService.assertCanManage(event, currentUser);

        event.setRegistrationClosed(true);
        eventService.save(event);

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
        User currentUser = userService.getUserByUsername(principal.getName())
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        Event event = eventService.getEventById(eventId);

        // 🔒 Vérification des droits (centralisée)
        eventAccessService.assertCanManage(event, currentUser);

        event.setRegistrationClosed(false);
        eventService.save(event);

        return ResponseEntity.ok(
                new ApiResponse<>(true, "Inscriptions rouvertes avec succès", null)
        );
    }
}