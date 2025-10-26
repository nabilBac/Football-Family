/*package com.service; // PACKAGE CORRIGÉ ET CORRECT !

import com.footballdemo.football_family.model.Comment;
import com.footballdemo.football_family.model.User;
import com.footballdemo.football_family.model.Video;
import com.footballdemo.football_family.repository.CommentRepository;
import com.footballdemo.football_family.repository.UserRepository;
import com.footballdemo.football_family.repository.VideoRepository;
import com.footballdemo.football_family.service.CommentService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.invocation.InvocationOnMock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.stubbing.Answer;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
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

    // --- Tests de sécurité ---
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

    // --- Tests d'ajout de commentaire ---
    @Test
    void testAddComment_shouldIncrementCounterAtomically() {
        when(videoRepository.findById(VIDEO_ID)).thenReturn(Optional.of(testVideo));
        when(userRepository.findByUsername(USERNAME)).thenReturn(Optional.of(testUser));

        when(commentRepository.save(any(Comment.class))).thenAnswer(new Answer<Comment>() {
            @Override
            public Comment answer(InvocationOnMock invocation) throws Throwable {
                Comment commentArg = invocation.getArgument(0);
                if (commentArg.getId() == null) commentArg.setId(COMMENT_ID);
                if (commentArg.getCreatedAt() == null) commentArg.setCreatedAt(LocalDateTime.now());
                return commentArg;
            }
        });

        long newCount = testVideo.getCommentsCount() + 1;
        when(videoRepository.getCommentsCountById(VIDEO_ID)).thenReturn(newCount);

        Map<String, Object> result = commentService.addComment(VIDEO_ID, COMMENT_CONTENT, USERNAME);

        verify(videoRepository, times(1)).incrementCommentsCount(VIDEO_ID);

        // ✅ Ici on précise Object pour lever l'ambiguïté
        verify(messagingTemplate, times(1))
                .convertAndSend(eq("/topic/videos/" + VIDEO_ID + "/comments"), any(Object.class));

        assertEquals(newCount, result.get("commentCount"));

        @SuppressWarnings("unchecked")
        Map<String, Object> commentPayload = (Map<String, Object>) result.get("comment");
        assertNotNull(commentPayload.get("createdAt"));
        assertEquals(COMMENT_ID, commentPayload.get("commentId"));
    }

    // --- Tests de suppression de commentaire ---
    @Test
    void testDeleteComment_shouldDecrementCounterAtomically() {
        when(commentRepository.findById(COMMENT_ID)).thenReturn(Optional.of(testComment));
        long newCount = testVideo.getCommentsCount() - 1;
        when(videoRepository.getCommentsCountById(VIDEO_ID)).thenReturn(newCount);

        Map<String, Object> result = commentService.deleteComment(COMMENT_ID, USERNAME);

        verify(videoRepository, times(1)).decrementCommentsCount(VIDEO_ID);
        verify(commentRepository, times(1)).delete(testComment);

        verify(messagingTemplate, times(1))
                .convertAndSend(eq("/topic/videos/" + VIDEO_ID + "/comments"), any(Object.class));

        assertEquals(newCount, result.get("commentCount"));
    }
}*/
