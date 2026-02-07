package com.footballdemo.football_family.controller.api.videos;

import com.footballdemo.football_family.dto.*;
import com.footballdemo.football_family.service.VideoService;
import com.footballdemo.football_family.service.CommentService;

import io.github.bucket4j.Bucket;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Refill;


import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/videos")
public class VideoFeedApiController {

    private final VideoService videoService;
    private final CommentService commentService;
    
    // ✅ RATE LIMITING PAR USER
    private final Map<String, Bucket> uploadBuckets = new ConcurrentHashMap<>();
    private final Map<String, Bucket> likeBuckets = new ConcurrentHashMap<>();
    private final Map<String, Bucket> commentBuckets = new ConcurrentHashMap<>();

    public VideoFeedApiController(VideoService videoService, CommentService commentService) {
        this.videoService = videoService;
        this.commentService = commentService;
    }

    // ✅ HELPER: Rate limit upload (100 uploads/minute en DEV)
    private Bucket getUploadBucket(String username) {
        return uploadBuckets.computeIfAbsent(username, k -> 
            Bucket.builder()
                .addLimit(Bandwidth.classic(100, Refill.intervally(100, Duration.ofMinutes(1))))
                .build()
        );
    }

    // ✅ HELPER: Rate limit likes (50 likes/minute)
    private Bucket getLikeBucket(String username) {
        return likeBuckets.computeIfAbsent(username, k -> 
            Bucket.builder()
                .addLimit(Bandwidth.classic(50, Refill.intervally(50, Duration.ofMinutes(1))))
                .build()
        );
    }

    // ✅ HELPER: Rate limit comments (10 comments/minute)
    private Bucket getCommentBucket(String username) {
        return commentBuckets.computeIfAbsent(username, k -> 
            Bucket.builder()
                .addLimit(Bandwidth.classic(10, Refill.intervally(10, Duration.ofMinutes(1))))
                .build()
        );
    }

    // -------------------------------------------------
    // 1️⃣ FEED PUBLIC - SANS CACHE EN DEV
    // -------------------------------------------------
    @GetMapping("/feed")
    public ApiResponse<List<VideoDto>> feed(
            @RequestParam(defaultValue = "0") int page,
            Principal principal) {

        if (page > 50) {
            return new ApiResponse<>(false, "Page max = 50", null);
        }

        var pageable = PageRequest.of(page, 10, Sort.by("dateUpload").descending());
        String username = (principal != null) ? principal.getName() : null;

        List<VideoDto> videos = videoService.getFeedVideosForUser(pageable, username);
        return new ApiResponse<>(true, "Feed", videos);
    }

    // -------------------------------------------------
    // 2️⃣ FEED DES SUIVIS
    // -------------------------------------------------
    @GetMapping("/feed/following")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<List<VideoDto>> followingFeed(
            @RequestParam(defaultValue = "0") int page,
            Principal principal) {

        if (page > 50) {
            return new ApiResponse<>(false, "Page max = 50", null);
        }

        var pageable = PageRequest.of(page, 10, Sort.by("dateUpload").descending());
        List<VideoDto> videos = videoService.getFollowedFeedVideosForUser(pageable, principal.getName());

        return new ApiResponse<>(true, "Feed des utilisateurs suivis", videos);
    }

    // -------------------------------------------------
    // 3️⃣ LIKE - ✅ AVEC RATE LIMIT
    // -------------------------------------------------
    @PostMapping("/{videoId}/like")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<LikeResponseDto>> like(
            @PathVariable Long videoId, 
            Principal principal) {

        Bucket bucket = getLikeBucket(principal.getName());
        
        if (!bucket.tryConsume(1)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .body(new ApiResponse<>(false, "Trop de likes, attendez", null));
        }

        LikeResponseDto result = videoService.toggleLike(videoId, principal.getName());
        return ResponseEntity.ok(new ApiResponse<>(true, "Like toggled", result));
    }

    // -------------------------------------------------
    // 4️⃣ COMMENTAIRES - SANS CACHE EN DEV
    // -------------------------------------------------
    @GetMapping("/{videoId}/comments")
    public ApiResponse<CommentListResponse> comments(
            @PathVariable Long videoId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size) {

        if (page > 20) {
            return new ApiResponse<>(false, "Page max = 20", null);
        }

        Page<CommentDto> commentPage = commentService.getCommentsForVideo(videoId, page, size);

        return new ApiResponse<>(
                true,
                "Commentaires récupérés",
                new CommentListResponse(commentPage.getContent(), commentPage.getTotalElements())
        );
    }

    @PostMapping("/{videoId}/comments")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<CommentDto>> addComment(
            @PathVariable Long videoId,
            @RequestBody Map<String, String> payload,
            Principal principal) {

        Bucket bucket = getCommentBucket(principal.getName());
        
        if (!bucket.tryConsume(1)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .body(new ApiResponse<>(false, "Trop de commentaires, attendez", null));
        }

        String content = payload.get("content");

        if (content == null || content.isBlank()) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse<>(false, "Commentaire vide", null));
        }

        if (content.length() > 500) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse<>(false, "Commentaire trop long (max 500)", null));
        }

        CommentDto dto = commentService.addComment(videoId, content, principal.getName());
        return ResponseEntity.ok(new ApiResponse<>(true, "Commentaire ajouté", dto));
    }

    // -------------------------------------------------
    // 5️⃣ SUPPRESSION VIDEO
    // -------------------------------------------------
    @DeleteMapping("/{videoId}")
    @PreAuthorize("isAuthenticated() and @videoService.isUploader(#videoId, principal.name)")
    public ApiResponse<Void> deleteVideo(@PathVariable Long videoId, Principal principal) {
        try {
            videoService.deleteVideo(videoId, principal.getName());
            return new ApiResponse<>(true, "Vidéo supprimée", null);
        } catch (Exception ex) {
            return new ApiResponse<>(false, "Erreur: " + ex.getMessage(), null);
        }
    }

    // -------------------------------------------------
    // 6️⃣ UPLOAD VIDEO - ✅ AVEC RATE LIMIT ET VALIDATION
    // -------------------------------------------------
    @PostMapping("/upload")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<String>> uploadVideo(
            @RequestParam("file") MultipartFile file,
            @RequestParam("title") String title,
            @RequestParam("category") String category,
            Principal principal) {

        // ✅ RATE LIMIT: 100 uploads/minute en DEV
        Bucket bucket = getUploadBucket(principal.getName());
        
        if (!bucket.tryConsume(1)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .body(new ApiResponse<>(false, "Limite: 100 uploads/minute", null));
        }

        // ✅ VALIDATIONS
        if (file.isEmpty()) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse<>(false, "Fichier vide", null));
        }

        if (file.getSize() > 100 * 1024 * 1024) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse<>(false, "Max 100MB", null));
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("video/")) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse<>(false, "Pas une vidéo", null));
        }

        String filename = file.getOriginalFilename();
        if (filename == null || !filename.matches(".*\\.(mp4|mov|avi|mkv|MP4|MOV|AVI|MKV)$")) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse<>(false, "Extension invalide", null));
        }

        if (title == null || title.trim().isEmpty() || title.length() > 100) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse<>(false, "Titre invalide", null));
        }

        try {
            String username = principal.getName();
            videoService.uploadVideo(file, title, category, username);
            
            return ResponseEntity.ok(
                new ApiResponse<>(true, "Upload en cours", null)
            );
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiResponse<>(false, "Erreur: " + e.getMessage(), null));
        }
    }

    // -------------------------------------------------
    // 7️⃣ TOUTES LES VIDÉOS D'UN USER - SANS CACHE EN DEV
    // -------------------------------------------------
    @GetMapping("/user/{userId}")
    public ApiResponse<List<VideoDto>> getVideosByUser(@PathVariable Long userId) {
        List<VideoDto> videos = videoService.getVideosForUserId(userId);
        return new ApiResponse<>(true, "Vidéos récupérées", videos);
    }

    // -------------------------------------------------
    // 8️⃣ OBTENIR UNE VIDÉO PAR ID - SANS CACHE EN DEV
    // -------------------------------------------------
    @GetMapping("/{videoId}")
    public ApiResponse<VideoDto> getVideoById(@PathVariable Long videoId) {
        VideoDto dto = videoService.getVideoById(videoId);
        return new ApiResponse<>(true, "Vidéo trouvée", dto);
    }
}