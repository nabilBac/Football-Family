package com.footballdemo.football_family.controller.api.videos;

import com.footballdemo.football_family.model.Video;
import com.footballdemo.football_family.service.VideoService;
import com.footballdemo.football_family.service.ThumbnailService;
import com.footballdemo.football_family.repository.VideoRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.beans.factory.annotation.Value;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/videos")
@PreAuthorize("isAuthenticated()")
public class VideoAdminController {

    private final VideoService videoService;
    private final VideoRepository videoRepository;
    private final ThumbnailService thumbnailService;

    @Value("${videos.upload.dir}")
    private String uploadDir;

    public VideoAdminController(VideoService videoService, VideoRepository videoRepository, ThumbnailService thumbnailService) {
        this.videoService = videoService;
        this.videoRepository = videoRepository;
        this.thumbnailService = thumbnailService;
    }

    @PostMapping("/regenerate-thumbnails")
    public ResponseEntity<Map<String, Object>> regenerateThumbnails() {
        Map<String, Object> report = new HashMap<>();

        try {
            List<Video> allVideos = videoRepository.findAll();
            int total = allVideos.size();
            int launched = 0;
            int skipped = 0;

            for (Video video : allVideos) {
                String videoFilename = video.getFilename();
                String currentThumbnail = video.getThumbnailUrl();

                Path videoPath = Paths.get(uploadDir, videoFilename);
                if (!Files.exists(videoPath)) {
                    continue;
                }

                if (currentThumbnail != null && !currentThumbnail.equals("default_video_placeholder.jpg")
                        && !currentThumbnail.equals("thumbnails/default.png")) {
                    Path thumbnailPath = Paths.get(uploadDir, currentThumbnail);
                    if (Files.exists(thumbnailPath)) {
                        skipped++;
                        continue;
                    }
                }

                thumbnailService.generateThumbnailAsync(video.getId(), videoFilename);
                launched++;
            }

            videoService.evictFeedCache();

            report.put("success", true);
            report.put("total", total);
            report.put("launched", launched);
            report.put("skipped", skipped);
            report.put("message", String.format("Regeneration lancee : %d taches, %d ignorees", launched, skipped));

            return ResponseEntity.ok(report);

        } catch (Exception e) {
            report.put("success", false);
            report.put("message", "Erreur : " + e.getMessage());
            return ResponseEntity.status(500).body(report);
        }
    }

    @GetMapping("/thumbnails-status")
    public ResponseEntity<Map<String, Object>> checkThumbnailsStatus() {
        Map<String, Object> status = new HashMap<>();

        try {
            List<Video> allVideos = videoRepository.findAll();
            int total = allVideos.size();
            int withValidThumbnail = 0;
            int missingThumbnail = 0;
            int usingPlaceholder = 0;

            for (Video video : allVideos) {
                String thumbnailUrl = video.getThumbnailUrl();

                if (thumbnailUrl == null || thumbnailUrl.equals("default_video_placeholder.jpg")
                        || thumbnailUrl.equals("thumbnails/default.png")) {
                    usingPlaceholder++;
                } else {
                    Path thumbnailPath = Paths.get(uploadDir, thumbnailUrl);
                    if (Files.exists(thumbnailPath)) {
                        withValidThumbnail++;
                    } else {
                        missingThumbnail++;
                    }
                }
            }

            status.put("total", total);
            status.put("withValidThumbnail", withValidThumbnail);
            status.put("missingThumbnail", missingThumbnail);
            status.put("usingPlaceholder", usingPlaceholder);
            status.put("message", String.format("Statut : %d OK, %d manquantes, %d placeholder", 
                withValidThumbnail, missingThumbnail, usingPlaceholder));

            return ResponseEntity.ok(status);

        } catch (Exception e) {
            status.put("error", e.getMessage());
            return ResponseEntity.status(500).body(status);
        }
    }

    @PostMapping("/{videoId}/regenerate-thumbnail")
    public ResponseEntity<Map<String, Object>> regenerateSingleThumbnail(@PathVariable Long videoId) {
        Map<String, Object> result = new HashMap<>();

        try {
            Video video = videoRepository.findById(videoId)
                    .orElseThrow(() -> new RuntimeException("Video introuvable"));

            thumbnailService.generateThumbnailAsync(video.getId(), video.getFilename());

            video.setThumbnailUrl("thumbnails/default.png");
            videoRepository.save(video);
            videoService.evictFeedCache();

            result.put("success", true);
            result.put("thumbnailUrl", "thumbnails/default.png");
            result.put("message", "Generation lancee en arriere-plan");

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "Erreur : " + e.getMessage());
            return ResponseEntity.status(500).body(result);
        }
    }

    @GetMapping("/last")
public List<Map<String,Object>> last() {
  return videoRepository.findAll(
      org.springframework.data.domain.PageRequest.of(0, 10, org.springframework.data.domain.Sort.by("dateUpload").descending())
  ).map(v -> {
      Map<String,Object> m = new HashMap<>();
      m.put("id", v.getId());
      m.put("status", v.getStatus());
      m.put("filename", v.getFilename());
      m.put("thumb", v.getThumbnailUrl());
      m.put("date", v.getDateUpload());
      return m;
  }).getContent();
}

}