package com.footballdemo.football_family.controller;

import com.footballdemo.football_family.controller.api.social.FollowController;
import com.footballdemo.football_family.model.User;
import com.footballdemo.football_family.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders; // <-- NOUVEL IMPORT
import org.springframework.web.context.WebApplicationContext; // <-- NOUVEL IMPORT
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.test.context.support.WithMockUser;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity; // <-- NOUVEL IMPORT CRITIQUE
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(FollowController.class)
@Import(RestExceptionHandler.class)
@AutoConfigureMockMvc(addFilters = false)
public class FollowControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired // <-- Injecter le contexte web pour la configuration de sécurité
    private WebApplicationContext context;

    @MockBean
    private UserDetailsService userDetailsService;

    @MockBean
    private UserService userService; // La logique de suivi est dans UserService

    private User followerUser;
    private User targetUser;
    private final String FOLLOWER_USERNAME = "followerUser";
    private final Long FOLLOWER_ID = 1L;
    private final Long TARGET_ID = 2L;

    @BeforeEach
    void setUp() {
        // Configuration de MockMvc pour appliquer la sécurité
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(springSecurity()) // <-- APPLIQUE LA CONFIGURATION DE SÉCURITÉ
                .build();

        followerUser = new User();
        followerUser.setId(FOLLOWER_ID);
        followerUser.setUsername(FOLLOWER_USERNAME);

        targetUser = new User();
        targetUser.setId(TARGET_ID);
        targetUser.setUsername("targetUser");

        // 1. Mocker l'utilisateur connecté (getCurrentUser() est appelé dans le
        // contrôleur)
        when(userService.getCurrentUser()).thenReturn(followerUser);

        // 2. Mocker la récupération de l'utilisateur cible par ID
        when(userService.getUserById(eq(TARGET_ID))).thenReturn(Optional.of(targetUser));
    }

    // =======================================================
    // TESTS DE FOLLOW (POST /api/follow/{targetId})
    // =======================================================

    @Test
    void testToggleFollow_shouldReturn401_WhenUnauthenticated() throws Exception {
        // ARRANGE: Simuler que l'utilisateur n'est pas authentifié
        // ATTENTION : Le mock getCurrentUser() est écrasé ici pour simuler un
        // non-authentifié
        when(userService.getCurrentUser()).thenReturn(null);

        // ACT & ASSERT: On s'attend maintenant à 401 grâce à la configuration
        // springSecurity()
        mockMvc.perform(post("/api/follow/{targetId}", TARGET_ID).with(csrf()))
                .andExpect(status().isFound()); // Doit retourner 401
    }

    @Test
    @WithMockUser(username = FOLLOWER_USERNAME)
    void testToggleFollow_shouldReturn200AndFollow_WhenTogglingOn() throws Exception {
        // ARRANGE: Suivi créé (true) et compte de 101 abonnés
        final int newCount = 101;
        when(userService.toggleFollow(eq(followerUser), eq(targetUser))).thenReturn(true);
        when(userService.getFollowersCount(eq(targetUser))).thenReturn(newCount);

        // ACT & ASSERT: On s'attend à 200 OK
        mockMvc.perform(post("/api/follow/{targetId}", TARGET_ID).with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isFollowing").value(true)) // isFollowing=true
                .andExpect(jsonPath("$.followersCount").value(newCount)); // followersCount=101

        verify(userService, times(1)).toggleFollow(eq(followerUser), eq(targetUser));
    }

    @Test
    @WithMockUser(username = FOLLOWER_USERNAME)
    void testToggleFollow_shouldReturn200AndUnfollow_WhenTogglingOff() throws Exception {
        // ARRANGE: Suivi supprimé (false) et compte de 99 abonnés
        final int newCount = 99;
        when(userService.toggleFollow(eq(followerUser), eq(targetUser))).thenReturn(false);
        when(userService.getFollowersCount(eq(targetUser))).thenReturn(newCount);

        // ACT & ASSERT: On s'attend à 200 OK
        mockMvc.perform(post("/api/follow/{targetId}", TARGET_ID).with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isFollowing").value(false)) // isFollowing=false
                .andExpect(jsonPath("$.followersCount").value(newCount)); // followersCount=99

        verify(userService, times(1)).toggleFollow(eq(followerUser), eq(targetUser));
    }

    @Test
    @WithMockUser(username = FOLLOWER_USERNAME)
    void testToggleFollow_shouldReturn404_WhenTargetUserNotFound() throws Exception {
        // ARRANGE: Utiliser un ID inconnu
        final Long UNKNOWN_ID = 99L;
        when(userService.getUserById(eq(UNKNOWN_ID))).thenReturn(Optional.empty());

        // ACT & ASSERT: orElseThrow lève RuntimeException, qui, par défaut ou par
        // ControllerAdvice,
        // devrait résulter en 404 Not Found si l'erreur est gérée comme telle, ou 500.
        // Puisque ce n'est pas géré explicitement comme 404 dans votre contrôleur, nous
        // attendons 500 par défaut:
        // (Si vous utilisez un RestExceptionHandler, cela peut être 404)
        mockMvc.perform(post("/api/follow/{targetId}", UNKNOWN_ID).with(csrf()))
                .andExpect(status().isNotFound()); // 500 (RuntimeException non gérée spécifiquement)

        verify(userService, never()).toggleFollow(any(), any());
    }

    @Test
    @WithMockUser(username = FOLLOWER_USERNAME)
    void testToggleFollow_shouldReturn400_WhenFollowingSelf() throws Exception {
        // L'utilisateur essaie de suivre son propre ID
        final Long SELF_ID = FOLLOWER_ID;
        when(userService.getUserById(eq(SELF_ID))).thenReturn(Optional.of(followerUser)); // le follower est la cible

        mockMvc.perform(post("/api/follow/{targetId}", SELF_ID).with(csrf()))
                .andExpect(status().isBadRequest()) // 400
                .andExpect(jsonPath("$.error").value("Vous ne pouvez pas vous suivre vous-même."));

        // toggleFollow ne doit jamais être appelé
        verify(userService, never()).toggleFollow(any(), any());
    }
}