package com.footballdemo.football_family.controller.api.social;

import com.footballdemo.football_family.dto.UserDTO;
import com.footballdemo.football_family.dto.VideoDto;
import com.footballdemo.football_family.model.User;
import com.footballdemo.football_family.service.UserService;
import com.footballdemo.football_family.service.UserMapper;
import com.footballdemo.football_family.service.VideoService;
import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class ProfileRestController {

    private final UserService userService;
    private final UserMapper userMapper;
    private final VideoService videoService;

    @GetMapping("/{username}")
    public ResponseEntity<?> getProfile(
            @PathVariable String username,
            Principal principal) {

        // 🔹 Utilisateur demandé
     User target = userService.getUserByUsername(username)
        .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));


        // 🔹 Utilisateur connecté
        String currentUsername = principal != null ? principal.getName() : null;

        boolean isCurrentUser = currentUsername != null &&
                currentUsername.equalsIgnoreCase(username);

        // 🔥 Followers / Following (réel)
        long followersCount = userService.getFollowersCount(target);
        long followingCount = userService.getFollowingCount(target);

        // 🔹 Profil → DTO
        UserDTO userDto = userMapper.toDTO(target);

        // 🔹 Vidéos
        List<VideoDto> videos = videoService.getVideosForUser(username);

        Map<String, Object> response = new HashMap<>();
        response.put("user", userDto);
        response.put("videos", videos);
        response.put("followersCount", followersCount);
        response.put("followingCount", followingCount);
        response.put("isCurrentUser", isCurrentUser);

        return ResponseEntity.ok(response);
    }
}
