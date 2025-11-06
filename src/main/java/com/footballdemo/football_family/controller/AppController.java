package com.footballdemo.football_family.controller;

import com.footballdemo.football_family.model.User;
import com.footballdemo.football_family.dto.VideoDto;
import com.footballdemo.football_family.service.UserService;
import com.footballdemo.football_family.service.VideoService;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable; // 🎯 IMPORT NÉCESSAIRE
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.RequestParam;
import java.security.Principal;
import org.springframework.data.domain.Sort;
import org.springframework.data.domain.Page;

@Controller
public class AppController {

    private final UserService userService;
    private final VideoService videoService;

    public AppController(UserService userService, VideoService videoService) {
        this.userService = userService;
        this.videoService = videoService;
    }

    // ... (vos autres méthodes de navigation existantes : /search, /upload, etc.)
    // ...

    @GetMapping("/search")
    public String getSearchPage() {
        return "search";
    }

    @GetMapping("/upload")
    @PreAuthorize("isAuthenticated()")
    public String getUploadPage() {
        return "upload";
    }

    @GetMapping("/notifications")
    @PreAuthorize("isAuthenticated()")
    public String getNotificationsPage() {
        return "notifications";
    }

    // 🎯 LOGIQUE DE LA PAGE DE PROFIL MISE À JOUR : Gère l'utilisateur COURANT et
    // CIBLE
    // Dans AppController.java

    @GetMapping({ "/profile", "/profile/{username}" })
    public String getProfilePage(Model model,
            @PathVariable(required = false) String username,
            @RequestParam(defaultValue = "0") int page, // 👈 NOUVEAU : Capte la page demandée
            Principal principal) {

        System.out.println(">>> getProfilePage appelé pour /profile ou /profile/{username}");

        // Utilisateur connecté (le VISUALISEUR). Utilisé pour le calcul de isFollowing.
        // NOTE: Si getCurrentUser retourne un Optional, il faudra ajouter .orElse(null)
        User currentUser = userService.getCurrentUser();

        String viewerUsername = (principal != null) ? principal.getName() : "anonymousUser";

        // 1. Déterminer l'utilisateur cible (Target User)
        User targetUser;

        if (username == null || username.isEmpty()) {
            // Cas 1 : URL est /profile -> C'est le profil de l'utilisateur COURANT
            targetUser = currentUser;

            if (targetUser == null) {
                return "redirect:/login";
            }
        } else {
            // Cas 2 : URL est /profile/{username} -> C'est un profil public
            // Utilisation de .orElseThrow() pour gérer l'Optional<User> retourné par
            // UserService
            // Assurez-vous que getUserByUsername retourne Optional<User>
            targetUser = userService.getUserByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User not found: " + username));
        }

        // 2. Création de l'objet Pageable (CRITIQUE POUR LA SCALABILITÉ)
        final int pageSize = 15; // Nombre de vidéos par page sur le profil
        var pageable = PageRequest.of(page, pageSize, Sort.by("dateUpload").descending());

        // 3. Récupération des données PAGINÉES
        // La méthode retourne Page<VideoDto>
        Page<VideoDto> videosPage = videoService.findVideosByUser(targetUser, viewerUsername, pageable);

        if (videosPage == null) {
            videosPage = Page.empty(); // Garantit que l'objet Page est non-null (et contient une liste vide)
        }

        System.out.println("==== Miniatures des vidéos de " + targetUser.getUsername() + " ====");
        for (VideoDto video : videosPage.getContent()) {
            String thumb = video.getThumbnailUrl();
            if (thumb == null || !(thumb.endsWith(".jpg") || thumb.endsWith(".png"))) {
                System.out.println("⚠️ Vidéo \"" + video.getTitle() + "\" n'a pas de miniature valide : " + thumb);
            } else {
                System.out.println("✅ Vidéo \"" + video.getTitle() + "\" miniature OK : " + thumb);
            }
        }

        System.out.println("✅ TARGET USER ID: " + targetUser.getId() + ", Username: " + targetUser.getUsername());
        // 4. Calculer les booléens de contexte et les compteurs
        boolean isCurrentUser = (currentUser != null && currentUser.equals(targetUser));
        // NOTE: Ajustez la méthode isFollowing si elle ne prend pas l'objet User mais
        // l'Username
        boolean isFollowing = isCurrentUser ? false : userService.isFollowing(currentUser, targetUser);

        int followersCount = userService.getFollowersCount(targetUser);
        int followingCount = userService.getFollowingCount(targetUser);
        // 5. Ajouter les données au modèle Thymeleaf
        model.addAttribute("targetUser", targetUser);
        model.addAttribute("currentUser", currentUser);
        model.addAttribute("isCurrentUser", isCurrentUser);
        model.addAttribute("isFollowing", isFollowing);

        // Données de pagination sécurisées
        model.addAttribute("userVideos", videosPage.getContent()); // LA LISTE (garantie non-null)
        model.addAttribute("videosCount", videosPage.getTotalElements());
        model.addAttribute("totalPages", videosPage.getTotalPages());
        model.addAttribute("currentPage", videosPage.getNumber());

        // Supprimez cette ligne : model.addAttribute("videosList",
        // videosPage.getContent());

        model.addAttribute("followersCount", followersCount);
        model.addAttribute("followingCount", followingCount);

        return "profile";
    }

}