package com.footballdemo.football_family.service;






import com.footballdemo.football_family.model.Video;
import com.footballdemo.football_family.model.VideoLike;
import com.footballdemo.football_family.model.User;
import com.footballdemo.football_family.repository.VideoLikeRepository;
import com.footballdemo.football_family.repository.VideoRepository;
import com.footballdemo.football_family.repository.FollowRepository;
import com.footballdemo.football_family.repository.VideoRepository.VideoFeedProjection;
import org.springframework.security.access.AccessDeniedException; // 👈 AJOUTER CET IMPORT
import jakarta.persistence.EntityNotFoundException; //


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


@Service("videoService")
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
                    SimpMessagingTemplate messagingTemplate
                    ) { 
    
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
// ✅ CORRECTION CRUCIALE : Ajout de l'invalidation du cache du profil
@CacheEvict(value = "profileVideos", allEntries = true) 
public void deleteVideo(Long videoId, String uploaderUsername) throws IOException {
        
        // 1. Récupération et vérification de l'existence
        Video video = videoRepository.findById(videoId)
            // Lève une exception si la vidéo n'existe pas (gérée par le contrôleur)
            .orElseThrow(() -> new EntityNotFoundException("Vidéo introuvable avec ID: " + videoId));

        // 2. Vérification des Droits (Renforcement de sécurité)
        if (!video.getUploader().getUsername().equals(uploaderUsername)) {
            // Lève une exception d'accès refusé (gérée par le contrôleur)
            throw new AccessDeniedException("L'utilisateur n'est pas l'auteur de cette vidéo.");
        }

        String videoFilename = video.getFilename();
        String thumbnailFilename = video.getThumbnailUrl(); 
        
        // 3. Suppression des fichiers physiques (avant la BDD)
        try {
            deleteFile(videoFilename);
            // La miniature est souvent dans un sous-dossier, on récupère juste le nom du fichier.
            // On gère aussi le cas où thumbnailUrl est un placeholder.
            if (thumbnailFilename != null && !thumbnailFilename.equals("default_video_placeholder.jpg")) {
                // On extrait juste le nom du fichier s'il est au format "thumbnails/nom.png"
                String filenameOnly = thumbnailFilename.contains("/") ? 
                                      thumbnailFilename.substring(thumbnailFilename.lastIndexOf("/") + 1) : 
                                      thumbnailFilename;
                deleteFile("thumbnails/" + filenameOnly); // Utilise le chemin relatif correct
            }
        } catch (IOException e) {
            // Si la suppression du fichier échoue (droit, fichier manquant...), 
            // on logue et on relance, mais on peut continuer à supprimer l'entrée DB
            System.err.println("🔴 Erreur lors de la suppression des fichiers de la vidéo " + videoId + ": " + e.getMessage());
            // Nous lançons l'exception pour que le contrôleur puisse la gérer
            throw new IOException("Erreur lors de la suppression des fichiers de la vidéo.", e);
        }

        // 4. Suppression de l'enregistrement en base de données
        videoRepository.delete(video);
        
        // 5. Invalidation du cache de feed
        evictFeedCache(); // Utiliser la méthode dédiée pour la clarté.
        // ou la logique que vous aviez : 
        // org.springframework.cache.Cache feedCache = cacheManager.getCache("videoFeed");
        // if (feedCache != null) { feedCache.clear(); }
    }

    /**
     * Méthode utilitaire pour supprimer un fichier (y compris les miniatures dans le sous-dossier 'thumbnails').
     * @param relativePath Le chemin relatif du fichier à partir de ${videos.upload.dir} (ex: "nom_video.mp4" ou "thumbnails/nom_thumb.png")
     */
    private void deleteFile(String relativePath) throws IOException {
        if (relativePath != null && !relativePath.isEmpty()) {
            Path fileStorageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
            Path targetFile = fileStorageLocation.resolve(relativePath).normalize();
            
            // Sécurité anti-traversal : s'assurer que le chemin est bien dans le répertoire d'upload.
            if (!targetFile.startsWith(fileStorageLocation)) {
                throw new IOException("Tentative d'accès illégal : " + relativePath);
            }
            
            if (Files.exists(targetFile)) {
                Files.delete(targetFile);
                System.out.println("✅ Fichier supprimé : " + relativePath);
            } else {
                System.out.println("⚠️ Fichier non trouvé (mais poursuite de l'opération) : " + relativePath);
            }
        }
    }

    // --- Feed global (avec clé de cache distincte) ---
   @Cacheable(value = "videoFeed", key = "'global-' + #pageable.pageNumber + '-' + #username")
public List<VideoDto> getFeedVideosForUser(Pageable pageable, String username) {
    // 🔍 LOG 1
    System.out.println("📹 [SERVICE] getFeedVideosForUser appelé pour : " + username);
    
    Page<VideoFeedProjection> videosPage = videoRepository.findFeedProjectionOrderByDateUploadDesc(pageable);
    
    // 🔍 LOG 2
    System.out.println("📹 [SERVICE] Projections récupérées : " + videosPage.getTotalElements());
    
    List<VideoDto> result = mapToVideoDtoList(videosPage, username);
    
    // 🔍 LOG 3
    System.out.println("📹 [SERVICE] DTOs mappés : " + result.size());
    
    return result;
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
            .map(video -> {
                String uploaderName = video.getUploader() != null ? video.getUploader().getUsername() : null;
                boolean match = uploaderName != null && uploaderName.equalsIgnoreCase(username);
                System.out.println("🔍 [isUploader] videoId=" + videoId +
                                   ", uploader=" + uploaderName +
                                   ", principal=" + username +
                                   " -> " + match);
                return match;
            })
            .orElseGet(() -> {
                System.out.println("⚠️ [isUploader] Vidéo introuvable : " + videoId);
                return false;
            });
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

        // 🔹 Génération de la miniature immédiatement
String thumbnailPath = generateThumbnail(newFilename);
video.setThumbnailUrl(thumbnailPath != null ? thumbnailPath : "default_video_placeholder.jpg");
        
        return videoRepository.save(video);
    }

     public void regenerateThumbnails() {
    List<Video> videos = videoRepository.findAll();
    for (Video video : videos) {
        String thumbnail = generateThumbnail(video.getFilename());
        video.setThumbnailUrl(thumbnail != null ? thumbnail : "default_video_placeholder.jpg");
        System.out.println("Miniature régénérée pour " + video.getTitle() + " -> " + video.getThumbnailUrl());
    }
    videoRepository.saveAll(videos);
}


    public String generateThumbnail(String videoFilename) {
    String videoPath = uploadDir + "/" + videoFilename;
    String thumbnailFilename = videoFilename.substring(0, videoFilename.lastIndexOf(".")) + ".png";
    String thumbnailPath = uploadDir + "/thumbnails/" + thumbnailFilename;

    try {
        Path thumbDir = Paths.get(uploadDir, "thumbnails");
        if (!Files.exists(thumbDir)) Files.createDirectories(thumbDir);

        String command = String.format(
            "ffmpeg -i \"%s\" -ss 00:00:05 -vframes 1 \"%s\"",
            videoPath,
            thumbnailPath
        );

        Process process = Runtime.getRuntime().exec(command);
        process.waitFor();

        return "thumbnails/" + thumbnailFilename;
    } catch (IOException | InterruptedException e) {
        e.printStackTrace();
        return null;
    }
}



}



