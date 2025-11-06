package com.footballdemo.football_family.controller;

import com.footballdemo.football_family.model.Video;
import com.footballdemo.football_family.service.VideoService;
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
@PreAuthorize("isAuthenticated()") // 🔓 Temporaire : tout utilisateur connecté peut accéder
public class VideoAdminController {

    private final VideoService videoService;
    private final VideoRepository videoRepository;
    
    @Value("${videos.upload.dir}")
    private String uploadDir;

    public VideoAdminController(VideoService videoService, VideoRepository videoRepository) {
        this.videoService = videoService;
        this.videoRepository = videoRepository;
    }

    /**
     * Endpoint pour régénérer toutes les miniatures manquantes
     * URL: POST /admin/videos/regenerate-thumbnails
     * 
     * Retourne un rapport JSON détaillé de l'opération
     */
    @PostMapping("/regenerate-thumbnails")
    public ResponseEntity<Map<String, Object>> regenerateThumbnails() {
        Map<String, Object> report = new HashMap<>();
        
        try {
            List<Video> allVideos = videoRepository.findAll();
            int total = allVideos.size();
            int success = 0;
            int skipped = 0;
            int failed = 0;
            
            System.out.println("\n🔄 ═══════════════════════════════════════════");
            System.out.println("   RÉGÉNÉRATION DES MINIATURES");
            System.out.println("═══════════════════════════════════════════");
            System.out.println("📊 Total de vidéos à traiter : " + total);
            System.out.println("═══════════════════════════════════════════\n");
            
            for (Video video : allVideos) {
                String videoFilename = video.getFilename();
                String currentThumbnail = video.getThumbnailUrl();
                
                System.out.println("🎬 Traitement : " + video.getTitle());
                System.out.println("   📁 Fichier : " + videoFilename);
                
                // Vérifier si la vidéo source existe
                Path videoPath = Paths.get(uploadDir, videoFilename);
                if (!Files.exists(videoPath)) {
                    System.out.println("   ❌ Vidéo source MANQUANTE\n");
                    failed++;
                    continue;
                }
                
                // Vérifier si la miniature existe déjà
                if (currentThumbnail != null && !currentThumbnail.equals("default_video_placeholder.jpg")) {
                    Path thumbnailPath = Paths.get(uploadDir, currentThumbnail);
                    if (Files.exists(thumbnailPath)) {
                        System.out.println("   ⏭️  Miniature DÉJÀ PRÉSENTE : " + currentThumbnail);
                        System.out.println("   ✓  Ignorée\n");
                        skipped++;
                        continue;
                    } else {
                        System.out.println("   🔍 Miniature référencée mais fichier absent : " + currentThumbnail);
                    }
                }
                
                // Générer la miniature
                System.out.println("   ⚙️  Génération en cours...");
                String newThumbnailUrl = videoService.generateThumbnail(videoFilename);
                
                if (newThumbnailUrl != null && !newThumbnailUrl.equals("default_video_placeholder.jpg")) {
                    video.setThumbnailUrl(newThumbnailUrl);
                    videoRepository.save(video);
                    System.out.println("   ✅ SUCCÈS : " + newThumbnailUrl);
                    System.out.println("   💾 Sauvegardé en base de données\n");
                    success++;
                } else {
                    video.setThumbnailUrl("default_video_placeholder.jpg");
                    videoRepository.save(video);
                    System.out.println("   ⚠️  ÉCHEC : Utilisation du placeholder");
                    System.out.println("   💡 Vérifiez que FFmpeg est installé et accessible\n");
                    failed++;
                }
            }
            
            // Invalider le cache après régénération
            videoService.evictFeedCache();
            System.out.println("🗑️  Cache invalidé");
            
            // Construire le rapport
            report.put("success", true);
            report.put("total", total);
            report.put("generated", success);
            report.put("skipped", skipped);
            report.put("failed", failed);
            
            String summaryMessage = String.format(
                "✅ Régénération terminée : %d générées, %d ignorées, %d échecs sur %d vidéos",
                success, skipped, failed, total
            );
            report.put("message", summaryMessage);
            
            System.out.println("\n═══════════════════════════════════════════");
            System.out.println("   RAPPORT FINAL");
            System.out.println("═══════════════════════════════════════════");
            System.out.println("📊 Total traité    : " + total);
            System.out.println("✅ Générées        : " + success);
            System.out.println("⏭️  Ignorées        : " + skipped);
            System.out.println("❌ Échecs          : " + failed);
            System.out.println("═══════════════════════════════════════════\n");
            
            return ResponseEntity.ok(report);
            
        } catch (Exception e) {
            report.put("success", false);
            report.put("message", "❌ Erreur critique : " + e.getMessage());
            System.err.println("\n❌ ERREUR CRITIQUE : " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(report);
        }
    }
    
    /**
     * Endpoint pour vérifier l'état des miniatures sans modification
     * URL: GET /admin/videos/thumbnails-status
     * 
     * Utile pour diagnostiquer avant de régénérer
     */
    @GetMapping("/thumbnails-status")
    public ResponseEntity<Map<String, Object>> checkThumbnailsStatus() {
        Map<String, Object> status = new HashMap<>();
        
        try {
            List<Video> allVideos = videoRepository.findAll();
            int total = allVideos.size();
            int withValidThumbnail = 0;
            int missingThumbnail = 0;
            int usingPlaceholder = 0;
            
            System.out.println("\n🔍 ═══════════════════════════════════════════");
            System.out.println("   DIAGNOSTIC DES MINIATURES");
            System.out.println("═══════════════════════════════════════════\n");
            
            for (Video video : allVideos) {
                String thumbnailUrl = video.getThumbnailUrl();
                
                if (thumbnailUrl == null || thumbnailUrl.equals("default_video_placeholder.jpg")) {
                    System.out.println("⚠️  " + video.getTitle() + " → Placeholder");
                    usingPlaceholder++;
                } else {
                    Path thumbnailPath = Paths.get(uploadDir, thumbnailUrl);
                    if (Files.exists(thumbnailPath)) {
                        withValidThumbnail++;
                    } else {
                        System.out.println("❌ " + video.getTitle() + " → MANQUANTE (" + thumbnailUrl + ")");
                        missingThumbnail++;
                    }
                }
            }
            
            status.put("total", total);
            status.put("withValidThumbnail", withValidThumbnail);
            status.put("missingThumbnail", missingThumbnail);
            status.put("usingPlaceholder", usingPlaceholder);
            
            String summaryMessage = String.format(
                "📊 Statut : %d OK, %d manquantes, %d placeholder sur %d vidéos",
                withValidThumbnail, missingThumbnail, usingPlaceholder, total
            );
            status.put("message", summaryMessage);
            
            System.out.println("\n═══════════════════════════════════════════");
            System.out.println(summaryMessage);
            System.out.println("═══════════════════════════════════════════\n");
            
            return ResponseEntity.ok(status);
            
        } catch (Exception e) {
            status.put("error", e.getMessage());
            System.err.println("❌ Erreur lors du diagnostic : " + e.getMessage());
            return ResponseEntity.status(500).body(status);
        }
    }
    
    /**
     * Endpoint pour forcer la régénération d'une miniature spécifique
     * URL: POST /admin/videos/{videoId}/regenerate-thumbnail
     */
    @PostMapping("/{videoId}/regenerate-thumbnail")
    public ResponseEntity<Map<String, Object>> regenerateSingleThumbnail(@PathVariable Long videoId) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            Video video = videoRepository.findById(videoId)
                .orElseThrow(() -> new RuntimeException("Vidéo introuvable avec l'ID : " + videoId));
            
            System.out.println("\n🎬 Régénération pour : " + video.getTitle());
            
            String newThumbnailUrl = videoService.generateThumbnail(video.getFilename());
            
            if (newThumbnailUrl != null && !newThumbnailUrl.equals("default_video_placeholder.jpg")) {
                video.setThumbnailUrl(newThumbnailUrl);
                videoRepository.save(video);
                videoService.evictFeedCache();
                
                result.put("success", true);
                result.put("thumbnailUrl", newThumbnailUrl);
                result.put("message", "✅ Miniature régénérée : " + newThumbnailUrl);
                
                System.out.println("✅ Succès : " + newThumbnailUrl);
                
                return ResponseEntity.ok(result);
            } else {
                result.put("success", false);
                result.put("message", "❌ Échec de la génération");
                
                System.out.println("❌ Échec de la génération");
                
                return ResponseEntity.status(500).body(result);
            }
            
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "❌ Erreur : " + e.getMessage());
            System.err.println("❌ Erreur : " + e.getMessage());
            return ResponseEntity.status(500).body(result);
        }
    }
}