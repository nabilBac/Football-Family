package com.footballdemo.football_family.controller.api;

import com.footballdemo.football_family.dto.VideoDto;
import com.footballdemo.football_family.model.Video;
import com.footballdemo.football_family.service.VideoService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/videos")
@RequiredArgsConstructor
public class VideoRestController {

    private final VideoService videoService;

    // ✅ GET /api/videos/feed?page=0&size=10
    @GetMapping("/feed")
    public ResponseEntity<List<VideoDto>> feed(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication auth
    ) {
        Pageable pageable = PageRequest.of(page, size);
        String username = (auth != null) ? auth.getName() : null;
        return ResponseEntity.ok(videoService.getFeedVideosForUser(pageable, username));
    }

    // ✅ GET /api/videos/public?page=0&size=10 (si ton front l'utilise)
    @GetMapping("/public")
    public ResponseEntity<List<VideoDto>> publicFeed(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(videoService.getPublicFeedVideos(pageable));
    }

    // ✅ POST /api/videos/upload (multipart)
    @PostMapping(value = "/upload", consumes = "multipart/form-data")
    public ResponseEntity<?> upload(
            @RequestPart("file") MultipartFile file,
            @RequestPart("title") String title,
            @RequestPart("category") String category,
            Authentication auth
    ) throws IOException {

        if (auth == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        Video saved = videoService.uploadVideo(file, title, category, auth.getName());
        return ResponseEntity.ok(saved.getId()); // ou renvoie VideoDto si tu veux
    }
}
