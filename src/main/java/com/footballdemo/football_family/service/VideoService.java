package com.footballdemo.football_family.service;

import com.footballdemo.football_family.dto.LikeResponseDto;
import com.footballdemo.football_family.dto.VideoDto;
import com.footballdemo.football_family.model.User;
import com.footballdemo.football_family.model.Video;
import com.footballdemo.football_family.model.VideoLike;
import com.footballdemo.football_family.model.VideoStatus;
import com.footballdemo.football_family.repository.*;
import com.footballdemo.football_family.repository.VideoRepository.VideoFeedProjection;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;


import java.io.IOException;
import java.io.InputStream;

import java.nio.file.*;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.CompletableFuture;

@Service("videoService")
@RequiredArgsConstructor
public class VideoService {

    private final VideoRepository videoRepository;
    private final VideoLikeRepository videoLikeRepository;
    private final UserService userService;
    private final FollowRepository followRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final ThumbnailService thumbnailService;
    private final VideoOptimizationService videoOptimizationService;  

    @Value("${videos.upload.dir}")
    private String uploadDir;

    // ---------------------------
    // FEED GLOBAL (SEULEMENT VIDÉOS READY)
    // ---------------------------
    public List<VideoDto> getFeedVideosForUser(Pageable pageable, String username) {
        Page<VideoFeedProjection> videosPage = videoRepository.findReadyFeedProjectionOrderByDateUploadDesc(pageable);
        return mapToVideoDtoList(videosPage, username);
    }

    // ---------------------------
    // FEED PUBLIC (SEULEMENT VIDÉOS READY)
    // ---------------------------
    public List<VideoDto> getPublicFeedVideos(Pageable pageable) {
        return getFeedVideosForUser(pageable, null);
    }

    // ---------------------------
    // FEED FOLLOWED (SEULEMENT VIDÉOS READY)
    // ---------------------------
    public List<VideoDto> getFollowedFeedVideosForUser(Pageable pageable, String username) {
        User currentUser = userService.getUserByUsername(username)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé."));

        List<Long> followedIds = followRepository.findFollowingIdsByFollower(currentUser);

        if (followedIds.isEmpty())
            return List.of();

        Page<VideoFeedProjection> videosPage = videoRepository.findReadyFollowedFeedProjection(followedIds, pageable);
        return mapToVideoDtoList(videosPage, username);
    }

    // ---------------------------
    // MAPPER → DTO
    // ---------------------------
    private List<VideoDto> mapToVideoDtoList(Page<VideoRepository.VideoFeedProjection> page, String username) {
        User currentUser = userService.findUserByUsernameCached(username);

        List<Long> videoIds = page.getContent().stream()
                .map(VideoRepository.VideoFeedProjection::getId)
                .toList();

        if (videoIds.isEmpty()) {
            return List.of();
        }

        Map<Long, Boolean> likedMap = new HashMap<>();
        if (currentUser != null) {
            List<Long> likedIds = videoLikeRepository.findLikedVideoIdsByUserAndVideoIds(currentUser, videoIds);
            for (Long id : likedIds) {
                likedMap.put(id, true);
            }
        }

        Map<Long, Long> likeCountsMap = new HashMap<>();
        List<Object[]> rows = videoLikeRepository.countLikesForVideoIds(videoIds);
        for (Object[] row : rows) {
            Long videoId = (Long) row[0];
            Long count = (Long) row[1];
            likeCountsMap.put(videoId, count);
        }

        return page.getContent().stream()
                .map(p -> VideoDto.builder()
                        .id(p.getId())
                        .title(p.getTitle())
                        .uploaderUsername(p.getUploaderUsername())
                        .uploaderId(p.getUploaderId())
                        .category(p.getCategory())
                        .dateUpload(p.getDateUpload())
                        .filename(p.getFilename())
                        .thumbnailUrl(p.getThumbnailUrl())
                        .likesCount(likeCountsMap.getOrDefault(p.getId(), 0L).intValue())
                        .likedByCurrentUser(likedMap.getOrDefault(p.getId(), false))
                        .commentsCount(p.getCommentsCount())
                        .build())
                .toList();
    }

    // ---------------------------
    // LIKE / UNLIKE
    // ---------------------------
    @Transactional(isolation = Isolation.REPEATABLE_READ)
public LikeResponseDto toggleLike(Long videoId, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Video video = videoRepository.findById(videoId)
                .orElseThrow(() -> new RuntimeException("Video not found"));

        Optional<VideoLike> existing = videoLikeRepository.findByUserAndVideo(user, video);

        boolean liked;
        if (existing.isPresent()) {
            videoLikeRepository.delete(existing.get());
            liked = false;
        } else {
            VideoLike like = new VideoLike();
            like.setUser(user);
            like.setVideo(video);
            videoLikeRepository.save(like);
            liked = true;
        }

        long count = videoLikeRepository.countByVideo(video);

        LikeResponseDto response = new LikeResponseDto(liked, count);

        Map<String, Object> notification = new HashMap<>();
        notification.put("videoId", videoId);
        notification.put("liked", liked);
        notification.put("likesCount", count);
        notification.put("username", username);

        messagingTemplate.convertAndSend("/topic/video/" + videoId + "/likes", notification);

        return response;
    }

    // ---------------------------
    // DELETE VIDEO
    // ---------------------------
    @Transactional
    //@CacheEvict(value = "profileVideos", allEntries = true)
    public void deleteVideo(Long videoId, String uploaderUsername) throws IOException {
        Video video = videoRepository.findById(videoId)
                .orElseThrow(() -> new EntityNotFoundException("Vidéo introuvable"));

        if (!video.getUploader().getUsername().equals(uploaderUsername)) {
            throw new AccessDeniedException("Accès refusé");
        }

        deleteFile(video.getFilename());
        if (video.getThumbnailUrl() != null) {
            deleteFile(video.getThumbnailUrl());
        }

        videoRepository.delete(video);
        evictFeedCache();
    }

    private void deleteFile(String relativePath) throws IOException {
        Path base = Paths.get(uploadDir).toAbsolutePath().normalize();
        Path target = base.resolve(relativePath).normalize();

        if (!target.startsWith(base)) {
            throw new IOException("Security violation");
        }

        if (Files.exists(target))
            Files.delete(target);
    }

    //@CacheEvict(value = "videoFeed", allEntries = true)
    public void evictFeedCache() {
    }

    // ---------------------------
    // ✅ UPLOAD VIDEO - VERSION CORRIGÉE
    // ---------------------------
    @Transactional
    public Video uploadVideo(MultipartFile file, String title, String category, String username)
            throws IOException {

        if (file.isEmpty()) {
            throw new IllegalArgumentException("Fichier vide");
        }
        
        if (file.getSize() > 100 * 1024 * 1024) { // 100MB
            throw new IllegalArgumentException("Fichier trop volumineux (max 100MB)");
        }
        
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("video/")) {
            throw new IllegalArgumentException("Format non supporté");
        }
        
        User uploader = userService.findUserByUsernameCached(username);
        if (uploader == null) {
            throw new RuntimeException("User not found");
        }

        String original = StringUtils.cleanPath(file.getOriginalFilename());
        if (original.isEmpty())
            throw new IOException("Fichier invalide");

        String ext = original.contains(".")
                ? original.substring(original.lastIndexOf("."))
                : "";

        String filename = System.currentTimeMillis() + "_" + uploader.getUsername() + ext;

        Path path = Paths.get(uploadDir);
        if (!Files.exists(path))
            Files.createDirectories(path);

        try (InputStream is = file.getInputStream()) {
            Files.copy(is, path.resolve(filename), StandardCopyOption.REPLACE_EXISTING);
        }

        Video video = new Video();
        video.setTitle(title);
        video.setCategory(category);
        video.setFilename(filename);
        video.setDateUpload(LocalDateTime.now());
        video.setUploader(uploader);
        video.setThumbnailUrl("thumbnails/default.png");  // ✅ Placeholder
        video.setLikesCount(0);
        video.setCommentsCount(0);
        video.setStatus(VideoStatus.PROCESSING);

        Video savedVideo = videoRepository.save(video);

        System.out.println("📹 Vidéo #" + savedVideo.getId() + " uploadée, optimisation lancée");

        // ✅ GÉNÈRE LA THUMBNAIL EN PREMIER (elle met à jour thumbnailUrl)
        thumbnailService.generateThumbnailAsync(savedVideo.getId(), filename);

        // ✅ LANCE L'OPTIMISATION APRÈS
        videoOptimizationService.optimizeVideoForMobile(savedVideo.getId(), filename);

        return savedVideo;
    }

    // ---------------------------
    // GET VIDEO BY ID
    // ---------------------------
    public VideoDto getVideoById(Long id) {
        return getVideoById(id, null);
    }

    public VideoDto getVideoById(Long id, String username) {
        Video video = videoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vidéo introuvable : " + id));

        long likesCount = videoLikeRepository.countByVideo(video);
        
        boolean likedByCurrentUser = false;
        if (username != null) {
            User user = userService.findUserByUsernameCached(username);
            if (user != null) {
                likedByCurrentUser = videoLikeRepository.findByUserAndVideo(user, video).isPresent();
            }
        }

        return VideoDto.builder()
                .id(video.getId())
                .title(video.getTitle())
                .uploaderUsername(video.getUploader().getUsername())
                .uploaderId(video.getUploader().getId())
                .category(video.getCategory())
                .dateUpload(video.getDateUpload())
                .filename(video.getFilename())
                .thumbnailUrl(video.getThumbnailUrl())
                .likesCount((int) likesCount)
                .commentsCount(video.getCommentsCount())
                .likedByCurrentUser(likedByCurrentUser)
                .build();
    }

    // ---------------------------
    // GET VIDEOS FOR USER ID
    // ---------------------------
    public List<VideoDto> getVideosForUserId(Long userId) {
        User uploader = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Video> videos = videoRepository.findAllByUploader(
                uploader,
                org.springframework.data.domain.Sort.by("dateUpload").descending());

        List<Long> videoIds = videos.stream().map(Video::getId).toList();
        
        Map<Long, Long> likeCountsMap = new HashMap<>();
        if (!videoIds.isEmpty()) {
            List<Object[]> rows = videoLikeRepository.countLikesForVideoIds(videoIds);
            for (Object[] row : rows) {
                likeCountsMap.put((Long) row[0], (Long) row[1]);
            }
        }

        return videos.stream()
                .map(video -> VideoDto.builder()
                        .id(video.getId())
                        .title(video.getTitle())
                        .uploaderUsername(uploader.getUsername())
                        .uploaderId(uploader.getId())
                        .category(video.getCategory())
                        .dateUpload(video.getDateUpload())
                        .filename(video.getFilename())
                        .thumbnailUrl(video.getThumbnailUrl())
                        .likesCount(likeCountsMap.getOrDefault(video.getId(), 0L).intValue())
                        .commentsCount(video.getCommentsCount())
                        .likedByCurrentUser(false)
                        .build())
                .toList();
    }

    // ---------------------------
    // GET VIDEOS FOR USERNAME
    // ---------------------------
    public List<VideoDto> getVideosForUser(String username) {
        User uploader = userService.findUserByUsernameCached(username);
        if (uploader == null) {
            throw new RuntimeException("User not found");
        }

        List<Video> videos = videoRepository.findAllByUploader(
                uploader,
                org.springframework.data.domain.Sort.by("dateUpload").descending());

        List<Long> videoIds = videos.stream()
                .map(Video::getId)
                .toList();

        Map<Long, Long> likeCountsMap = new HashMap<>();
        if (!videoIds.isEmpty()) {
            List<Object[]> rows = videoLikeRepository.countLikesForVideoIds(videoIds);
            for (Object[] row : rows) {
                Long videoId = (Long) row[0];
                Long count = (Long) row[1];
                likeCountsMap.put(videoId, count);
            }
        }

        return videos.stream()
                .map(video -> VideoDto.builder()
                        .id(video.getId())
                        .title(video.getTitle())
                        .uploaderUsername(uploader.getUsername())
                        .uploaderId(uploader.getId())
                        .category(video.getCategory())
                        .dateUpload(video.getDateUpload())
                        .filename(video.getFilename())
                        .thumbnailUrl(video.getThumbnailUrl())
                        .likesCount(likeCountsMap.getOrDefault(video.getId(), 0L).intValue())
                        .commentsCount(video.getCommentsCount())
                        .likedByCurrentUser(false)
                        .build())
                .toList();
    }

    // ---------------------------
    // IS UPLOADER (pour @PreAuthorize)
    // ---------------------------
    public boolean isUploader(Long videoId, String username) {
        return videoRepository.findById(videoId)
                .map(v -> v.getUploader().getUsername().equals(username))
                .orElse(false);
    }

    // ✅ UPLOAD ASYNC
    @Async
    @Transactional
    public CompletableFuture<Video> uploadVideoAsync(MultipartFile file, String title, String category, String username) {
        try {
            if (file.isEmpty()) {
                throw new IllegalArgumentException("Fichier vide");
            }

            if (file.getSize() > 100 * 1024 * 1024) {
                throw new IllegalArgumentException("Fichier trop volumineux");
            }

            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("video/")) {
                throw new IllegalArgumentException("Format non supporté");
            }

            User uploader = userService.findUserByUsernameCached(username);
            if (uploader == null) {
                throw new RuntimeException("User not found");
            }

            String original = StringUtils.cleanPath(file.getOriginalFilename());
            if (original.isEmpty())
                throw new IOException("Fichier invalide");

            String ext = original.contains(".")
                    ? original.substring(original.lastIndexOf("."))
                    : "";

            String filename = System.currentTimeMillis() + "_" + uploader.getUsername() + ext;

            Path path = Paths.get(uploadDir);
            if (!Files.exists(path))
                Files.createDirectories(path);

            try (InputStream is = file.getInputStream()) {
                Files.copy(is, path.resolve(filename), StandardCopyOption.REPLACE_EXISTING);
            }

            Video video = new Video();
            video.setTitle(title);
            video.setCategory(category);
            video.setFilename(filename);
            video.setDateUpload(LocalDateTime.now());
            video.setUploader(uploader);
            video.setThumbnailUrl("thumbnails/default.png");
            video.setLikesCount(0);
            video.setCommentsCount(0);
            video.setStatus(VideoStatus.PROCESSING);

            Video savedVideo = videoRepository.save(video);

            System.out.println("📹 Vidéo #" + savedVideo.getId() + " uploadée");

            thumbnailService.generateThumbnailAsync(savedVideo.getId(), filename);
            videoOptimizationService.optimizeVideoForMobile(savedVideo.getId(), filename);

            return CompletableFuture.completedFuture(savedVideo);

        } catch (Exception e) {
            System.err.println("❌ Erreur upload async: " + e.getMessage());
            return CompletableFuture.failedFuture(e);
        }
    }

    // ✅ PAGINATION: Vidéos par user
    // @Cacheable(value = "profileVideos", key = "#username + '-' + #pageable.pageNumber")  // ✅ COMMENTÉ EN DEV
    public Page<VideoDto> getVideosForUserPaginated(String username, Pageable pageable) {
        User uploader = userService.findUserByUsernameCached(username);
        if (uploader == null) {
            throw new RuntimeException("User not found");
        }

        Page<Video> videos = videoRepository.findAllByUploader(uploader, pageable);
        
        List<Long> videoIds = videos.getContent().stream()
            .map(Video::getId)
            .toList();
        
        Map<Long, Long> likeCountsMap = new HashMap<>();
        if (!videoIds.isEmpty()) {
            List<Object[]> rows = videoLikeRepository.countLikesForVideoIds(videoIds);
            for (Object[] row : rows) {
                likeCountsMap.put((Long) row[0], (Long) row[1]);
            }
        }

        return videos.map(video -> VideoDto.builder()
            .id(video.getId())
            .title(video.getTitle())
            .uploaderUsername(uploader.getUsername())
            .uploaderId(uploader.getId())
            .category(video.getCategory())
            .dateUpload(video.getDateUpload())
            .filename(video.getFilename())
            .thumbnailUrl(video.getThumbnailUrl())
            .likesCount(likeCountsMap.getOrDefault(video.getId(), 0L).intValue())
            .commentsCount(video.getCommentsCount())
            .likedByCurrentUser(false)
            .build()
        );
    }
}