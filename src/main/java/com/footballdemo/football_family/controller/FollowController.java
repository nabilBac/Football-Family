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
@PreAuthorize("isAuthenticated()")
public ResponseEntity<Map<String, Object>> toggleFollow(@PathVariable Long targetId) {
    User follower = userService.getCurrentUser();
    if (follower.getId().equals(targetId)) {
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("error", "Vous ne pouvez pas vous suivre vous-même.");
        return ResponseEntity.badRequest().body(errorResponse);
    }

    User targetUser = userService.getUserById(targetId)
                                 .orElseThrow(() -> new UserNotFoundException(targetId));

    boolean isFollowing = userService.toggleFollow(follower, targetUser);
    int newFollowersCount = userService.getFollowersCount(targetUser);

    Map<String, Object> response = new HashMap<>();
    response.put("isFollowing", isFollowing);
    response.put("followersCount", newFollowersCount);

    return ResponseEntity.ok(response);
}

}