package com.footballdemo.football_family.controller.api.live;

import com.footballdemo.football_family.dto.ApiResponse;
import com.footballdemo.football_family.dto.LiveSessionDTO; // ✅ IMPORT MANQUANT !
import com.footballdemo.football_family.model.LiveSession;
import com.footballdemo.football_family.model.User;
import com.footballdemo.football_family.service.LiveSessionService;
import com.footballdemo.football_family.service.UserService;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/live")
public class LiveSessionApiController {

    private final LiveSessionService liveService;
    private final UserService userService;

    public LiveSessionApiController(LiveSessionService liveService, UserService userService) {
        this.liveService = liveService;
        this.userService = userService;
    }

    // ------------------------------------------------------
    // 1️⃣ Obtenir tous les lives actifs
    // ------------------------------------------------------
   @GetMapping("/all")
@PreAuthorize("permitAll()")
public ApiResponse<List<LiveSessionDTO>> getAllActiveLives() {

        List<LiveSession> lives = liveService.getLivesActifs();

        List<LiveSessionDTO> dto = lives.stream()
                .map(LiveSessionDTO::new)
                .toList();

        return new ApiResponse<>(true, "Lives actifs récupérés", dto);
    }

    // ------------------------------------------------------
    // 2️⃣ Live actif de l’utilisateur connecté
    // ------------------------------------------------------
    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<LiveSessionDTO> getMyLive(Principal principal) {

        User currentUser = userService.getUserByUsername(principal.getName())
                .orElse(null);

        if (currentUser == null)
            return new ApiResponse<>(false, "Utilisateur non trouvé", null);

        List<LiveSession> lives = liveService.findActiveLiveByUser(currentUser);

        if (lives.isEmpty())
            return new ApiResponse<>(true, "Aucun live actif", null);

        return new ApiResponse<>(true, "Live actif trouvé", new LiveSessionDTO(lives.get(0)));
    }

    // ------------------------------------------------------
    // 3️⃣ Démarrer un live
    // ------------------------------------------------------
    @PostMapping("/start")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<LiveSessionDTO> startLive(@RequestBody(required = false) LiveRequest req,
            Principal principal) {

        User currentUser = userService.getCurrentUser();

        if (currentUser == null)
            return new ApiResponse<>(false, "Non authentifié", null);

        List<LiveSession> existing = liveService.findActiveLiveByUser(currentUser);
        if (!existing.isEmpty()) {
            return new ApiResponse<>(true, "Live déjà actif", new LiveSessionDTO(existing.get(0)));
        }

        String title = (req != null && req.getTitle() != null)
                ? req.getTitle()
                : "Live de " + currentUser.getUsername();

        String description = (req != null && req.getDescription() != null)
                ? req.getDescription()
                : "Diffusion en direct";

        LiveSession live = liveService.startLive(
                title,
                description,
                currentUser.getUsername());

        return new ApiResponse<>(true, "Live démarré", new LiveSessionDTO(live));
    }

    // ------------------------------------------------------
    // 4️⃣ Arrêter un live
    // ------------------------------------------------------
    @PostMapping("/end/{id}")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Void> endLive(@PathVariable Long id, Principal principal) {

        User currentUser = userService.getCurrentUser();

        if (currentUser == null)
            return new ApiResponse<>(false, "Non authentifié", null);

        try {
            LiveSession live = liveService.getLiveById(id);
            if (!live.getStreamer().equalsIgnoreCase(currentUser.getUsername())) {
                return new ApiResponse<>(false, "Vous n’êtes pas le propriétaire de ce live", null);
            }

            liveService.endLive(id);
            return new ApiResponse<>(true, "Live terminé", null);

        } catch (Exception e) {
            return new ApiResponse<>(false, "Erreur : " + e.getMessage(), null);
        }
    }

    // ------------------------------------------------------
    // 5️⃣ Aller en live
    // ------------------------------------------------------
    @PostMapping("/go-live")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<LiveSessionDTO> goLive(Principal principal) {

        User currentUser = userService.getCurrentUser();

        if (currentUser == null)
            return new ApiResponse<>(false, "Non authentifié", null);

        List<LiveSession> active = liveService.findActiveLiveByUser(currentUser);
        if (!active.isEmpty()) {
            return new ApiResponse<>(true, "Live existant", new LiveSessionDTO(active.get(0)));
        }

        LiveSession live = liveService.startLive(
                "Live de " + currentUser.getUsername(),
                "Diffusion en direct",
                currentUser.getUsername());

        return new ApiResponse<>(true, "Live lancé avec succès", new LiveSessionDTO(live));
    }

    // ------------------------------------------------------
    // 6️⃣ DTO interne pour requêtes
    // ------------------------------------------------------
    public static class LiveRequest {
        private String title;
        private String description;

        // Getters/setters
        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
    }
}
