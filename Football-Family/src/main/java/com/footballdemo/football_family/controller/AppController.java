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
    
    // ... (vos autres méthodes de navigation existantes : /search, /upload, etc.) ...
    
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

    // 🎯 LOGIQUE DE LA PAGE DE PROFIL MISE À JOUR : Gère l'utilisateur COURANT et CIBLE
   // Dans AppController.java

@GetMapping({"/profile", "/profile/{username}"})
public String getProfilePage(Model model,
                             @PathVariable(required = false) String username,
                             @RequestParam(defaultValue = "0") int page, // 👈 NOUVEAU : Capte la page demandée
                             Principal principal) {
    
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
        // Utilisation de .orElseThrow() pour gérer l'Optional<User> retourné par UserService
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

    // 4. Calculer les booléens de contexte et les compteurs
    boolean isCurrentUser = (currentUser != null && currentUser.equals(targetUser));
    // NOTE: Ajustez la méthode isFollowing si elle ne prend pas l'objet User mais l'Username
    boolean isFollowing = isCurrentUser ? false : userService.isFollowing(currentUser, targetUser); 
    
    int followersCount = userService.getFollowersCount(targetUser);
    int followingCount = userService.getFollowingCount(targetUser);

    // 5. Ajouter les données au modèle Thymeleaf
    model.addAttribute("targetUser", targetUser);
    model.addAttribute("isCurrentUser", isCurrentUser);
    model.addAttribute("isFollowing", isFollowing);
    
    // Données de pagination
    model.addAttribute("userVideos", videosPage.getContent());     // Les 15 vidéos actuelles
    model.addAttribute("videosCount", videosPage.getTotalElements()); // Total général des vidéos (utile pour le titre)
    model.addAttribute("totalPages", videosPage.getTotalPages());   // Nombre total de pages
    model.addAttribute("currentPage", videosPage.getNumber());      // Page actuelle (base 0)

    model.addAttribute("followersCount", followersCount);
    model.addAttribute("followingCount", followingCount);
    
    return "profile"; 
}
}