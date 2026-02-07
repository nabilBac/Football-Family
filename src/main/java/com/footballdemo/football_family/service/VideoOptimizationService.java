package com.footballdemo.football_family.service;

import com.footballdemo.football_family.model.VideoStatus;
import com.footballdemo.football_family.repository.VideoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.concurrent.TimeUnit;

@Service
public class VideoOptimizationService {

    @Value("${videos.upload.dir}")
    private String uploadDir;

    @Autowired
    private VideoRepository videoRepository;

    @Async
    public void optimizeVideoForMobile(Long videoId, String filename) {
        System.out.println("🔄 Optimisation : " + filename);

        Path originalPath = Paths.get(uploadDir, filename);

        try {
            // ✅ DÉTECTION RÉSOLUTION
            ProcessBuilder probeBuilder = new ProcessBuilder(
                    "ffprobe",
                    "-v", "error",
                    "-select_streams", "v:0",
                    "-show_entries", "stream=width,height",
                    "-of", "csv=p=0",
                    originalPath.toString()
            );

            Process probe = probeBuilder.start();
            
            // ✅ TIMEOUT 30 SECONDES
            if (!probe.waitFor(30, TimeUnit.SECONDS)) {
                probe.destroy();
                throw new RuntimeException("FFprobe timeout");
            }

            BufferedReader reader = new BufferedReader(new InputStreamReader(probe.getInputStream()));
            String dimensions = reader.readLine();

            if (dimensions != null) {
                String[] parts = dimensions.split(",");
                int width = Integer.parseInt(parts[0]);
                int height = Integer.parseInt(parts[1]);

                // ✅ SI ≤ 1080p, SKIP
                if (width <= 1920 && height <= 1080) {
                    System.out.println("✅ Déjà 1080p, skip");

                    videoRepository.findById(videoId).ifPresent(video -> {
                        video.setStatus(VideoStatus.READY);
                        videoRepository.save(video);
                    });
                    return;
                }

                System.out.println("🔄 4K détectée, optimisation...");
            }

            // ✅ OPTIMISATION 4K → 1080p
            Path tempPath = Paths.get(uploadDir, "temp_" + filename);

            ProcessBuilder pb = new ProcessBuilder(
                    "ffmpeg",
                    "-i", originalPath.toString(),
                    "-vf", "scale='min(1920,iw)':'min(1080,ih)':force_original_aspect_ratio=decrease",
                    "-c:v", "libx264",
                    "-profile:v", "baseline",
                    "-level", "3.0",
                    "-preset", "fast",
                    "-pix_fmt", "yuv420p",
                    "-c:a", "aac",
                    "-b:a", "128k",
                    "-movflags", "+faststart",
                    "-y",
                    tempPath.toString()
            );

            pb.redirectErrorStream(true);
            Process process = pb.start();

            try (BufferedReader ffmpegReader = new BufferedReader(
                    new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = ffmpegReader.readLine()) != null) {
                    if (line.contains("error") || line.contains("Output")) {
                        System.out.println("[FFmpeg] " + line);
                    }
                }
            }

            // ✅ TIMEOUT 10 MINUTES
            if (!process.waitFor(10, TimeUnit.MINUTES)) {
                process.destroy();
                throw new RuntimeException("FFmpeg timeout");
            }

            int exitCode = process.exitValue();

            if (exitCode == 0) {
                Thread.sleep(2000);
                Files.delete(originalPath);
                Files.move(tempPath, originalPath);

                videoRepository.findById(videoId).ifPresent(video -> {
                    video.setStatus(VideoStatus.READY);
                    videoRepository.save(video);
                    System.out.println("✅ Vidéo #" + videoId + " READY");
                });

            } else {
                videoRepository.findById(videoId).ifPresent(video -> {
                    video.setStatus(VideoStatus.FAILED);
                    videoRepository.save(video);
                    System.err.println("❌ Vidéo #" + videoId + " FAILED");
                });

                Files.deleteIfExists(tempPath);
            }

        } catch (Exception e) {
            videoRepository.findById(videoId).ifPresent(video -> {
                video.setStatus(VideoStatus.FAILED);
                videoRepository.save(video);
            });

            System.err.println("⚠️ Erreur: " + e.getMessage());
            e.printStackTrace();
        }
    }
}