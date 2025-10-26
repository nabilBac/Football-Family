package com.footballdemo.football_family.repository;

import com.footballdemo.football_family.model.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Sort; 
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;

public interface CommentRepository extends JpaRepository<Comment, Long> {

    
    // Commentaires avec auteur (fetch join) paginés
    // Retourne List<Comment> et non Page<Comment> avec JOIN FETCH
@Query("SELECT c FROM Comment c JOIN FETCH c.author WHERE c.video.id = :videoId ORDER BY c.createdAt DESC")
List<Comment> findByVideoIdWithAuthorsPaged(@Param("videoId") Long videoId, Pageable pageable);

    
    // 1. Version pour trier dynamiquement les commentaires (nécessite le paramètre Sort)
    List<Comment> findByVideoId(Long videoId, Sort sort); 

    // 2. ⭐ NOUVELLE VERSION SURCHARGÉE (pour corriger l'erreur de votre contrôleur)
    //    Permet de trouver tous les commentaires pour la vidéo sans spécifier d'ordre de tri.
    List<Comment> findByVideoId(Long videoId); 

    long countByVideoId(Long videoId);

     // 3. ⭐ MÉTHODE OPTIMISÉE : Utilisation de JOIN FETCH
    // Charge les commentaires ET leurs auteurs en UNE SEULE requête.
    @Query("SELECT c FROM Comment c JOIN FETCH c.author WHERE c.video.id = :videoId ORDER BY c.createdAt DESC")
    List<Comment> findByVideoIdWithAuthorsOptimized(@Param("videoId") Long videoId);

      // Méthode optimisée pour récupérer un seul commentaire avec son auteur
    @Query("SELECT c FROM Comment c JOIN FETCH c.author WHERE c.id = :id")
    Optional<Comment> findByIdWithAuthor(@Param("id") Long id);

    @Query("SELECT c FROM Comment c JOIN FETCH c.author WHERE c.video.id = :videoId ORDER BY c.createdAt DESC")
    Page<Comment> findTopCommentsByVideo(@Param("videoId") Long videoId, Pageable pageable);

    
}