package com.footballdemo.football_family.controller;



import com.footballdemo.football_family.model.User;
import com.footballdemo.football_family.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import java.util.Map;
import java.util.HashMap;

@RestController // 🎯 Ceci est une API REST, pas un contrôleur Thymeleaf standard
@RequestMapping("/api/follow")
public class FollowController {

    private final UserService userService;

    public FollowController(UserService userService) {
        this.userService = userService;
    }

    /**
     * Endpoint pour S'ABONNER ou SE DÉSABONNER d'un utilisateur cible.
     * @param targetId L'ID de l'utilisateur cible à suivre/ne plus suivre.
     */
    @PostMapping("/{targetId}")
    // ✅ Utilisation de Spring Security pour garantir l'authentification (401 si non connecté)
    @PreAuthorize("isAuthenticated()") 
    public ResponseEntity<Map<String, Object>> toggleFollow(@PathVariable Long targetId) {
        
        // 1. L'utilisateur est garanti d'être connecté grâce à @PreAuthorize.
        // On peut donc récupérer l'utilisateur connecté sans vérifier le 'null' manuellement.
        User follower = userService.getCurrentUser();
        
        // 2. Récupération de l'utilisateur cible
        // Vous devez maintenant gérer le cas où getCurrentUser() retourne null, même si 
        // @PreAuthorize devrait empêcher cela. Si getCurrentUser ne retourne pas d'Optional :
        if (follower == null) {
             // Cas de fallback peu probable si @PreAuthorize est configuré
             return ResponseEntity.status(401).build(); 
        }
        
        User targetUser = userService.getUserById(targetId)
                                     // L'utilisateur non trouvé se gère mieux avec une exception, 
                                     // qui sera transformée en 404/500 par Spring.
                                     .orElseThrow(() -> new RuntimeException("Utilisateur cible non trouvé avec l'ID: " + targetId));

        // ❌ Le bloc de vérification manuelle `if (targetUser == null)` est supprimé au profit de orElseThrow.

        try {
            // 3. Exécution de la logique métier
            boolean isFollowing = userService.toggleFollow(follower, targetUser);
            
            // 4. Récupération des nouveaux comptes
            int newFollowersCount = userService.getFollowersCount(targetUser);
            
            // 5. Préparation de la réponse
            Map<String, Object> response = new HashMap<>();
            response.put("isFollowing", isFollowing);
            response.put("followersCount", newFollowersCount);
            
            return ResponseEntity.ok(response);
            
        } catch (IllegalArgumentException e) {
            // Utilisateur essaie de se suivre lui-même
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}