package com.footballdemo.football_family.controller;




import com.footballdemo.football_family.dto.CommentDto;
import com.footballdemo.football_family.dto.LikeResult;
import com.footballdemo.football_family.model.User;
import com.footballdemo.football_family.service.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.boot.autoconfigure.thymeleaf.ThymeleafAutoConfiguration;
import org.springframework.boot.autoconfigure.context.MessageSourceAutoConfiguration;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(
        value = VideoController.class,
        excludeAutoConfiguration = {
                ThymeleafAutoConfiguration.class,
                MessageSourceAutoConfiguration.class
        }
)
@AutoConfigureMockMvc(addFilters = true)
@Import(RestExceptionHandler.class)
public class VideoControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean private VideoService videoService;
    @MockBean private UserService userService;
    @MockBean private CommentService commentService;
    @MockBean private FileStorageService fileStorageService;
    @MockBean private UserDetailsService userDetailsService;
    @MockBean private SimpMessagingTemplate messagingTemplate;
    @MockBean private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    // =================== DELETE VIDEO ===================
    @Test
    @WithMockUser(username = "testUser")
    void testDeleteVideoREST_success() throws Exception {
        Long videoId = 42L;
        when(videoService.isUploader(videoId, "testUser")).thenReturn(true);
        doNothing().when(videoService).deleteVideo(videoId);

        mockMvc.perform(delete("/videos/{videoId}", videoId).with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Vidéo supprimée avec succès"));

        verify(videoService, times(1)).deleteVideo(videoId);
    }

   @Test
@WithMockUser(username = "hacker")
void testDeleteVideoREST_notUploader_shouldReturnForbidden() throws Exception {
    when(videoService.isUploader(anyLong(), anyString())).thenReturn(false);

    mockMvc.perform(delete("/videos/{videoId}", 1L).with(csrf()))
           .andExpect(status().isForbidden()); // 403
}

 @Test
    @WithMockUser(username = "testUser")
    void testDeleteVideoREST_serviceError() throws Exception {
        Long videoId = 99L;
        when(videoService.isUploader(videoId, "testUser")).thenReturn(true);
        doThrow(new RuntimeException("Video not found")).when(videoService).deleteVideo(videoId);

        mockMvc.perform(delete("/videos/{videoId}", videoId).with(csrf()))
                .andExpect(status().isInternalServerError()) // <-- CORRECTION : Attendre 500
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Video not found"));

        verify(videoService, times(1)).deleteVideo(videoId);
    }

    // =================== LIKE VIDEO ===================
    @Test
    @WithMockUser(username = "liker")
    void testLikeVideo_success() throws Exception {
        Long videoId = 5L;
        LikeResult mockResult = new LikeResult(15L, true);

        when(videoService.toggleLike(videoId, "liker")).thenReturn(mockResult);

        mockMvc.perform(post("/videos/{videoId}/like", videoId).with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").value(15L));
    }
@Test
    @WithMockUser(username = "liker")
    void testLikeVideo_videoNotFound_shouldReturnError() throws Exception {
        Long videoId = 99L;
        
        // <-- CORRECTION : Simuler l'exception spécifique
        doThrow(new VideoNotFoundException("Vidéo introuvable")).when(videoService).toggleLike(videoId, "liker");

        mockMvc.perform(post("/videos/{videoId}/like", videoId).with(csrf()))
                .andExpect(status().isOk()) // Le RestExceptionHandler retourne 200 OK
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Vidéo introuvable"))
                .andExpect(jsonPath("$.data").value(0L));
    }

    // =================== UPLOAD VIDEO ===================
    @Test
    void testShowUploadForm_unauthenticated() throws Exception {
        mockMvc.perform(get("/videos/upload"))
                .andExpect(status().is3xxRedirection())
                .andExpect(redirectedUrlPattern("**/oauth2/authorization/github"));
    }

    @Test
    @WithMockUser(username = "testUser")
    void testUploadVideo_success() throws Exception {
        MockMultipartFile mockFile = new MockMultipartFile(
                "file", "test.mp4", "video/mp4", "some video content".getBytes()
        );
        User mockUser = new User();
        mockUser.setUsername("testUser");
        when(userService.getUserByUsername("testUser")).thenReturn(Optional.of(mockUser));

        mockMvc.perform(multipart("/videos/upload")
                .file(mockFile)
                .param("title", "My Test Video")
                .param("category", "Test")
                .with(csrf()))
                .andExpect(status().is3xxRedirection())
                .andExpect(redirectedUrl("/videos/list"));

        verify(videoService, times(1)).saveVideo(any());
    }

    @Test
    @WithMockUser(username = "testUser")
    void testUploadVideo_emptyFile() throws Exception {
        MockMultipartFile emptyFile = new MockMultipartFile("file", "", "video/mp4", new byte[0]);

        mockMvc.perform(multipart("/videos/upload")
                .file(emptyFile)
                .param("title", "Test")
                .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(view().name("video-upload"))
                .andExpect(model().attributeExists("error"));

        verify(videoService, never()).saveVideo(any());
    }

    // =================== COMMENT ===================
    @Test
    @WithMockUser(username = "commenter")
    void testAddComment_success() throws Exception {
        Long videoId = 1L;
        String content = "Great video!";
        CommentDto mockCommentDto = new CommentDto(1L, content, "commenter", LocalDateTime.now());

        when(commentService.addComment(videoId, content, "commenter")).thenReturn(mockCommentDto);

        mockMvc.perform(post("/videos/{videoId}/comment", videoId)
                .contentType("application/json")
                .content("{\"content\": \"" + content + "\"}")
                .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content").value(content));
    }

    @Test
    @WithMockUser(username = "commenter")
    void testDeleteComment_success() throws Exception {
        Long commentId = 1L;
        when(commentService.isAuthor(commentId, "commenter")).thenReturn(true);

        mockMvc.perform(delete("/videos/comments/{commentId}", commentId).with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(commentService, times(1)).deleteComment(commentId, "commenter");
    }
}

