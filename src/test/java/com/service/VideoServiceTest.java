package com.service;



import com.footballdemo.football_family.model.User;
import com.footballdemo.football_family.model.Video;
import com.footballdemo.football_family.model.VideoLike;
import com.footballdemo.football_family.repository.FollowRepository;
import com.footballdemo.football_family.repository.VideoLikeRepository;
import com.footballdemo.football_family.repository.VideoRepository;
import com.footballdemo.football_family.service.UserService;
import com.footballdemo.football_family.service.VideoService;
import com.footballdemo.football_family.dto.LikeResult;
import com.footballdemo.football_family.repository.VideoRepository.VideoFeedProjection;
import org.springframework.data.domain.Page;
import static org.mockito.ArgumentMatchers.anyList; // <-- LIGNE À AJOUTER


import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.cache.CacheManager;
import java.util.Comparator; // <-- LIGNE À AJOUTER

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class VideoServiceTest {

    @InjectMocks
    private VideoService videoService;

    @Mock
    private VideoRepository videoRepository;
    @Mock
    private VideoLikeRepository videoLikeRepository;
    @Mock
    private UserService userService;
    @Mock
    private FollowRepository followRepository;
    @Mock
    private SimpMessagingTemplate messagingTemplate;
    @Mock
    private CacheManager cacheManager; // Nécessaire pour les tests de cache (evictFeedCache)
    
    // Pour simuler l'upload de fichiers (nécessite une dépendance mock comme MockMultipartFile si vous ne l'avez pas déjà)
    @Mock
    private MultipartFile mockFile; 

    @Mock // <-- AJOUTER CE MOCK
    private VideoFeedProjection mockProjection;

    private User testUploader;
    private Video testVideo;

    private final Long VIDEO_ID = 1L;
    private final String USERNAME = "uploaderTest";
    private final String UPLOAD_DIR = "videos_temp_test"; // Répertoire temporaire pour les tests

    @BeforeEach
    void setUp() {
        // Initialiser le chemin d'upload dans le service via Reflection
        // C'est nécessaire car @Value n'est pas résolu dans les tests unitaires classiques
        ReflectionTestUtils.setField(videoService, "uploadDir", UPLOAD_DIR);

        testUploader = new User();
        testUploader.setUsername(USERNAME);
        testUploader.setId(1L);

        testVideo = new Video();
        testVideo.setId(VIDEO_ID);
        testVideo.setUploader(testUploader);
        testVideo.setFilename("test_video.mp4");
        testVideo.setThumbnailUrl("thumbnails/test_video.png");
        testVideo.setLikesCount(5);
        testVideo.setCommentsCount(2);

        // Crée un répertoire temporaire pour l'upload (si vous testez l'upload/delete des fichiers réels)
        try {
            Files.createDirectories(Paths.get(UPLOAD_DIR));
        } catch (IOException e) {
            // Ignorer ou logger, mais ce répertoire doit exister pour les tests de fichiers.
        }
    }

    // --- Tests de sécurité (isUploader) ---

    @Test
    void testIsUploader_shouldReturnTrueForAuthor() {
        // ARRANGE
        when(videoRepository.findById(VIDEO_ID)).thenReturn(Optional.of(testVideo));
        
        // ACT & ASSERT
        assertTrue(videoService.isUploader(VIDEO_ID, USERNAME), 
                   "Doit retourner true si l'utilisateur est l'uploader.");
    }

    @Test
    void testIsUploader_shouldReturnFalseForOtherUser() {
        // ARRANGE
        when(videoRepository.findById(VIDEO_ID)).thenReturn(Optional.of(testVideo));
        
        // ACT & ASSERT
        assertFalse(videoService.isUploader(VIDEO_ID, "hackerUser"), 
                    "Doit retourner false si l'utilisateur n'est pas l'uploader.");
    }
    
    // --- Test d'upload ---
    
    @Test
    void testUploadVideo_shouldSaveFileAndDatabaseEntry() throws IOException {
        // ARRANGE
        final String TITLE = "Ma super video";
        final String CATEGORY = "Football";
        final String ORIGINAL_FILENAME = "mon_match.mp4";
        
        when(userService.findUserByUsernameCached(USERNAME)).thenReturn(Optional.of(testUploader));
        
        // Simuler le comportement du fichier
        when(mockFile.getOriginalFilename()).thenReturn(ORIGINAL_FILENAME);
        when(mockFile.getInputStream()).thenReturn(new java.io.ByteArrayInputStream(new byte[100]));
        
        // Simuler la sauvegarde en base (renvoie l'objet qu'il reçoit)
        when(videoRepository.save(any(Video.class))).thenAnswer(i -> {
            Video savedVideo = i.getArgument(0);
            savedVideo.setId(VIDEO_ID); // Assigner un ID pour simuler la BDD
            return savedVideo;
        });

        // ACT
        Video result = videoService.uploadVideo(TITLE, CATEGORY, USERNAME, mockFile);

        // ASSERTIONS
        assertNotNull(result, "La vidéo retournée ne doit pas être null.");
        assertEquals(TITLE, result.getTitle());
        assertEquals(CATEGORY, result.getCategory());
        assertEquals(USERNAME, result.getUploader().getUsername());
        
        // Vérifications Mockito
        verify(userService, times(1)).findUserByUsernameCached(USERNAME);
        verify(videoRepository, times(1)).save(any(Video.class));
        
        // Vérifier que le nom de fichier généré contient l'extension .mp4 et le nom d'utilisateur
        assertTrue(result.getFilename().endsWith(".mp4"));
        assertTrue(result.getFilename().contains(USERNAME));

        // Note: La vérification de la création du fichier réel est complexe avec Mockito. 
        // On se base ici sur le fait que Files.copy est appelé sans erreur.
    }
    
    // --- Test de suppression ---

    
    // --- Tests de Toggle Like ---
    
    @Test
    void testToggleLike_shouldAddLikeAndIncrementCounter() {
        // ARRANGE
        long initialLikes = testVideo.getLikesCount();
        
        when(videoRepository.findById(VIDEO_ID)).thenReturn(Optional.of(testVideo));
        when(userService.findUserByUsernameCached(USERNAME)).thenReturn(Optional.of(testUploader));
        // Simuler que le like n'existe pas encore
        when(videoLikeRepository.findByUserAndVideo(testUploader, testVideo)).thenReturn(Optional.empty()); 
        // Simuler le nouveau compteur de likes après l'incrémentation
        when(videoRepository.getLikesCountById(VIDEO_ID)).thenReturn(initialLikes + 1);

        // ACT
        LikeResult result = videoService.toggleLike(VIDEO_ID, USERNAME);

       // ASSERTIONS
    // Correction 1 (déjà discutée) : isLikedNow() -> isLiked()
    assertTrue(result.isLikedNow(), "Le résultat doit indiquer que le like a été ajouté.");
    
    // Correction 2 : getNewLikesCount() -> finalLikesCount()
    assertEquals(initialLikes + 1, result.finalLikesCount(), "Le compteur doit être incrémenté de 1.");

        // VÉRIFICATIONS CRITIQUES
        verify(videoLikeRepository, times(1)).save(any(VideoLike.class)); // 1. Ajout de l'entité Like
        verify(videoRepository, times(1)).incrementLikesCount(VIDEO_ID); // 2. Incrémentation atomique
        
        // 3. Notification WebSocket (CORRIGÉ pour utiliser any(Object.class)!)
        verify(messagingTemplate, times(1))
                .convertAndSend(eq("/topic/video/" + VIDEO_ID), any(Object.class));
    }
    
    @Test
    void testToggleLike_shouldRemoveLikeAndDecrementCounter() {
        // ARRANGE
        long initialLikes = testVideo.getLikesCount();
        VideoLike existingLike = new VideoLike(); // Utilise le constructeur par défaut
        existingLike.setUser(testUploader);     // Définit l'utilisateur
        existingLike.setVideo(testVideo);
        
        when(videoRepository.findById(VIDEO_ID)).thenReturn(Optional.of(testVideo));
        when(userService.findUserByUsernameCached(USERNAME)).thenReturn(Optional.of(testUploader));
        // Simuler que le like existe déjà
        when(videoLikeRepository.findByUserAndVideo(testUploader, testVideo)).thenReturn(Optional.of(existingLike)); 
        // Simuler le nouveau compteur de likes après la décrémentation
        when(videoRepository.getLikesCountById(VIDEO_ID)).thenReturn(initialLikes - 1);

        // ACT
        LikeResult result = videoService.toggleLike(VIDEO_ID, USERNAME);

       // ASSERTIONS
    // Correction 1 : isLikedNow() -> isLiked()
    assertFalse(result.isLikedNow(), "Le résultat doit indiquer que le like a été retiré.");
    
    // Correction 2 : getNewLikesCount() -> finalLikesCount()
    assertEquals(initialLikes - 1, result.finalLikesCount(), "Le compteur doit être décrémenté de 1.");
        verify(videoLikeRepository, times(1)).delete(existingLike); // 1. Suppression de l'entité Like
        verify(videoRepository, times(1)).decrementLikesCount(VIDEO_ID); // 2. Décrémentation atomique
        
        // 3. Notification WebSocket
        verify(messagingTemplate, times(1))
                .convertAndSend(eq("/topic/video/" + VIDEO_ID), any(Object.class));
    }
    
    // --- Autres tests d'erreur sur Toggle Like ---
    
    @Test
    void testToggleLike_shouldThrowExceptionOnMissingVideo() {
        // ARRANGE
        when(videoRepository.findById(VIDEO_ID)).thenReturn(Optional.empty());
        when(userService.findUserByUsernameCached(USERNAME)).thenReturn(Optional.of(testUploader));

        // ACT & ASSERT
        assertThrows(RuntimeException.class, () -> {
            videoService.toggleLike(VIDEO_ID, USERNAME);
        }, "Doit lever une RuntimeException si la vidéo est introuvable.");

        // VÉRIFICATIONS CRITIQUES
        verify(videoLikeRepository, never()).save(any(VideoLike.class));
        verify(videoRepository, never()).incrementLikesCount(anyLong());
        verify(messagingTemplate, never()).convertAndSend(anyString(), any(Object.class));
    }
    
    // Ajoutez ici les tests pour 'getFeedVideosForUser' et 'getFollowedFeedVideosForUser' (plus complexes à cause de Pageable et VideoFeedProjection)
    
    // CLEANUP : Supprimer le dossier temporaire après les tests de fichiers
    //@AfterAll // Utiliser @AfterAll si vous voulez que ce soit exécuté une seule fois
    @Test // Peut être exécuté comme un test de nettoyage temporaire si @AfterAll ne fonctionne pas bien.
    void cleanUpTestDirectory() throws IOException {
        Path uploadPath = Paths.get(UPLOAD_DIR);
        if (Files.exists(uploadPath)) {
            // Supprimer tous les fichiers à l'intérieur puis le répertoire lui-même
            Files.walk(uploadPath)
                 .sorted(Comparator.reverseOrder())
                 .map(Path::toFile)
                 .forEach(java.io.File::delete);
        }
    }

    // --- Tests de Feed Global ---
@Test
void testGetFeedVideosForUser_shouldReturnGlobalFeed() {
    // ARRANGE
    // 1. Simuler les objets nécessaires
    org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(0, 10);
    
    // 2. Simuler les données de projection
    when(mockProjection.getId()).thenReturn(VIDEO_ID);
    when(mockProjection.getTitle()).thenReturn("Global Video Title");
    when(mockProjection.getUploaderUsername()).thenReturn(USERNAME);
   when(mockProjection.getLikesCount()).thenReturn(Integer.valueOf(100));

    // 3. Simuler le comportement de la couche Repository (retourne une page contenant la projection mockée)
    Page<VideoFeedProjection> mockPage = new org.springframework.data.domain.PageImpl<>(
        java.util.List.of(mockProjection), pageable, 1L
    );
    when(videoRepository.findFeedProjectionOrderByDateUploadDesc(pageable)).thenReturn(mockPage);

    // 4. Simuler l'utilisateur courant (pour le statut 'liked')
    when(userService.findUserByUsernameCached(USERNAME)).thenReturn(Optional.of(testUploader));
    // Simuler le statut de like (non liké pour ce test)
  // APRÈS (Meilleure pratique Mockito) :
when(videoLikeRepository.findAllByUserAndVideoIdIn(any(User.class), anyList()))
    .thenReturn(java.util.Collections.emptyList()); // Utilisation de emptyList() pour garantir le type de retour List<VideoLike>
    // ACT
    java.util.List<com.footballdemo.football_family.dto.VideoDto> result = 
        videoService.getFeedVideosForUser(pageable, USERNAME);

    // ASSERT
    assertFalse(result.isEmpty());
    assertEquals(1, result.size());
    assertEquals("Global Video Title", result.get(0).getTitle());
    assertFalse(result.get(0).isLikedByCurrentUser());

    // VÉRIFICATIONS
    verify(videoRepository, times(1)).findFeedProjectionOrderByDateUploadDesc(pageable);
    verify(userService, times(1)).findUserByUsernameCached(USERNAME);
}

// --- Tests de Feed Suivi (Followed) ---
@Test
void testGetFollowedFeedVideosForUser_shouldReturnVideosFromFollowedUsers() {
    // ARRANGE
    org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(0, 10);
    final Long FOLLOWED_USER_ID = 2L;

    // Simuler un utilisateur suivi
    java.util.List<Long> followedIds = java.util.List.of(FOLLOWED_USER_ID);
    
    // Simuler l'utilisateur courant
    when(userService.findUserByUsernameCached(USERNAME)).thenReturn(Optional.of(testUploader));
    
    // Simuler que l'utilisateur suit au moins quelqu'un
    when(followRepository.findFollowingIdsByFollower(testUploader)).thenReturn(followedIds);
    
    // Simuler les données de projection pour le feed
    when(mockProjection.getId()).thenReturn(VIDEO_ID + 1);
    when(mockProjection.getTitle()).thenReturn("Followed User Video");
    when(mockProjection.getUploaderId()).thenReturn(FOLLOWED_USER_ID);

    // Simuler la page retournée par le repository
    Page<VideoFeedProjection> mockPage = new org.springframework.data.domain.PageImpl<>(
        java.util.List.of(mockProjection), pageable, 1L
    );
    when(videoRepository.findFollowedFeedProjection(followedIds, pageable)).thenReturn(mockPage);

    // ACT
    java.util.List<com.footballdemo.football_family.dto.VideoDto> result = 
        videoService.getFollowedFeedVideosForUser(pageable, USERNAME);

    // ASSERT
    assertFalse(result.isEmpty());
    assertEquals("Followed User Video", result.get(0).getTitle());
    
    // VÉRIFICATIONS
    verify(followRepository, times(1)).findFollowingIdsByFollower(testUploader);
    verify(videoRepository, times(1)).findFollowedFeedProjection(followedIds, pageable);
}

@Test
void testGetFollowedFeedVideosForUser_shouldReturnEmptyListIfNoFollowedUsers() {
    // ARRANGE
    org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(0, 10);
    
    // Simuler l'utilisateur courant
    when(userService.findUserByUsernameCached(USERNAME)).thenReturn(Optional.of(testUploader));
    
    // Simuler que l'utilisateur ne suit personne
    when(followRepository.findFollowingIdsByFollower(testUploader)).thenReturn(java.util.List.of());

    // ACT
    java.util.List<com.footballdemo.football_family.dto.VideoDto> result = 
        videoService.getFollowedFeedVideosForUser(pageable, USERNAME);

    // ASSERT
    assertTrue(result.isEmpty());
    
    // VÉRIFICATIONS
    verify(followRepository, times(1)).findFollowingIdsByFollower(testUploader);
    // VÉRIFICATION CRITIQUE : Assurez-vous que la méthode du repository n'est jamais appelée
    verify(videoRepository, never()).findFollowedFeedProjection(any(), any());
}

@Test
void testGetFeedVideosForUser_shouldHandleLikedStatusCorrectly() {
    // ARRANGE
    org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(0, 10);
    
    // 1. Simuler l'utilisateur courant
    when(userService.findUserByUsernameCached(USERNAME)).thenReturn(Optional.of(testUploader));
    
    // 2. Simuler les données de projection (DOIT AVOIR LE MÊME ID QUE LE LIKE)
    when(mockProjection.getId()).thenReturn(VIDEO_ID);
    when(mockProjection.getTitle()).thenReturn("Liked Video Title");
    when(mockProjection.getUploaderUsername()).thenReturn(USERNAME);
    when(mockProjection.getLikesCount()).thenReturn(Integer.valueOf(100));

    Page<VideoFeedProjection> mockPage = new org.springframework.data.domain.PageImpl<>(
        java.util.List.of(mockProjection), pageable, 1L
    );
    when(videoRepository.findFeedProjectionOrderByDateUploadDesc(pageable)).thenReturn(mockPage);

    // 3. Simuler le statut de like : L'utilisateur a LIKÉ la vidéo
    VideoLike likedEntry = new VideoLike();
    likedEntry.setVideo(testVideo); // Assurez-vous que l'ID de la vidéo correspond au mockProjection.getId()
    
    // Simuler le retour du repository de likes : il trouve le like
    when(videoLikeRepository.findAllByUserAndVideoIdIn(any(User.class), anyList()))
        .thenReturn(java.util.List.of(likedEntry)); 

    // ACT
    java.util.List<com.footballdemo.football_family.dto.VideoDto> result = 
        videoService.getFeedVideosForUser(pageable, USERNAME);

    // ASSERT
    assertFalse(result.isEmpty());
    assertEquals(1, result.size());
    // VÉRIFICATION CLÉ
    assertTrue(result.get(0).isLikedByCurrentUser(), "isLikedByCurrentUser doit être true si le like existe.");
    
    // VÉRIFICATIONS
    verify(videoRepository, times(1)).findFeedProjectionOrderByDateUploadDesc(pageable);
    verify(videoLikeRepository, times(1)).findAllByUserAndVideoIdIn(any(User.class), anyList());
}

@Test
void testGetFollowedFeedVideosForUser_shouldHandleLikedStatusCorrectly() {
    // ARRANGE
    org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(0, 10);
    final Long FOLLOWED_USER_ID = 2L;
    final Long VIDEO_IN_FEED_ID = 10L; 
    
    java.util.List<Long> followedIds = java.util.List.of(FOLLOWED_USER_ID);
    
    // 1. Simuler l'utilisateur courant et les suivis
    when(userService.findUserByUsernameCached(USERNAME)).thenReturn(Optional.of(testUploader));
    when(followRepository.findFollowingIdsByFollower(testUploader)).thenReturn(followedIds);
    
    // 2. Simuler les données de projection
    when(mockProjection.getId()).thenReturn(VIDEO_IN_FEED_ID);
    when(mockProjection.getTitle()).thenReturn("Liked Followed Video");
    when(mockProjection.getUploaderId()).thenReturn(FOLLOWED_USER_ID);
    
    Page<VideoFeedProjection> mockPage = new org.springframework.data.domain.PageImpl<>(
        java.util.List.of(mockProjection), pageable, 1L
    );
    when(videoRepository.findFollowedFeedProjection(followedIds, pageable)).thenReturn(mockPage);
    
    // 3. Simuler le statut de like : L'utilisateur a LIKÉ la vidéo
    Video likedEntry = new Video();
    likedEntry.setId(VIDEO_IN_FEED_ID);
    VideoLike likedLikeEntry = new VideoLike();
    likedLikeEntry.setVideo(likedEntry); 
    
    when(videoLikeRepository.findAllByUserAndVideoIdIn(any(User.class), anyList()))
        .thenReturn(java.util.List.of(likedLikeEntry)); 

    // ACT
    java.util.List<com.footballdemo.football_family.dto.VideoDto> result = 
        videoService.getFollowedFeedVideosForUser(pageable, USERNAME);

    // ASSERT
    assertFalse(result.isEmpty());
    // VÉRIFICATION CLÉ
    assertTrue(result.get(0).isLikedByCurrentUser(), 
               "Le statut 'isLikedByCurrentUser' doit être true pour une vidéo likée du feed des suivis.");
    
    // VÉRIFICATIONS
    verify(videoRepository, times(1)).findFollowedFeedProjection(followedIds, pageable);
    verify(videoLikeRepository, times(1)).findAllByUserAndVideoIdIn(any(User.class), anyList());
}

@Test
void testDeleteVideo_shouldDeleteDatabaseEntryAndFiles() throws IOException {
    // ARRANGE
    // Créer des fichiers bidon dans le répertoire de test
    Path videoPath = Paths.get(UPLOAD_DIR, testVideo.getFilename());
    Path thumbPath = Paths.get(UPLOAD_DIR, testVideo.getThumbnailUrl());

    Files.createDirectories(thumbPath.getParent());
    
    Files.createFile(videoPath);
    Files.createFile(thumbPath);
    
    when(videoRepository.findById(VIDEO_ID)).thenReturn(Optional.of(testVideo));

    // AJOUT: Mocker l'objet Cache et son comportement (clear)
    // On suppose que le cache pour le feed s'appelle "feedVideos"
    org.springframework.cache.Cache mockCache = mock(org.springframework.cache.Cache.class);
    when(cacheManager.getCache("feedVideos")).thenReturn(mockCache);

    // ACT
    videoService.deleteVideo(VIDEO_ID);

    // ASSERTIONS
    verify(videoRepository, times(1)).delete(testVideo);

    // VÉRIFICATION CRITIQUE DU CACHE
    verify(cacheManager, times(1)).getCache("feedVideos"); 
    verify(mockCache, times(1)).clear(); // Vérifie que la méthode clear a été appelée sur le cache

    // Vérification de la suppression des fichiers (IMPORTANT)
    assertFalse(Files.exists(videoPath), "Le fichier vidéo doit avoir été supprimé.");
    assertFalse(Files.exists(thumbPath), "Le fichier miniature doit avoir été supprimé.");
}
}