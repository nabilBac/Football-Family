package com.footballdemo.football_family.service;

import com.footballdemo.football_family.dto.LikeResponseDto;
import com.footballdemo.football_family.dto.VideoDto;
import com.footballdemo.football_family.model.User;
import com.footballdemo.football_family.model.Video;
import com.footballdemo.football_family.model.VideoLike;
import com.footballdemo.football_family.repository.*;
import com.footballdemo.football_family.repository.VideoRepository.VideoFeedProjection;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.util.*;

@Service("videoService")
@RequiredArgsConstructor
public class VideoService {

    private final VideoRepository videoRepository;
    private final VideoLikeRepository videoLikeRepository;
    private final UserService userService;
    private final FollowRepository followRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Value("${videos.upload.dir}")
    private String uploadDir;

    // ⭐ AUCUN CONSTRUCTEUR → Lombok s’occupe de tout

    // ---------------------------
    // FEED GLOBAL
    // ---------------------------

    public List<VideoDto> getFeedVideosForUser(Pageable pageable, String username) {

        Page<VideoFeedProjection> videosPage = videoRepository.findFeedProjectionOrderByDateUploadDesc(pageable);

        return mapToVideoDtoList(videosPage, username);
    }

    // ---------------------------
    // FEED PUBLIC
    // ---------------------------
   public List<VideoDto> getPublicFeedVideos(Pageable pageable) {
    return getFeedVideosForUser(pageable, null);
}


    // ---------------------------
    // FEED FOLLOWED
    // ---------------------------

    public List<VideoDto> getFollowedFeedVideosForUser(Pageable pageable, String username) {

       User currentUser = userService.getUserByUsername(username)
        .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé."));


        List<Long> followedIds = followRepository.findFollowingIdsByFollower(currentUser);

        if (followedIds.isEmpty())
            return List.of();

        Page<VideoFeedProjection> videosPage = videoRepository.findFollowedFeedProjection(followedIds, pageable);

        return mapToVideoDtoList(videosPage, username);
    }

    // ---------------------------
    // MAPPER → DTO
    private List<VideoDto> mapToVideoDtoList(Page<VideoRepository.VideoFeedProjection> page, String username) {

        // 1️⃣ utilisateur courant (ou null si anonyme)
      User currentUser = userService.findUserByUsernameCached(username);


        // 2️⃣ IDs des vidéos dans cette page
        List<Long> videoIds = page.getContent().stream()
                .map(VideoRepository.VideoFeedProjection::getId)
                .toList();

        if (videoIds.isEmpty()) {
            return List.of();
        }

        // 3️⃣ Map des vidéos likées par l'utilisateur courant : { videoId -> true }
        Map<Long, Boolean> likedMap = new HashMap<>();
        if (currentUser != null) {
            List<Long> likedIds = videoLikeRepository.findLikedVideoIdsByUserAndVideoIds(currentUser, videoIds);
            for (Long id : likedIds) {
                likedMap.put(id, true);
            }
        }

        // 4️⃣ Map des compteurs de likes réels par vidéo : { videoId -> count }
        Map<Long, Long> likeCountsMap = new HashMap<>();
        List<Object[]> rows = videoLikeRepository.countLikesForVideoIds(videoIds);
        for (Object[] row : rows) {
            Long videoId = (Long) row[0];
            Long count = (Long) row[1];
            likeCountsMap.put(videoId, count);
        }

        // 5️⃣ Construction des DTO (on n'utilise PLUS p.getLikesCount())
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

                        // ✅ VRAI compteur basé sur video_like
                        .likesCount(likeCountsMap.getOrDefault(p.getId(), 0L).intValue())

                        // ✅ Vrai état like pour l'utilisateur
                        .likedByCurrentUser(likedMap.getOrDefault(p.getId(), false))

                        .commentsCount(p.getCommentsCount())
                        .build())
                .toList();
    }

    // ---------------------------
    // LIKE / UNLIKE
    // ---------------------------
    @Transactional
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

        // ✅ NOUVELLE PARTIE : Notification WebSocket à tous les clients
        LikeResponseDto response = new LikeResponseDto(liked, count);

        // Créer un objet avec l'ID de la vidéo pour que le frontend sache quelle vidéo
        // update
        Map<String, Object> notification = new HashMap<>();
        notification.put("videoId", videoId);
        notification.put("liked", liked);
        notification.put("likesCount", count);
        notification.put("username", username);

        // Envoyer à tous les abonnés du topic /topic/likes
        messagingTemplate.convertAndSend("/topic/video/" + videoId + "/likes", notification);


        return response;
    }

    // ---------------------------
    // DELETE VIDEO
    // ---------------------------
    @Transactional
    @CacheEvict(value = "profileVideos", allEntries = true)
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

    @CacheEvict(value = "videoFeed", allEntries = true)
    public void evictFeedCache() {
    }

    // ---------------------------
    // UPLOAD VIDEO
    // ---------------------------
    public Video uploadVideo(MultipartFile file, String title, String category, String username)
            throws IOException {

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
        video.setThumbnailUrl("thumbnails/" + filename.replace(ext, ".png"));
        video.setLikesCount(0);
        video.setCommentsCount(0);

        String thumb = generateThumbnail(filename);
        if (thumb != null) {
            video.setThumbnailUrl(thumb);
        }

        return videoRepository.save(video);
    }

    public String generateThumbnail(String filename) {
        try {
            Path thumbDir = Paths.get(uploadDir, "thumbnails");
            Files.createDirectories(thumbDir);

            String output = filename.replace(".mp4", ".png");
            String fullOut = thumbDir.resolve(output).toString();

            String command = String.format(
                    "ffmpeg -i \"%s/%s\" -ss 00:00:02 -vframes 1 \"%s\"",
                    uploadDir, filename, fullOut);

            Process p = Runtime.getRuntime().exec(command);
            p.waitFor();

            return "thumbnails/" + output;

        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    public VideoDto getVideoById(Long id) {

        Video video = videoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vidéo introuvable : " + id));

        long likesCount = videoLikeRepository.countByVideo(video);

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
                .likedByCurrentUser(false) // pas utile ici
                .build();
    }

    public List<VideoDto> getVideosForUserId(Long userId) {

        User uploader = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        var list = videoRepository.findAllByUploader(
                uploader,
                org.springframework.data.domain.Sort.by("dateUpload").descending());

        return list.stream()
                .map(v -> {
                    long likesCount = videoLikeRepository.countByVideo(v);
                    return VideoDto.builder()
                            .id(v.getId())
                            .title(v.getTitle())
                            .uploaderUsername(uploader.getUsername())
                            .uploaderId(uploader.getId())
                            .category(v.getCategory())
                            .dateUpload(v.getDateUpload())
                            .filename(v.getFilename())
                            .thumbnailUrl(v.getThumbnailUrl())
                            .likesCount((int) likesCount)
                            .commentsCount(v.getCommentsCount())
                            .likedByCurrentUser(false)
                            .build();
                })
                .toList();
    }

    // ---------------------------
    // VIDÉOS D'UN UTILISATEUR (pour le profil SPA)
    // ---------------------------
    public List<VideoDto> getVideosForUser(String username) {

        // 1️⃣ Récupérer l'utilisateur
       User uploader = userService.findUserByUsernameCached(username);
if (uploader == null) {
    throw new RuntimeException("User not found");
}


        // 2️⃣ Récupérer les vidéos triées par date
        var videos = videoRepository.findAllByUploader(
                uploader,
                org.springframework.data.domain.Sort.by("dateUpload").descending());

        // 3️⃣ Mapper vers VideoDto (en recalculant les likes à partir de VideoLike)
        return videos.stream()
                .map(video -> {
                    long likesCount = videoLikeRepository.countByVideo(video);
                    // Ici, on ne calcule pas likedByCurrentUser (ce n'est pas nécessaire pour le
                    // profil simple)
                    return VideoDto.builder()
                            .id(video.getId())
                            .title(video.getTitle())
                            .uploaderUsername(uploader.getUsername())
                            .uploaderId(uploader.getId())
                            .category(video.getCategory())
                            .dateUpload(video.getDateUpload())
                            .filename(video.getFilename())
                            .thumbnailUrl(video.getThumbnailUrl())
                            .likesCount((int) likesCount)
                            .commentsCount(video.getCommentsCount())
                            .likedByCurrentUser(false) // la SPA pourra gérer ça plus tard si besoin
                            .build();
                })
                .toList();
    }

}
