package com.footballdemo.football_family.repository;

import com.footballdemo.football_family.model.Follow;
import com.footballdemo.football_family.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query; // 🎯 NOUVEL IMPORT
import org.springframework.data.repository.query.Param; // 🎯 NOUVEL IMPORT
import org.springframework.stereotype.Repository;
import java.util.Optional;
 
import java.util.List; // 🎯 NOUVEL IMPORT

@Repository
public interface FollowRepository extends JpaRepository<Follow, Long> {
    
    // ... (Vos méthodes existantes restent ici) ...

    long countByFollowing(User following); 
    long countByFollower(User follower);
    Optional<Follow> findByFollowerAndFollowing(User follower, User following);
    
    // 🎯 MÉTHODE CLÉ POUR LE FIL D'ACTUALITÉ
    /**
     * Récupère les IDs de tous les utilisateurs que l'utilisateur 'follower' suit.
     * C'est optimisé pour récupérer seulement les IDs et non l'entité User entière.
     * @param follower L'utilisateur connecté.
     * @return Une liste des IDs (Long) des utilisateurs suivis (following).
     */
    @Query("SELECT f.following.id FROM Follow f WHERE f.follower = :follower")
    List<Long> findFollowingIdsByFollower(@Param("follower") User follower);
}