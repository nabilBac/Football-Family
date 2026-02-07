package com.footballdemo.football_family.service;


import com.footballdemo.football_family.repository.VideoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;


@Service
@RequiredArgsConstructor
public class ThumbnailService {

    private final VideoRepository videoRepository;
    private final SimpMessagingTemplate messagingTemplate; 

    @Value("${videos.upload.dir}")
    private String uploadDir;

    /**
     * ✅ GÉNÉRATION MINIATURE ASYNCHRONE SÉCURISÉE
     */
    @Async
    public void generateThumbnailAsync(Long videoId, String filename) {
        System.out.println("🎬 Génération miniature pour : " + filename);
        
        try {
            // ✅ VALIDATION: Sanitize filename pour éviter injection
            if (!isValidFilename(filename)) {
                System.err.println("❌ Filename invalide (sécurité): " + filename);
                setDefaultThumbnail(videoId);
                return;
            }

            Path videoPath = Paths.get(uploadDir, filename);
            
            // ✅ VÉRIFICATION: Fichier existe
            if (!Files.exists(videoPath)) {
                System.err.println("❌ Vidéo introuvable : " + filename);
                setDefaultThumbnail(videoId);
                return;
            }

            // ✅ CRÉATION: Dossier thumbnails
            Path thumbDir = Paths.get(uploadDir, "thumbnails");
            Files.createDirectories(thumbDir);

            // ✅ GÉNÉRATION: Nom thumbnail
            String output = generateThumbnailName(filename);
            Path fullOutPath = thumbDir.resolve(output);

            // ✅ SKIP: Si thumbnail existe déjà
            if (Files.exists(fullOutPath)) {
                System.out.println("✅ Thumbnail existe déjà : " + output);
                updateVideoThumbnail(videoId, "thumbnails/" + output);
                return;
            }

            // ✅ FFMPEG: Génération avec timeout
            boolean success = generateThumbnailWithFFmpeg(
                videoPath.toString(), 
                fullOutPath.toString()
            );

            if (success) {
                updateVideoThumbnail(videoId, "thumbnails/" + output);
                System.out.println("✅ Miniature générée : " + output);
            } else {
                System.err.println("❌ FFmpeg échec pour : " + filename);
                setDefaultThumbnail(videoId);
            }

        } catch (Exception e) {
            System.err.println("❌ Erreur génération miniature : " + e.getMessage());
            e.printStackTrace();
            setDefaultThumbnail(videoId);
        }
    }

    /**
     * ✅ GÉNÉRATION FFMPEG AVEC TIMEOUT
     */
    private boolean generateThumbnailWithFFmpeg(String inputPath, String outputPath) {
        try {
            ProcessBuilder pb = new ProcessBuilder(
                "ffmpeg",
                "-i", inputPath,
                "-ss", "00:00:02",
                "-vframes", "1",
                "-q:v", "2", // ✅ Qualité 2 (haute qualité)
                "-y", // ✅ Overwrite sans demander
                outputPath
            );

            pb.redirectErrorStream(true);
            Process process = pb.start();

            // ✅ LOG: Erreurs FFmpeg
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    if (line.contains("error") || line.contains("Invalid")) {
                        System.err.println("[FFmpeg] " + line);
                    }
                }
            }

            // ✅ TIMEOUT: 30 secondes max
            if (!process.waitFor(30, TimeUnit.SECONDS)) {
                process.destroy();
                System.err.println("❌ FFmpeg timeout (30s)");
                return false;
            }

            int exitCode = process.exitValue();
            
            if (exitCode == 0) {
                // ✅ VÉRIFICATION: Fichier créé et non-vide
                Path outPath = Paths.get(outputPath);
                if (Files.exists(outPath) && Files.size(outPath) > 0) {
                    return true;
                }
            }

            return false;

        } catch (Exception e) {
            System.err.println("❌ Erreur FFmpeg : " + e.getMessage());
            return false;
        }
    }

    /**
     * ✅ VALIDATION: Filename sécurisé
     */
    private boolean isValidFilename(String filename) {
        if (filename == null || filename.isEmpty()) {
            return false;
        }
        
        // ✅ Refuse: path traversal, command injection
        if (filename.contains("..") || 
            filename.contains(";") || 
            filename.contains("&") ||
            filename.contains("|") ||
            filename.contains("`") ||
            filename.contains("$")) {
            return false;
        }

        // ✅ Accepte: Extensions valides uniquement
        return filename.matches(".*\\.(mp4|mov|avi|mkv|MP4|MOV|AVI|MKV)$");
    }

    /**
     * ✅ GÉNÉRATION: Nom thumbnail
     */
    private String generateThumbnailName(String filename) {
        return filename
            .replaceAll("\\.(mp4|mov|avi|mkv|MP4|MOV|AVI|MKV)$", ".png");
    }

    /**
     * ✅ UPDATE: Thumbnail URL dans vidéo
     */
  private void updateVideoThumbnail(Long videoId, String thumbnailUrl) {
    videoRepository.findById(videoId).ifPresent(video -> {
        video.setThumbnailUrl(thumbnailUrl);
        videoRepository.save(video);
        
        // ✅ Notifier le frontend
        Map<String, Object> notification = new HashMap<>();
        notification.put("videoId", videoId);
        notification.put("thumbnailUrl", thumbnailUrl);
        messagingTemplate.convertAndSend("/topic/video/" + videoId + "/thumbnail", notification);
    });
}

    /**
     * ✅ FALLBACK: Thumbnail par défaut
     */
    private void setDefaultThumbnail(Long videoId) {
        videoRepository.findById(videoId).ifPresent(video -> {
            video.setThumbnailUrl("thumbnails/default.png");
            videoRepository.save(video);
            System.out.println("⚠️ Thumbnail par défaut pour vidéo #" + videoId);
        });
    }
}