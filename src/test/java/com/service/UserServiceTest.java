package com.service;



import com.footballdemo.football_family.model.Follow;
import com.footballdemo.football_family.model.User;
import com.footballdemo.football_family.repository.FollowRepository;
import com.footballdemo.football_family.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import com.footballdemo.football_family.service.UserService;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import static org.mockito.ArgumentMatchers.anyLong; 
import static org.mockito.ArgumentMatchers.anyString;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class UserServiceTest {

    @InjectMocks
    private UserService userService;

    // Mocks des dépendances (vos repositories)
    @Mock
    private UserRepository userRepository;
    @Mock
    private FollowRepository followRepository;
    // Note : Pour les tests complets, vous auriez besoin de mocker PasswordEncoder, etc.

    private User followerUser;
    private User targetUser;

    @BeforeEach
    void setUp() {
        followerUser = new User();
        followerUser.setId(1L);
        followerUser.setUsername("follower");

        targetUser = new User();
        targetUser.setId(2L);
        targetUser.setUsername("target");
    }

    // =======================================================
    // TESTS DE LA LOGIQUE DE SUIVI (toggleFollow)
    // =======================================================

    @Test
    void testToggleFollow_shouldCreateFollowWhenNoneExists() {
        // ARRANGE
        // 1. Simuler l'absence de relation de suivi
        when(followRepository.findByFollowerAndFollowing(followerUser, targetUser)).thenReturn(Optional.empty());

        // ACT
        boolean result = userService.toggleFollow(followerUser, targetUser);

        // ASSERTIONS
        assertTrue(result, "Doit retourner true car la relation FOLLOW a été créée.");
        
        // VÉRIFICATIONS MOCKITO
        // 1. On vérifie que la relation a été sauvegardée
        verify(followRepository, times(1)).save(any(Follow.class));
        // 2. On vérifie qu'il n'y a pas eu de suppression
        verify(followRepository, never()).delete(any(Follow.class));
    }
    
    @Test
    void testToggleFollow_shouldDeleteFollowWhenItExists() {
        // ARRANGE
        Follow existingFollow = new Follow();
        existingFollow.setFollower(followerUser);
        existingFollow.setFollowing(targetUser);
        
        // 1. Simuler l'existence de la relation
        when(followRepository.findByFollowerAndFollowing(followerUser, targetUser)).thenReturn(Optional.of(existingFollow));

        // ACT
        boolean result = userService.toggleFollow(followerUser, targetUser);

        // ASSERTIONS
        assertFalse(result, "Doit retourner false car la relation UNFOLLOW a été supprimée.");
        
        // VÉRIFICATIONS MOCKITO
        // 1. On vérifie que la relation a été supprimée
        verify(followRepository, times(1)).delete(existingFollow);
        // 2. On vérifie qu'il n'y a pas eu de création
        verify(followRepository, never()).save(any(Follow.class));
    }
    
    @Test
    void testToggleFollow_shouldThrowExceptionWhenFollowingSelf() {
        // ACT & ASSERT
        assertThrows(IllegalArgumentException.class, () -> {
            userService.toggleFollow(followerUser, followerUser);
        }, "Doit lancer une exception si un utilisateur tente de se suivre lui-même.");

        // VÉRIFICATION MOCKITO
        verify(followRepository, never()).findByFollowerAndFollowing(any(), any());
        verify(followRepository, never()).save(any());
        verify(followRepository, never()).delete(any());
    }
    
    // =======================================================
    // TESTS DE LA LOGIQUE DE COMPTAGE
    // =======================================================

    @Test
    void testGetFollowersCount_shouldReturnCorrectCount() {
        // ARRANGE
        final int expectedCount = 42;
        // Simuler le résultat du countByFollowing
        when(followRepository.countByFollowing(targetUser)).thenReturn((long) expectedCount);

        // ACT
        int result = userService.getFollowersCount(targetUser);

        // ASSERT
        assertEquals(expectedCount, result, "Le nombre d'abonnés doit correspondre au résultat du repository.");
        
        // VÉRIFICATION
        verify(followRepository, times(1)).countByFollowing(targetUser);
    }

    @Test
    void testGetFollowingCount_shouldReturnCorrectCount() {
        // ARRANGE
        final int expectedCount = 15;
        // Simuler le résultat du countByFollower
        when(followRepository.countByFollower(followerUser)).thenReturn((long) expectedCount);

        // ACT
        int result = userService.getFollowingCount(followerUser);

        // ASSERT
        assertEquals(expectedCount, result, "Le nombre d'abonnements doit correspondre au résultat du repository.");
        
        // VÉRIFICATION
        verify(followRepository, times(1)).countByFollower(followerUser);
    }
    
    // =======================================================
    // TESTS DE LA LOGIQUE DE VÉRIFICATION (isFollowing)
    // =======================================================
    
    @Test
    void testIsFollowing_shouldReturnTrueWhenFollowing() {
        // ARRANGE
        Follow existingFollow = new Follow();
        when(followRepository.findByFollowerAndFollowing(followerUser, targetUser)).thenReturn(Optional.of(existingFollow));

        // ACT
        boolean result = userService.isFollowing(followerUser, targetUser);

        // ASSERT
        assertTrue(result, "Doit retourner true si la relation de suivi existe.");
    }
    
    @Test
    void testIsFollowing_shouldReturnFalseWhenNotFollowing() {
        // ARRANGE
        when(followRepository.findByFollowerAndFollowing(followerUser, targetUser)).thenReturn(Optional.empty());

        // ACT
        boolean result = userService.isFollowing(followerUser, targetUser);

        // ASSERT
        assertFalse(result, "Doit retourner false si la relation de suivi n'existe pas.");
    }
    
    @Test
    void testIsFollowing_shouldReturnFalseWhenUserIsNull() {
        // ACT & ASSERT
        assertFalse(userService.isFollowing(null, targetUser));
        assertFalse(userService.isFollowing(followerUser, null));
        
        // VÉRIFICATION : Le repository ne doit jamais être appelé si les entrées sont nulles
        verify(followRepository, never()).findByFollowerAndFollowing(any(), any());
    }

    // =======================================================
// TESTS DE GESTION DE L'UTILISATEUR COURANT (Security)
// =======================================================

/**
 * Méthode utilitaire pour simuler le contexte de sécurité de Spring.
 * @param principal Le nom d'utilisateur (String) ou l'ID (Long) de l'utilisateur.
 * @param isAuthenticated Indique si l'utilisateur est authentifié.
 */
private void setupSecurityContext(Object principal, boolean isAuthenticated) {
    Authentication authentication = mock(Authentication.class);
    SecurityContext securityContext = mock(SecurityContext.class);

    when(authentication.getPrincipal()).thenReturn(principal);
    when(authentication.getName()).thenReturn(String.valueOf(principal));
    
    // 🎯 AJOUT DE LA VÉRIFICATION DANS LE CAS DE SUCCÈS
    // Nous devons stuber isAuthenticated() à TRUE dans les tests qui doivent réussir.
    if (isAuthenticated) {
        when(authentication.isAuthenticated()).thenReturn(true);
    }

    when(securityContext.getAuthentication()).thenReturn(authentication);
    SecurityContextHolder.setContext(securityContext);
}

@Test
void testGetCurrentUser_shouldReturnUser_WhenAuthenticatedById() {
    // ARRANGE
    Long userId = 99L;
    User expectedUser = new User();
    expectedUser.setId(userId);
    expectedUser.setUsername("user99");
    
    // Simuler un principal qui est l'ID (Long)
    setupSecurityContext(userId, true);
    
    // Mocker la récupération par ID
    when(userRepository.findById(userId)).thenReturn(Optional.of(expectedUser));

    // ACT
    User result = userService.getCurrentUser();

    // ASSERT
    assertNotNull(result, "L'utilisateur courant ne devrait pas être null.");
    assertEquals(expectedUser.getUsername(), result.getUsername());
    // Vérifier que la récupération par ID est utilisée
    verify(userRepository, times(1)).findById(userId);
    verify(userRepository, never()).findByUsername(anyString());
}


@Test
void testGetCurrentUser_shouldReturnUser_WhenAuthenticatedByUsername() {
    // ARRANGE
    String username = "testUserAuth";
    User expectedUser = new User();
    expectedUser.setId(10L);
    expectedUser.setUsername(username);
    
    // Simuler un principal qui est le nom d'utilisateur (String)
    setupSecurityContext(username, true);
    
    // Mocker la récupération par nom d'utilisateur
    when(userRepository.findByUsername(username)).thenReturn(Optional.of(expectedUser));

    // ACT
    User result = userService.getCurrentUser();

    // ASSERT
    assertNotNull(result, "L'utilisateur courant ne devrait pas être null.");
    assertEquals(expectedUser.getUsername(), result.getUsername());
    // Vérifier que la récupération par nom d'utilisateur est utilisée
    verify(userRepository, times(1)).findByUsername(username);
    verify(userRepository, never()).findById(anyLong());
}


@Test
void testGetCurrentUser_shouldReturnNull_WhenNotAuthenticated() {
    // ARRANGE
    Authentication authentication = mock(Authentication.class);
    SecurityContext securityContext = mock(SecurityContext.class);

    
    // Injecter le contexte de sécurité
    when(securityContext.getAuthentication()).thenReturn(authentication);
    SecurityContextHolder.setContext(securityContext);

    // ACT
    User result = userService.getCurrentUser();

    // ASSERT
    assertNull(result, "L'utilisateur courant doit être null si la session est anonyme.");
    // VÉRIFICATION : Le repository ne doit jamais être appelé
    verify(userRepository, never()).findByUsername(anyString());
    verify(userRepository, never()).findById(anyLong());
}


// =======================================================
// TESTS DE CACHE/FIND (getUserById, getUserByUsername)
// =======================================================

@Test
void testGetUserById_shouldCallRepository() {
    // ARRANGE
    Long id = 5L;
    User expectedUser = new User();
    expectedUser.setId(id);
    when(userRepository.findById(id)).thenReturn(Optional.of(expectedUser));

    // ACT
    Optional<User> result = userService.getUserById(id);

    // ASSERT
    assertTrue(result.isPresent());
    assertEquals(id, result.get().getId());
    // Confirme l'appel au repository
    verify(userRepository, times(1)).findById(id); 
}

@Test
void testGetUserByUsername_shouldCallRepository() {
    // ARRANGE
    String name = "cachedUser";
    User expectedUser = new User();
    expectedUser.setUsername(name);
    
    // Mocker l'appel au repository
    when(userRepository.findByUsername(name)).thenReturn(Optional.of(expectedUser));

    // ACT
    Optional<User> result = userService.getUserByUsername(name);

    // ASSERT
    assertTrue(result.isPresent());
    assertEquals(name, result.get().getUsername());
    // L'appel doit passer par le repository
    verify(userRepository, times(1)).findByUsername(name); 
}
}