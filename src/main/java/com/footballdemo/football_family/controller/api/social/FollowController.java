package com.footballdemo.football_family.controller.api.social;

import com.footballdemo.football_family.model.User;
import com.footballdemo.football_family.service.UserService;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import java.util.Map;

import com.footballdemo.football_family.dto.ApiResponse;
import com.footballdemo.football_family.exception.ResourceNotFoundException;

@RestController // 🎯 Ceci est une API REST, pas un contrôleur Thymeleaf standard
@RequestMapping("/api/follow")
public class FollowController {

    private final UserService userService;

    public FollowController(UserService userService) {
        this.userService = userService;
    }

    /**
     * Endpoint pour S'ABONNER ou SE DÉSABONNER d'un utilisateur cible.
     * 
     * @param targetId L'ID de l'utilisateur cible à suivre/ne plus suivre.
     */
    @PostMapping("/{targetId}")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Map<String, Object>> toggleFollow(@PathVariable Long targetId) {

        User follower = userService.getCurrentUser();

        if (follower.getId().equals(targetId)) {
            throw new IllegalArgumentException("Vous ne pouvez pas vous suivre vous-même.");
        }

        User target = userService.getUserById(targetId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", targetId));

        boolean following = userService.toggleFollow(follower, target);
        int count = userService.getFollowersCount(target);

        Map<String, Object> data = Map.of(
                "isFollowing", following,
                "followersCount", count);

        return new ApiResponse<>(true, "Statut de follow changé", data);
    }

    @GetMapping("/check/{targetId}")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Map<String, Object>> checkFollow(@PathVariable Long targetId) {

        User follower = userService.getCurrentUser();

        User target = userService.getUserById(targetId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", targetId));

        boolean isFollowing = userService.isFollowing(follower, target);
        int count = userService.getFollowersCount(target);

        Map<String, Object> data = Map.of(
                "isFollowing", isFollowing,
                "followersCount", count);

        return new ApiResponse<>(true, "Statut récupéré", data);
    }

}