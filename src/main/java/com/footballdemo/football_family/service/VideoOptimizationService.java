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
        System.out.println("🔄 Optimisation iOS : " + filename);

        Path originalPath = Paths.get(uploadDir, filename);

        try {
            // ✅ 1. DÉTECTION CODEC
            ProcessBuilder codecProbe = new ProcessBuilder(
                    "ffprobe",
                    "-v", "error",
                    "-select_streams", "v:0",
                    "-show_entries", "stream=codec_name",
                    "-of", "default=noprint_wrappers=1:nokey=1",
                    originalPath.toString()
            );

            Process codecProcess = codecProbe.start();
            if (!codecProcess.waitFor(30, TimeUnit.SECONDS)) {
                codecProcess.destroy();
                throw new RuntimeException("FFprobe codec timeout");
            }

            BufferedReader codecReader = new BufferedReader(new InputStreamReader(codecProcess.getInputStream()));
            String codec = codecReader.readLine();
            
            // ✅ 2. DÉTECTION RÉSOLUTION
            ProcessBuilder resProbe = new ProcessBuilder(
                    "ffprobe",
                    "-v", "error",
                    "-select_streams", "v:0",
                    "-show_entries", "stream=width,height",
                    "-of", "csv=p=0",
                    originalPath.toString()
            );

            Process resProcess = resProbe.start();
            if (!resProcess.waitFor(30, TimeUnit.SECONDS)) {
                resProcess.destroy();
                throw new RuntimeException("FFprobe resolution timeout");
            }

            BufferedReader resReader = new BufferedReader(new InputStreamReader(resProcess.getInputStream()));
            String dimensions = resReader.readLine();

            boolean needsTranscode = false;
            
            // ✅ TRANSCODE SI codec ≠ h264
            if (codec != null && !codec.equalsIgnoreCase("h264")) {
                System.out.println("⚠️ Codec " + codec + " détecté, transcodage nécessaire pour iOS");
                needsTranscode = true;
            }
            
            // ✅ TRANSCODE SI > 1080p
            if (dimensions != null) {
                String[] parts = dimensions.split(",");
                int width = Integer.parseInt(parts[0]);
                int height = Integer.parseInt(parts[1]);

                if (width > 1920 || height > 1080) {
                    System.out.println("⚠️ Résolution " + width + "x" + height + " détectée, downscale vers 1080p");
                    needsTranscode = true;
                }
            }

            // ✅ SKIP si déjà H.264 ≤ 1080p
            if (!needsTranscode) {
                System.out.println("✅ Déjà H.264 ≤ 1080p, skip");
                videoRepository.findById(videoId).ifPresent(video -> {
                    video.setStatus(VideoStatus.READY);
                    videoRepository.save(video);
                });
                return;
            }

            // ✅ 3. TRANSCODAGE H.264 BASELINE (iOS COMPATIBLE)
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
                    System.out.println("✅ Vidéo #" + videoId + " transcodée H.264 READY");
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