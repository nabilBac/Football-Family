package com.footballdemo.football_family.controller;

import com.footballdemo.football_family.model.Video;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Controller
@RequestMapping("/videos")
public class VideoController {

    @Value("${videos.upload.dir}")
    private String uploadDir;

    // ================================
    // 🎬 PAGE UPLOAD (SI BESOIN)
    // ================================
    @GetMapping("/upload")
    public String upload(Model model) {
        model.addAttribute("video", new Video());
        return "video-upload";
    }

    // ================================
    // 🎥 STREAMING VIDÉO (PC + MOBILE)
    // ================================
    @GetMapping("/{filename:.+}")
    @ResponseBody
    public ResponseEntity<Resource> streamVideo(
            @PathVariable String filename,
            @RequestHeader(value = "Range", required = false) String rangeHeader) {

        try {
            // ✅ Charger le fichier vidéo
            Path filePath = Paths.get(uploadDir).resolve(filename).normalize();
            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.exists() || !resource.isReadable()) {
                return ResponseEntity.notFound().build();
            }

            // ✅ Déterminer le type MIME
            String contentType = Files.probeContentType(filePath);
            if (contentType == null) {
                contentType = "video/mp4";
            }

            long fileSize = resource.contentLength();

            // ✅ RANGE REQUEST (pour mobile)
            if (rangeHeader != null && rangeHeader.startsWith("bytes=")) {
                return handleRangeRequest(resource, rangeHeader, fileSize, contentType);
            }

            // ✅ FULL REQUEST (fichier complet)
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(contentType));
            headers.setContentLength(fileSize);
            headers.add(HttpHeaders.ACCEPT_RANGES, "bytes");
            headers.add(HttpHeaders.CACHE_CONTROL, "public, max-age=31536000");

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(resource);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ================================
    // 📱 GESTION RANGE REQUESTS (MOBILE)
    // ================================
    private ResponseEntity<Resource> handleRangeRequest(
            Resource resource,
            String rangeHeader,
            long fileSize,
            String contentType) throws IOException {

        // Parser "bytes=0-1023" ou "bytes=1024-"
        String[] ranges = rangeHeader.replace("bytes=", "").split("-");
        long start = Long.parseLong(ranges[0]);
        long end = ranges.length > 1 && !ranges[1].isEmpty()
                ? Long.parseLong(ranges[1])
                : fileSize - 1;

        // Limiter à la taille du fichier
        if (end >= fileSize) {
            end = fileSize - 1;
        }

        long contentLength = end - start + 1;

        // ✅ Lire UNIQUEMENT la portion demandée
        InputStream inputStream = resource.getInputStream();
        inputStream.skip(start);

        byte[] data = new byte[(int) contentLength];
        int bytesRead = inputStream.read(data);
        inputStream.close();

        if (bytesRead == -1) {
            return ResponseEntity.status(HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE).build();
        }

        // ✅ Headers pour PARTIAL CONTENT
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(contentType));
        headers.setContentLength(contentLength);
        headers.add(HttpHeaders.CONTENT_RANGE,
                String.format("bytes %d-%d/%d", start, end, fileSize));
        headers.add(HttpHeaders.ACCEPT_RANGES, "bytes");
        headers.add(HttpHeaders.CACHE_CONTROL, "public, max-age=31536000");

        return ResponseEntity.status(HttpStatus.PARTIAL_CONTENT)
                .headers(headers)
                .body(new org.springframework.core.io.ByteArrayResource(data));
    }

    // ================================
    // 🖼️ STREAMING THUMBNAILS
    // ================================
    @GetMapping("/thumbnails/{filename:.+}")
    @ResponseBody
    public ResponseEntity<Resource> streamThumbnail(@PathVariable String filename) {

        try {
            Path filePath = Paths.get(uploadDir, "thumbnails").resolve(filename).normalize();
            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.exists() || !resource.isReadable()) {
                return ResponseEntity.notFound().build();
            }

            String contentType = Files.probeContentType(filePath);
            if (contentType == null) {
                contentType = "image/jpeg";
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(contentType));
            headers.setContentLength(resource.contentLength());
            headers.add(HttpHeaders.CACHE_CONTROL, "public, max-age=31536000");

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(resource);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}