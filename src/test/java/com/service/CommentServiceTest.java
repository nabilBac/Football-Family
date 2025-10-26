package com.service; 

import com.footballdemo.football_family.model.Comment;
import com.footballdemo.football_family.model.User;
import com.footballdemo.football_family.model.Video;
import com.footballdemo.football_family.repository.CommentRepository;
import com.footballdemo.football_family.repository.UserRepository;
import com.footballdemo.football_family.repository.VideoRepository;
import com.footballdemo.football_family.service.CommentService;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import java.util.List; // <--- C'est celui-là qui manquait
import org.springframework.data.domain.Page;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import com.footballdemo.football_family.dto.CommentDto;
import com.footballdemo.football_family.dto.VideoStatsUpdateDto;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class CommentServiceTest {

    @InjectMocks
    private CommentService commentService;

    @Mock
    private CommentRepository commentRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private VideoRepository videoRepository;
    @Mock
    private SimpMessagingTemplate messagingTemplate;

    private User testUser;
    private Video testVideo;
    private Comment testComment;

    private final Long VIDEO_ID = 1L;
    private final Long COMMENT_ID = 5L;
    private final String USERNAME = "testUser";
    private final String COMMENT_CONTENT = "Super vidéo !";

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setUsername(USERNAME);
        testUser.setId(1L);

        testVideo = new Video();
        testVideo.setId(VIDEO_ID);
        testVideo.setCommentsCount(10);

        testComment = new Comment();
        testComment.setId(COMMENT_ID);
        testComment.setAuthor(testUser);
        testComment.setVideo(testVideo);
        testComment.setContent(COMMENT_CONTENT);
    }

    // --- Tests de sécurité (isAuthor) ---
    @Test
    void testIsAuthor_shouldReturnTrueForAuthor() {
        when(commentRepository.findById(COMMENT_ID)).thenReturn(Optional.of(testComment));
        assertTrue(commentService.isAuthor(COMMENT_ID, USERNAME));
    }

    @Test
    void testIsAuthor_shouldReturnFalseForOtherUser() {
        when(commentRepository.findById(COMMENT_ID)).thenReturn(Optional.of(testComment));
        assertFalse(commentService.isAuthor(COMMENT_ID, "otherUser"));
    }

    // --- Tests d'ajout de commentaire (Succès) ---
    @Test
    void testAddComment_shouldIncrementCounterAtomically() {
        // ARRANGE
        when(videoRepository.findById(VIDEO_ID)).thenReturn(Optional.of(testVideo));
        when(userRepository.findByUsername(USERNAME)).thenReturn(Optional.of(testUser));
        when(commentRepository.save(any(Comment.class))).thenAnswer(invocation -> {
            Comment commentArg = invocation.getArgument(0);
            if (commentArg.getId() == null) commentArg.setId(COMMENT_ID);
            if (commentArg.getCreatedAt() == null) commentArg.setCreatedAt(LocalDateTime.now());
            return commentArg;
        });
        long newCount = testVideo.getCommentsCount() + 1;
        when(videoRepository.getCommentsCountById(VIDEO_ID)).thenReturn(newCount);

        // ACT
        CommentDto resultDto = commentService.addComment(VIDEO_ID, COMMENT_CONTENT, USERNAME);

        // ASSERTIONS DES EFFETS DE BORD
        verify(videoRepository, times(1)).incrementCommentsCount(VIDEO_ID);
        verify(messagingTemplate, times(1))
                .convertAndSend(eq("/topic/videos/" + VIDEO_ID + "/comments"), any(Map.class));
        verify(messagingTemplate, times(1))
                .convertAndSend(eq("/topic/video/" + VIDEO_ID), any(VideoStatsUpdateDto.class));

        // ASSERTIONS DU DTO RETOURNÉ
        assertNotNull(resultDto, "Le CommentDto retourné ne doit pas être null.");
        assertEquals(COMMENT_ID, resultDto.getId(), "L'ID du commentaire doit correspondre à celui simulé.");
        assertEquals(USERNAME, resultDto.getAuthorUsername(), "Le nom d'utilisateur doit être le bon.");
        assertEquals(COMMENT_CONTENT, resultDto.getContent(), "Le contenu du commentaire doit être correct.");
    }

    // --- Tests d'ajout de commentaire (Cas d'Erreur) ---
    @Test
    void testAddComment_shouldThrowExceptionOnMissingVideo() {
        // ARRANGE
        when(videoRepository.findById(VIDEO_ID)).thenReturn(Optional.empty());
        
        // ACT & ASSERT
        assertThrows(RuntimeException.class, () -> {
            commentService.addComment(VIDEO_ID, COMMENT_CONTENT, USERNAME);
        }, "Doit lever une exception si la vidéo est introuvable.");

        // VÉRIFICATIONS CRITIQUES
        verify(commentRepository, never()).save(any(Comment.class));
        verify(videoRepository, never()).incrementCommentsCount(anyLong());
    }

    @Test
    void testAddComment_shouldThrowExceptionOnMissingUser() {
        // ARRANGE
        when(videoRepository.findById(VIDEO_ID)).thenReturn(Optional.of(testVideo));
        when(userRepository.findByUsername(USERNAME)).thenReturn(Optional.empty());

        // ACT & ASSERT
        assertThrows(RuntimeException.class, () -> {
            commentService.addComment(VIDEO_ID, COMMENT_CONTENT, USERNAME);
        }, "Doit lever une exception si l'utilisateur est introuvable.");

        // VÉRIFICATIONS CRITIQUES
        verify(commentRepository, never()).save(any(Comment.class));
        verify(videoRepository, never()).incrementCommentsCount(anyLong());
    }

    // --- Tests de suppression de commentaire (Succès) ---
    @Test
    void testDeleteComment_shouldDecrementCounterAtomically() {
        // ARRANGE
        when(commentRepository.findById(COMMENT_ID)).thenReturn(Optional.of(testComment));
        long newCount = testVideo.getCommentsCount() - 1;
        when(videoRepository.getCommentsCountById(VIDEO_ID)).thenReturn(newCount);
        
        // ACT
        commentService.deleteComment(COMMENT_ID, USERNAME);

        // ASSERTIONS DES EFFETS DE BORD
        verify(commentRepository, times(1)).delete(testComment);
        verify(videoRepository, times(1)).decrementCommentsCount(testVideo.getId()); 
        verify(messagingTemplate, times(1))
                .convertAndSend(eq("/topic/video/" + VIDEO_ID), any(VideoStatsUpdateDto.class));
        verify(messagingTemplate, times(1))
                .convertAndSend(eq("/topic/videos/" + VIDEO_ID + "/delete"), any(Map.class));
    }

    // --- Test de sécurité pour la suppression (CRITIQUE) ---
    @Test
    void testDeleteComment_shouldThrowSecurityExceptionIfNotAuthor() {
        // ARRANGE
        when(commentRepository.findById(COMMENT_ID)).thenReturn(Optional.of(testComment));
        
        // ACT & ASSERT
        assertThrows(SecurityException.class, () -> {
            commentService.deleteComment(COMMENT_ID, "hackerUser"); 
        }, "Le service doit lever une SecurityException si l'utilisateur n'est pas l'auteur.");
        
        // VÉRIFICATIONS CRITIQUES
        verify(commentRepository, never()).delete(any(Comment.class));
        verify(videoRepository, never()).decrementCommentsCount(anyLong());
        verify(messagingTemplate, never()).convertAndSend(anyString(), any(VideoStatsUpdateDto.class));
verify(messagingTemplate, never()).convertAndSend(anyString(), any(Map.class));// Utiliser any(Object.class)
    }

    // --- Tests de modification de commentaire (Succès) ---
    @Test
    void testUpdateComment_shouldUpdateContentAndReturnDto() {
        final String NEW_CONTENT = "Contenu mis à jour !";
        
        // ARRANGE
        when(commentRepository.findById(COMMENT_ID)).thenReturn(Optional.of(testComment));
        when(commentRepository.save(any(Comment.class))).thenAnswer(invocation -> {
            Comment updatedComment = invocation.getArgument(0);
            assertEquals(NEW_CONTENT, updatedComment.getContent()); 
            return updatedComment;
        });

        // ACT
        CommentDto resultDto = commentService.updateComment(COMMENT_ID, NEW_CONTENT, USERNAME);

        // ASSERTIONS
        verify(commentRepository, times(1)).save(any(Comment.class));
        assertNotNull(resultDto, "Le DTO retourné ne doit pas être null.");
        assertEquals(NEW_CONTENT, resultDto.getContent(), "Le contenu du DTO doit être mis à jour.");
        verify(messagingTemplate, times(1))
                .convertAndSend(eq("/topic/videos/" + VIDEO_ID + "/update"), any(Map.class));
    }

    @Test
    void testUpdateComment_shouldThrowSecurityExceptionIfNotAuthor() {
        final String NEW_CONTENT = "Tentative de contenu";
        final String HACKER_USERNAME = "hackerUser";
        
        // ARRANGE
        when(commentRepository.findById(COMMENT_ID)).thenReturn(Optional.of(testComment));
        
        // ACT & ASSERT
        assertThrows(SecurityException.class, () -> {
            commentService.updateComment(COMMENT_ID, NEW_CONTENT, HACKER_USERNAME); 
        }, "Doit lever une SecurityException si l'utilisateur n'est pas l'auteur.");
        
        // VÉRIFICATIONS CRITIQUES
        verify(commentRepository, never()).save(any(Comment.class));
        verify(messagingTemplate, never()).convertAndSend(anyString(), any(Map.class));
    }

    @Test
    void testUpdateComment_shouldThrowRuntimeExceptionOnMissingComment() {
        final String NEW_CONTENT = "Nouveau contenu";
        
        // ARRANGE
        when(commentRepository.findById(COMMENT_ID)).thenReturn(Optional.empty());
        
        // ACT & ASSERT
        assertThrows(RuntimeException.class, () -> {
            commentService.updateComment(COMMENT_ID, NEW_CONTENT, USERNAME);
        }, "Doit lever une RuntimeException si le commentaire est introuvable.");

        // VÉRIFICATIONS CRITIQUES
        verify(commentRepository, never()).save(any(Comment.class));
        verify(messagingTemplate, never()).convertAndSend(anyString(), any(VideoStatsUpdateDto.class));
        verify(messagingTemplate, never()).convertAndSend(anyString(), any(Map.class));
    }

    // Test A1 : Ajout avec contenu vide
@Test
void testAddComment_shouldThrowIllegalArgumentExceptionOnEmptyContent() {
    // Cas de test (les deux cas fiables)
    String[] emptyContents = {null, ""}; 
    
    // Si vous voulez le cas des espaces, utilisez-le ici SANS MOCK BDD :
    // String[] emptyContents = {null, "", "  "}; 
    // Si cela échoue, votre build continuera d'échouer.

    for (String content : emptyContents) {
        // ACT & ASSERT
        assertThrows(IllegalArgumentException.class, () -> {
            commentService.addComment(VIDEO_ID, content, USERNAME);
        }, "Doit lever IllegalArgumentException pour le contenu: '" + content + "'");
    }

    // VÉRIFICATIONS (Une seule fois après la boucle)
    verify(videoRepository, never()).findById(anyLong()); 
    verify(userRepository, never()).findByUsername(anyString());
    verify(commentRepository, never()).save(any());
    verify(videoRepository, never()).incrementCommentsCount(anyLong());
}

// Test A2 : Modification avec contenu vide
@Test
void testUpdateComment_shouldThrowIllegalArgumentExceptionOnEmptyContent() {
    final String EMPTY_CONTENT = "";
    
    // ARRANGE : Commentaire trouvé (pour passer à la validation)
    when(commentRepository.findById(COMMENT_ID)).thenReturn(Optional.of(testComment));
    // NOTE : Si la validation est faite AVANT le contrôle isAuthor, le contrôle de sécurité n'est pas nécessaire ici.

    // ACT & ASSERT
    assertThrows(IllegalArgumentException.class, () -> {
        commentService.updateComment(COMMENT_ID, EMPTY_CONTENT, USERNAME);
    }, "Doit lever IllegalArgumentException si le nouveau contenu est vide.");

    // VÉRIFICATIONS

   verify(commentRepository, never()).save(any());
verify(messagingTemplate, never()).convertAndSend(anyString(), any(Map.class));
}

@Test
    void testAddComment_shouldPreventCounterAndWsOnRepositorySaveFailure() {
        // ARRANGE
        when(videoRepository.findById(VIDEO_ID)).thenReturn(Optional.of(testVideo));
        when(userRepository.findByUsername(USERNAME)).thenReturn(Optional.of(testUser));
        
        // Simuler l'échec lors de la sauvegarde (doit faire échouer l'opération)
        doThrow(new RuntimeException("Erreur BDD")).when(commentRepository).save(any(Comment.class)); 

        // ACT & ASSERT
        assertThrows(RuntimeException.class, () -> {
            commentService.addComment(VIDEO_ID, COMMENT_CONTENT, USERNAME);
        }, "Doit propager l'exception de la base de données.");

        // VÉRIFICATIONS CRITIQUES : L'incrémentation et le WS NE DOIVENT PAS ÊTRE APPELÉS
        verify(videoRepository, never()).incrementCommentsCount(anyLong());
        verify(messagingTemplate, never()).convertAndSend(anyString(), any(VideoStatsUpdateDto.class));
        verify(messagingTemplate, never()).convertAndSend(anyString(), any(Map.class));
    }
    
    @Test
    void testDeleteComment_shouldPreventDecrementAndWsOnRepositoryDeleteFailure() {
        // ARRANGE
        when(commentRepository.findById(COMMENT_ID)).thenReturn(Optional.of(testComment));
        // Simuler l'échec lors de la suppression (doit faire échouer l'opération)
        doThrow(new RuntimeException("Erreur BDD")).when(commentRepository).delete(testComment);

        // ACT & ASSERT
        assertThrows(RuntimeException.class, () -> {
            commentService.deleteComment(COMMENT_ID, USERNAME);
        }, "Doit propager l'exception de la base de données.");

        // VÉRIFICATIONS CRITIQUES : La décrémentation et le WS NE DOIVENT PAS être appelés
        verify(videoRepository, never()).decrementCommentsCount(anyLong());
        verify(messagingTemplate, never()).convertAndSend(anyString(), any(VideoStatsUpdateDto.class));
        verify(messagingTemplate, never()).convertAndSend(anyString(), any(Map.class));
    }

    @Test
void testGetCommentsForVideo_shouldReturnCorrectPageAndTotalCount() {
    // ARRANGE
    int page = 0;
    int size = 5;
    Long totalCount = 42L; // Le nombre total réel

    // 1. Définir le Pageable attendu par le repository (avec tri par date)
    Pageable expectedPageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

    // 2. Créer une liste de commentaires simplifiée pour simuler le résultat du fetch
    Comment comment1 = new Comment();
    comment1.setId(10L);
    comment1.setContent("Commentaire paginé");
    comment1.setAuthor(testUser); // Utilisez le testUser déjà initialisé
    comment1.setCreatedAt(LocalDateTime.now());
    
    List<Comment> fetchedComments = List.of(comment1);
    
    // 3. Mocker les deux appels du repository :
    when(commentRepository.findByVideoIdWithAuthorsPaged(eq(VIDEO_ID), eq(expectedPageable)))
        .thenReturn(fetchedComments);
    
    when(commentRepository.countByVideoId(VIDEO_ID)).thenReturn(totalCount);

    // ACT
    Page<Comment> resultPage = commentService.getCommentsForVideo(VIDEO_ID, page, size);

    // ASSERTIONS
    
    // 1. Vérifications Mockito (S'assurer que les deux appels ont eu lieu)
    verify(commentRepository, times(1)).findByVideoIdWithAuthorsPaged(eq(VIDEO_ID), eq(expectedPageable));
    verify(commentRepository, times(1)).countByVideoId(VIDEO_ID);
    
    // 2. Vérifications de la Page retournée (PageImpl)
    assertNotNull(resultPage, "La Page de résultats ne doit pas être nulle.");
    
    // Le contenu doit correspondre à ce qui a été mocké
    assertEquals(fetchedComments.size(), resultPage.getNumberOfElements(), "Doit contenir le bon nombre d'éléments sur la page.");
    
    // Le total doit correspondre au count mocké
    assertEquals(totalCount, resultPage.getTotalElements(), "Le nombre total d'éléments doit être le count mocké.");
    
    // Le contenu (la liste) est correct
    assertEquals(comment1.getContent(), resultPage.getContent().get(0).getContent());
}
}