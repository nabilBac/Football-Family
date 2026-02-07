package com.footballdemo.football_family.controller.api.social;

import com.footballdemo.football_family.dto.UserDTO;
import com.footballdemo.football_family.dto.VideoDto;
import com.footballdemo.football_family.model.User;
import com.footballdemo.football_family.service.UserService;
import com.footballdemo.football_family.service.UserMapper;
import com.footballdemo.football_family.service.VideoService;
import lombok.RequiredArgsConstructor;


import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.HashMap;

import java.util.Map;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class ProfileRestController {

    private final UserService userService;
    private final UserMapper userMapper;
    private final VideoService videoService;

    /**
     * ✅ PROFIL SANS CACHE EN DEV
     */
    @GetMapping("/{username}")
    public ResponseEntity<?> getProfile(
            @PathVariable String username,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Principal principal) {

        // ✅ VALIDATION: Limite pagination
        if (page > 50) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Page max = 50"));
        }

        if (size > 50) {
            size = 50;
        }

        // 🔹 Utilisateur demandé
        User target = userService.getUserByUsername(username)
            .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        // 🔹 Utilisateur connecté
        String currentUsername = principal != null ? principal.getName() : null;
        User currentUser = currentUsername != null 
            ? userService.getUserByUsername(currentUsername).orElse(null)
            : null;

      boolean isCurrentUser = currentUser != null && 
        currentUser.getId().equals(target.getId());

        // ✅ BATCH: Followers + Following en UNE requête
        Map<String, Long> stats = userService.getUserStats(target.getId());
        long followersCount = stats.getOrDefault("followersCount", 0L);
        long followingCount = stats.getOrDefault("followingCount", 0L);

        // ✅ isFollowing
        boolean isFollowing = false;
        if (currentUser != null && !isCurrentUser) {
            isFollowing = userService.isFollowing(currentUser.getId(), target.getId());
        }

        // 🔹 Profil → DTO
        UserDTO userDto = userMapper.toDTO(target);

        // ✅ PAGINATION: Vidéos limitées
        var pageable = PageRequest.of(page, size, Sort.by("dateUpload").descending());
        Page<VideoDto> videosPage = videoService.getVideosForUserPaginated(username, pageable);

        Map<String, Object> response = new HashMap<>();
        response.put("user", userDto);
        response.put("videos", videosPage.getContent());
        response.put("totalVideos", videosPage.getTotalElements());
        response.put("currentPage", page);
        response.put("totalPages", videosPage.getTotalPages());
        response.put("followersCount", followersCount);
        response.put("followingCount", followingCount);
        response.put("isCurrentUser", isCurrentUser);
        response.put("isFollowing", isFollowing);

        return ResponseEntity.ok(response);
    }

    /**
     * ✅ FOLLOWERS SANS CACHE EN DEV
     */
    @GetMapping("/{username}/followers")
    public ResponseEntity<?> getFollowers(
            @PathVariable String username,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        if (page > 50 || size > 50) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Limite: page=50, size=50"));
        }

        User user = userService.getUserByUsername(username)
            .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        var pageable = PageRequest.of(page, size);
        Page<UserDTO> followers = userService.getFollowersPaginated(user.getId(), pageable);

        return ResponseEntity.ok(Map.of(
            "followers", followers.getContent(),
            "totalFollowers", followers.getTotalElements(),
            "currentPage", page,
            "totalPages", followers.getTotalPages()
        ));
    }

    /**
     * ✅ FOLLOWING SANS CACHE EN DEV
     */
    @GetMapping("/{username}/following")
    public ResponseEntity<?> getFollowing(
            @PathVariable String username,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        if (page > 50 || size > 50) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Limite: page=50, size=50"));
        }

        User user = userService.getUserByUsername(username)
            .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        var pageable = PageRequest.of(page, size);
        Page<UserDTO> following = userService.getFollowingPaginated(user.getId(), pageable);

        return ResponseEntity.ok(Map.of(
            "following", following.getContent(),
            "totalFollowing", following.getTotalElements(),
            "currentPage", page,
            "totalPages", following.getTotalPages()
        ));
    }
}