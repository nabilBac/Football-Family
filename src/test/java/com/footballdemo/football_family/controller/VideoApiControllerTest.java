package com.footballdemo.football_family.controller;



import com.fasterxml.jackson.databind.ObjectMapper;
import com.footballdemo.football_family.dto.CommentDto;
import com.footballdemo.football_family.dto.LikeResult;
import com.footballdemo.football_family.model.Comment;
import com.footballdemo.football_family.service.CommentService;
import com.footballdemo.football_family.service.UserService;
import com.footballdemo.football_family.service.VideoService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Page;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.security.Principal;
import java.util.*;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;

class VideoApiControllerTest {

    private CommentService commentService;
    private VideoService videoService;
    private UserService userService;
    private VideoApiController controller;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        commentService = mock(CommentService.class);
        videoService = mock(VideoService.class);
        userService = mock(UserService.class);
        controller = new VideoApiController(commentService, videoService, userService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                                 .setControllerAdvice(new RestExceptionHandler()) // Ajout de l'exception handler
                                 .build();
    }

    @Test
    void getComments_returnsCommentList() throws Exception {
        Long videoId = 1L;
        List<Comment> comments = List.of(new Comment(), new Comment());
        Page<Comment> commentPage = new PageImpl<>(comments, PageRequest.of(0, 5), 2);

        when(commentService.getCommentsForVideo(videoId, 0, 5)).thenReturn(commentPage);

        mockMvc.perform(get("/api/videos/{videoId}/comments", videoId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.comments", hasSize(2)))
                .andExpect(jsonPath("$.data.totalCount", is(2)));
    }

    @Test
    @WithMockUser(username = "testUser")
    void addComment_withValidPayload_returnsAddedComment() throws Exception {
        Long videoId = 1L;
        Map<String, String> payload = Map.of("content", "Super vidéo !");
        Comment comment = new Comment();
        comment.setContent("Super vidéo !");
        CommentDto commentDto = new CommentDto(comment);

        when(commentService.addComment(eq(videoId), eq("Super vidéo !"), eq("testUser"))).thenReturn(commentDto);

        ObjectMapper mapper = new ObjectMapper();

        mockMvc.perform(post("/api/videos/{videoId}/comment", videoId)
                        .principal((Principal) () -> "testUser") // Fournit le principal
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.content", is("Super vidéo !")));
    }

    @Test
    @WithMockUser(username = "testUser")
    void likeVideoApi_updatesLikesCount() throws Exception {
        Long videoId = 1L;
        LikeResult likeResult = mock(LikeResult.class);
        when(likeResult.finalLikesCount()).thenReturn(5L);
        when(videoService.toggleLike(videoId, "testUser")).thenReturn(likeResult);

        mockMvc.perform(post("/api/videos/{videoId}/like", videoId)
                        .principal((Principal) () -> "testUser"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", is(5)));
    }

    @Test
    @WithMockUser(username = "testUser")
    void addComment_withEmptyContent_throwsException() throws Exception {
        Long videoId = 1L;
        String emptyPayload = "{\"content\":\"\"}";

        mockMvc.perform(post("/api/videos/{videoId}/comment", videoId)
                        .principal((Principal) () -> "testUser")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(emptyPayload))
                .andExpect(status().isBadRequest())
                .andExpect(result -> {
                    Throwable ex = result.getResolvedException();
                    assertNotNull(ex);
                    assertTrue(ex instanceof IllegalArgumentException);
                    assertEquals("Le contenu du commentaire ne peut pas être vide.", ex.getMessage());
                });
    }

    @Test
    @WithMockUser(username = "testUser")
    void addComment_withNullContent_throwsException() throws Exception {
        Long videoId = 1L;
        String nullPayload = "{}";

        mockMvc.perform(post("/api/videos/{videoId}/comment", videoId)
                        .principal((Principal) () -> "testUser")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(nullPayload))
                .andExpect(status().isBadRequest())
                .andExpect(result -> {
                    Throwable ex = result.getResolvedException();
                    assertNotNull(ex);
                    assertTrue(ex instanceof IllegalArgumentException);
                    assertEquals("Le contenu du commentaire ne peut pas être vide.", ex.getMessage());
                });
    }
}

