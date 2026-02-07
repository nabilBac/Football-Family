package com.footballdemo.football_family.controller;

import com.footballdemo.football_family.dto.ApiResponse;
import com.footballdemo.football_family.dto.VideoReactionsResponse;
import com.footballdemo.football_family.security.JwtService;

import com.footballdemo.football_family.service.VideoReactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/videos")
@RequiredArgsConstructor
public class VideoReactionController {

    private final VideoReactionService reactionService;
   private final JwtService jwtService;


    // ✅ POST /api/videos/{videoId}/reactions
    // Body: { "emoji": "❤️" }
   @PostMapping("/{videoId}/reactions")
public ResponseEntity<ApiResponse<VideoReactionsResponse>> addReaction(
        @PathVariable Long videoId,
        @RequestBody Map<String, String> payload,
        @RequestHeader("Authorization") String authHeader
) {
    Long userId = jwtService.extractUserId(authHeader.replace("Bearer ", ""));
    String emoji = payload.get("emoji");

    // ✅ AMÉLIORER LA VALIDATION
    if (emoji == null || emoji.trim().isEmpty()) {
        return ResponseEntity.badRequest()
                .body(new ApiResponse<>(false, "Emoji manquant", null));
    }
    
    // ✅ AJOUTER: Limiter à certains emojis
    List<String> allowedEmojis = List.of("❤️", "⚽", "🔥", "👏", "😂", "😍");
    if (!allowedEmojis.contains(emoji)) {
        return ResponseEntity.badRequest()
                .body(new ApiResponse<>(false, "Emoji non supporté", null));
    }

    VideoReactionsResponse response = reactionService.addOrUpdateReaction(videoId, userId, emoji);
    return ResponseEntity.ok(new ApiResponse<>(true, "Réaction enregistrée", response));
}

    // ✅ GET /api/videos/{videoId}/reactions
    @GetMapping("/{videoId}/reactions")
    public ResponseEntity<ApiResponse<VideoReactionsResponse>> getReactions(
            @PathVariable Long videoId,
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        Long userId = null;
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            userId = jwtService.extractUserId(authHeader.replace("Bearer ", ""));
        }

        VideoReactionsResponse response = reactionService.getReactionsForVideo(videoId, userId);

        return ResponseEntity.ok(new ApiResponse<>(true, "Réactions récupérées", response));
    }

    // ✅ DELETE /api/videos/{videoId}/reactions (supprimer sa réaction)
    @DeleteMapping("/{videoId}/reactions")
    public ResponseEntity<ApiResponse<Void>> removeReaction(
            @PathVariable Long videoId,
            @RequestHeader("Authorization") String authHeader
    ) {
        Long userId = jwtService.extractUserId(authHeader.replace("Bearer ", ""));
        reactionService.removeReaction(videoId, userId);

        return ResponseEntity.ok(new ApiResponse<>(true, "Réaction supprimée", null));
    }
}