package com.footballdemo.football_family.service;




import com.footballdemo.football_family.model.Video;
import com.footballdemo.football_family.model.VideoLike;
import com.footballdemo.football_family.model.User;
import com.footballdemo.football_family.repository.VideoLikeRepository;
import com.footballdemo.football_family.repository.VideoRepository;
import com.footballdemo.football_family.repository.FollowRepository;
import com.footballdemo.football_family.repository.VideoRepository.VideoFeedProjection;
import com.footballdemo.football_family.dto.LikeResult;
import com.footballdemo.football_family.dto.VideoDto;
import com.footballdemo.football_family.dto.VideoStatsUpdateDto;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Sort;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.util.StringUtils;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class VideoService {

    private final VideoRepository videoRepository;
    private final VideoLikeRepository videoLikeRepository;
    private final UserService userService;
    private final FollowRepository followRepository;

    private final SimpMessagingTemplate messagingTemplate;
    
    @Value("${videos.upload.dir}")
    private String uploadDir;

   public VideoService(VideoRepository videoRepository,
                    VideoLikeRepository videoLikeRepository,
                    UserService userService,
                    FollowRepository followRepository,
                    // 🎯 Assurez-vous d'avoir SimpMessagingTemplate dans les paramètres :
                    SimpMessagingTemplate messagingTemplate) { 
    
    this.videoRepository = videoRepository;
    this.videoLikeRepository = videoLikeRepository;
    this.userService = userService;
    this.followRepository = followRepository;
    
    // 🎯 LIGNE MANQUANTE (ou non assignée) : Initialisation du champ final
    this.messagingTemplate = messagingTemplate; 
}

    // --- Mapping projection → DTO
    private List<VideoDto> mapToVideoDtoList(Page<VideoFeedProjection> videosPage, String username) {
        User currentUser = (username != null && !username.equals("anonymousUser"))
        ? userService.findUserByUsernameCached(username).orElse(null) 
        : null;

        List<Long> videoIds = videosPage.getContent().stream()
                .map(VideoFeedProjection::getId)
                .collect(Collectors.toList());

        Map<Long, Boolean> likedStatusMap = new HashMap<>();
        if (currentUser != null && !videoIds.isEmpty()) {
            // Requête optimisée pour vérifier le statut de like par lots (pour N vidéos)
            List<VideoLike> likes = videoLikeRepository.findAllByUserAndVideoIdIn(currentUser, videoIds);
            likes.forEach(vl -> likedStatusMap.put(vl.getVideo().getId(), true));
        }

        return videosPage.getContent().stream()
                .map(p -> VideoDto.builder()
                        .id(p.getId())
                        .title(p.getTitle())
                        .uploaderUsername(p.getUploaderUsername())
                        .uploaderId(p.getUploaderId())
                        .category(p.getCategory())
                        .dateUpload(p.getDateUpload())
                        .filename(p.getFilename())
                        .thumbnailUrl(p.getThumbnailUrl())
                        .likesCount(p.getLikesCount())
                        .commentsCount(p.getCommentsCount())
                        .likedByCurrentUser(likedStatusMap.getOrDefault(p.getId(), false))
                        .build())
                .collect(Collectors.toList());
    }

    public void saveVideo(Video video) {
        videoRepository.save(video);
        evictFeedCache();
    }

    public Video getVideoById(Long id) {
        return videoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vidéo non trouvée avec l'ID : " + id));
    }

    @Transactional
    public void deleteVideo(Long videoId) {
        Video video = getVideoById(videoId);

        // Supprimer le fichier vidéo
        Path videoPath = Paths.get(uploadDir).resolve(video.getFilename());
        try { Files.deleteIfExists(videoPath); } catch (IOException ignored) {
            // Loggez l'erreur ici si le fichier n'a pas pu être supprimé
        }

        // Supprimer la miniature
        if (video.getThumbnailUrl() != null && !video.getThumbnailUrl().equals("default_video_placeholder.jpg")) {
            Path thumbPath = Paths.get(uploadDir).resolve(video.getThumbnailUrl());
            try { Files.deleteIfExists(thumbPath); } catch (IOException ignored) {
                 // Loggez l'erreur ici si le fichier n'a pas pu être supprimé
            }
        }

        // Supprimer en DB
        videoRepository.delete(video);
        evictFeedCache();
    }

    // --- Feed global (avec clé de cache distincte) ---
    @Cacheable(value = "videoFeed", key = "'global-' + #pageable.pageNumber + '-' + #username")
    public List<VideoDto> getFeedVideosForUser(Pageable pageable, String username) {
        Page<VideoFeedProjection> videosPage = videoRepository.findFeedProjectionOrderByDateUploadDesc(pageable);
        return mapToVideoDtoList(videosPage, username);
    }

    // --- Feed Personnalisé (Followed) (avec clé de cache distincte) ---
    @Cacheable(value = "videoFeed", key = "'followed-' + #username + '-' + #pageable.pageNumber")
    public List<VideoDto> getFollowedFeedVideosForUser(Pageable pageable, String username) {
        
        User currentUser = userService.findUserByUsernameCached(username)
                             .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé ou non connecté."));

        List<Long> followedUserIds = followRepository.findFollowingIdsByFollower(currentUser);
       
        if (followedUserIds.isEmpty()) {
            return List.of();
        }

        Page<VideoFeedProjection> videosPage = videoRepository.findFollowedFeedProjection(followedUserIds, pageable);

        return mapToVideoDtoList(videosPage, username);
    }
    
    // --- Likes : Pratiques haute performance/concurrence ---
// 🎯 CHANGEMENT 1 : Changer le type de retour de 'boolean' à 'long'

@Transactional
public LikeResult toggleLike(Long videoId, String username) {
    User user = userService.findUserByUsernameCached(username)
        .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

    Video video = videoRepository.findById(videoId)
        .orElseThrow(() -> new RuntimeException("Vidéo introuvable"));

    Optional<VideoLike> existing = videoLikeRepository.findByUserAndVideo(user, video);
    
    boolean isLikedNow; 

    if (existing.isPresent()) { 
        // Déjà liké → retirer le like
        videoLikeRepository.delete(existing.get());
        videoRepository.decrementLikesCount(videoId); 
        isLikedNow = false; 
    } else {
        // Pas encore liké → ajouter le like
        VideoLike like = new VideoLike();
        like.setUser(user);
        like.setVideo(video);
        videoLikeRepository.save(like);
        videoRepository.incrementLikesCount(videoId); 
        isLikedNow = true; 
    }

    long newLikeCount = videoRepository.getLikesCountById(videoId); 

   VideoStatsUpdateDto payload = new VideoStatsUpdateDto(
    videoId,
    newLikeCount,
    null,          // isLiked perso ne sert pas pour les autres
    null,          // commentaires pas concernés ici
    username       // 🚀 qui a fait l’action
);

messagingTemplate.convertAndSend("/topic/video/" + videoId, payload);

System.out.println("📢 [WS] Video " + videoId + " likes=" + newLikeCount + " (by " + username + ")");

    
    // ✅ Retourner le résultat complet pour l'utilisateur qui a cliqué
    return new LikeResult(newLikeCount, isLikedNow); 
}


    
    @Cacheable(value = "profileVideos", key = "#targetUser.username + '-' + #pageable.pageNumber")
    public Page<VideoDto> findVideosByUser(User targetUser, String viewerUsername, Pageable pageable) {
        
        if (targetUser == null) {
            return Page.empty(pageable);
        }

        // 1. CHERCHER LA PAGE DE VIDÉOS
        // La méthode findByUploader doit être optimisée dans VideoRepository
        Page<Video> videosPage = videoRepository.findByUploader(targetUser, pageable);

        // Initialisation
        List<Long> videoIds = videosPage.getContent().stream().map(Video::getId).collect(Collectors.toList());
        Map<Long, Boolean> likedMap = new HashMap<>();

        // 2. Calculer les likes
        if (viewerUsername != null && !viewerUsername.equals("anonymousUser") && !videoIds.isEmpty()) {
            userService.findUserByUsernameCached(viewerUsername).ifPresent(currentUser -> {
                List<VideoLike> likes = videoLikeRepository.findAllByUserAndVideoIdIn(currentUser, videoIds);
                likes.forEach(vl -> likedMap.put(vl.getVideo().getId(), true));
            });
        }

        // 3. Conversion
        return videosPage.map(v -> VideoDto.builder()
                .id(v.getId())
                .title(v.getTitle())
                .uploaderUsername(v.getUploader().getUsername())
                .uploaderId(v.getUploader().getId())
                .category(v.getCategory())
                .dateUpload(v.getDateUpload())
                .filename(v.getFilename())
                .thumbnailUrl(v.getThumbnailUrl())
                .likesCount(v.getLikesCount())
                .commentsCount(v.getCommentsCount())
                .likedByCurrentUser(likedMap.getOrDefault(v.getId(), false))
                .build());
    }

    @Transactional
    public Set<Long> getVideosToUpdateAndClear() {
        // Logique pour mettre à jour les statistiques/thumbnails
        List<Video> videos = videoRepository.findByDateUploadAfter(
                LocalDateTime.now().minusDays(1),
                Sort.by(Sort.Direction.DESC, "dateUpload")
        );

        videoRepository.saveAll(videos); 

        return videos.stream()
                .map(Video::getId)
                .collect(Collectors.toSet());
    }

    public Long countLikesForVideo(Long videoId) {
        return videoRepository.getLikesCountById(videoId);
    }
    
    /**
     * Utilisé par @PreAuthorize pour vérifier si l'utilisateur est bien l'uploader.
     * Pour les vérifications rapides, on pourrait utiliser une projection plus légère 
     * dans VideoRepository pour ne charger que l'ID de l'uploader.
     */
    public boolean isUploader(Long videoId, String username) {
        return videoRepository.findById(videoId)
            .map(video -> 
                video.getUploader() != null && video.getUploader().getUsername().equals(username))
            .orElse(false); 
    }

    @CacheEvict(value = "videoFeed", allEntries = true)
    public void evictFeedCache() { 
        // Invalide à la fois 'global-' et 'followed-'
    }
    
    // --- Méthode d'upload ---
    public Video uploadVideo(String title, String category, String username, MultipartFile file) throws IOException {
        User uploader = userService.findUserByUsernameCached(username)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé."));

        String filename = file.getOriginalFilename();
        String originalFilename = StringUtils.cleanPath(filename != null ? filename : ""); 
        
        if (originalFilename.isEmpty()) {
             throw new IOException("Nom de fichier original manquant ou non valide.");
        }

        // On prend la dernière partie après le dernier '.'
        String extension = originalFilename.lastIndexOf(".") != -1 
                           ? originalFilename.substring(originalFilename.lastIndexOf(".")) 
                           : ""; // Gère le cas sans extension
        
        String newFilename = System.currentTimeMillis() + "_" + uploader.getUsername() + extension;

        Path uploadPath = Paths.get(uploadDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }
        
        // Sauvegarde du fichier
        try (InputStream inputStream = file.getInputStream()) {
            Path filePath = uploadPath.resolve(newFilename);
            Files.copy(inputStream, filePath, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException ioe) {
            throw new IOException("Could not save video file: " + newFilename, ioe);
        }

        // Création de l'entité Video
        Video video = new Video();
        video.setTitle(title);
        video.setCategory(category);
        video.setFilename(newFilename);
        video.setThumbnailUrl("thumbnails/" + newFilename.replace(extension, ".png")); 
        video.setDateUpload(LocalDateTime.now());
        video.setUploader(uploader);
        video.setLikesCount(0);
        video.setCommentsCount(0);
        
        return videoRepository.save(video);
    }


}



