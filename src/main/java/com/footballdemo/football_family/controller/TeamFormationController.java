package com.footballdemo.football_family.controller;

import com.footballdemo.football_family.dto.ApiResponse;
import com.footballdemo.football_family.dto.FormTeamsDTO;
import com.footballdemo.football_family.dto.TeamFormationResultDTO;
import com.footballdemo.football_family.exception.ForbiddenException;
import com.footballdemo.football_family.model.Event;
import com.footballdemo.football_family.model.User;
import com.footballdemo.football_family.service.EventService;
import com.footballdemo.football_family.service.TeamFormationService;
import com.footballdemo.football_family.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

/**
 * Controller REST pour la formation des équipes (UTF).
 * Permet de former les équipes automatiquement ou manuellement après les
 * inscriptions.
 */
@Slf4j
@RestController
@RequestMapping("/api/team-formation")
@RequiredArgsConstructor
public class TeamFormationController {

    private final TeamFormationService teamFormationService;
    private final EventService eventService;
    private final UserService userService;

    /**
     * Forme les équipes pour un événement UTF
     * 
     * @param dto       Données de formation (mode AUTO ou MANUAL)
     * @param principal Utilisateur connecté (doit être organisateur)
     * @return Résultat de la formation avec les équipes créées
     */
    @PostMapping("/form-teams")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<TeamFormationResultDTO>> formTeams(
            @Valid @RequestBody FormTeamsDTO dto,
            Principal principal) {

        log.info("🏆 Formation d'équipes pour événement {} par {} - Mode: {}",
                dto.getEventId(), principal.getName(), dto.getMode());

        try {
            // 1. Vérifier que l'utilisateur est l'organisateur de l'événement
            Event event = eventService.getEventById(dto.getEventId());
            User currentUser = userService.getUserByUsername(principal.getName())
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

            if (!event.isOrganizer(currentUser) && !currentUser.isSuperAdmin()) {
                throw new ForbiddenException("Seul l'organisateur peut former les équipes");
            }

            // 2. Valider le DTO selon le mode
            if (!dto.isValid()) {
                return ResponseEntity.badRequest()
                        .body(new ApiResponse<>(false,
                                "Données invalides pour le mode " + dto.getMode(),
                                null));
            }

            // 3. Former les équipes
            TeamFormationResultDTO result = teamFormationService.formTeams(dto);

            log.info("✅ Formation réussie : {} équipes formées pour {} joueurs",
                    result.getTotalTeams(), result.getTotalPlayers());

            return ResponseEntity.status(201)
                    .body(new ApiResponse<>(true, "Équipes formées avec succès", result));

        } catch (ForbiddenException e) {
            log.warn("⛔ Accès refusé : {}", e.getMessage());
            return ResponseEntity.status(403)
                    .body(new ApiResponse<>(false, e.getMessage(), null));

        } catch (IllegalArgumentException | IllegalStateException e) {
            log.warn("⚠️ Erreur de validation : {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, e.getMessage(), null));

        } catch (Exception e) {
            log.error("❌ Erreur lors de la formation des équipes", e);
            return ResponseEntity.status(500)
                    .body(new ApiResponse<>(false,
                            "Erreur lors de la formation : " + e.getMessage(),
                            null));
        }
    }

    /**
     * Vérifie si les équipes peuvent être formées pour un événement
     * 
     * @param eventId   ID de l'événement
     * @param principal Utilisateur connecté
     * @return Informations sur la possibilité de former les équipes
     */
    @GetMapping("/can-form/{eventId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<TeamFormationStatusDTO>> canFormTeams(
            @PathVariable Long eventId,
            Principal principal) {

        log.debug("Vérification possibilité formation équipes - Événement {}", eventId);

        try {
            Event event = eventService.getEventById(eventId);
            User currentUser = userService.getUserByUsername(principal.getName())
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

            // Vérifier les conditions
            boolean isOrganizer = event.isOrganizer(currentUser) || currentUser.isSuperAdmin();
            boolean isIndividual = event.isIndividualRegistration();
            boolean alreadyFormed = Boolean.TRUE.equals(event.getTeamsFormed());
            int confirmedCount = event.getConfirmedParticipantsCount();
            int minPlayers = event.getNumberOfTeams() != null && event.getTeamSize() != null
                    ? event.getNumberOfTeams() * event.getTeamSize()
                    : 10;

            boolean canForm = isOrganizer && isIndividual && !alreadyFormed && confirmedCount >= minPlayers;

            TeamFormationStatusDTO status = new TeamFormationStatusDTO(
                    canForm,
                    isOrganizer,
                    isIndividual,
                    alreadyFormed,
                    confirmedCount,
                    minPlayers,
                    canForm ? null
                            : getBlockingReason(isOrganizer, isIndividual, alreadyFormed, confirmedCount, minPlayers));

            return ResponseEntity.ok(new ApiResponse<>(true, "Statut récupéré", status));

        } catch (Exception e) {
            log.error("Erreur lors de la vérification", e);
            return ResponseEntity.status(500)
                    .body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    /**
     * Retourne la raison qui bloque la formation
     */
    private String getBlockingReason(boolean isOrganizer, boolean isIndividual,
            boolean alreadyFormed, int confirmedCount, int minPlayers) {
        if (!isOrganizer)
            return "Vous devez être l'organisateur";
        if (!isIndividual)
            return "L'événement n'est pas en mode inscription individuelle";
        if (alreadyFormed)
            return "Les équipes ont déjà été formées";
        if (confirmedCount < minPlayers)
            return "Pas assez de joueurs inscrits (" + confirmedCount + "/" + minPlayers + ")";
        return "Conditions non remplies";
    }

    /**
     * DTO pour le statut de formation
     */
    public record TeamFormationStatusDTO(
            boolean canForm,
            boolean isOrganizer,
            boolean isIndividualMode,
            boolean alreadyFormed,
            int confirmedPlayers,
            int minimumPlayers,
            String blockingReason) {
    }
}
