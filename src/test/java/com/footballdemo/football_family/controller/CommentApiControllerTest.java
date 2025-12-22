package com.footballdemo.football_family.controller;

import com.footballdemo.football_family.controller.api.comments.CommentApiController;
import com.footballdemo.football_family.service.CommentService; // Importez votre service
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;

import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.doNothing;

import static org.mockito.Mockito.when;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import java.security.Principal;

// Assurez-vous que cette classe correspond au contrôleur réel !
@WebMvcTest(CommentApiController.class)
@AutoConfigureMockMvc(addFilters = false) // <-- désactive Spring Security si besoin
class CommentApiControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private CommentService commentService;

    @Test
    void testDeleteComment_success() throws Exception {
        // Simule un utilisateur connecté
        String username = "testUser";
        Principal mockPrincipal = () -> username;

        // Mock du comportement du service
        doNothing().when(commentService).deleteComment(1L, username);
        when(commentService.isAuthor(1L, username)).thenReturn(true);

        // Exécution du DELETE
        mockMvc.perform(delete("/api/comments/1").principal(mockPrincipal))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Commentaire supprimé"));
    }
}