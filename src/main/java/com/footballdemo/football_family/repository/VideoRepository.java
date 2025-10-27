package com.footballdemo.football_family.repository;



import com.footballdemo.football_family.model.Video;
import org.springframework.data.domain.Sort;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import com.footballdemo.football_family.model.User;

@Repository
public interface VideoRepository extends JpaRepository<Video, Long> {

    // 🚨 1. Interface de Projection pour le Feed (Lecture RAPIDE)
    interface VideoFeedProjection {
        Long getId();
        String getTitle();
        String getCategory();
        String getFilename();
        String getThumbnailUrl();
        java.time.LocalDateTime getDateUpload();
        String getUploaderUsername(); // Nom d'utilisateur de l'uploader
        Long getUploaderId();         // ID de l'uploader
        int getLikesCount();          // Compteur optimisé
        long getCommentsCount();      // Compteur optimisé
    }

    // 🚨 2. Requête JPQL optimisée pour charger le Feed Global
    @Query(value = """
        SELECT v.id AS id, v.title AS title, v.category AS category, v.filename AS filename, 
               v.thumbnailUrl AS thumbnailUrl, v.dateUpload AS dateUpload, 
               v.uploader.username AS uploaderUsername, v.uploader.id AS uploaderId, 
               v.likesCount AS likesCount, v.commentsCount AS commentsCount
        FROM Video v
        ORDER BY v.dateUpload DESC
    """)
    Page<VideoFeedProjection> findFeedProjectionOrderByDateUploadDesc(Pageable pageable);

    // 🎯 NOUVEAU: Requête JPQL optimisée pour le Feed Personnalisé (Followed Users)
    /**
     * Récupère les vidéos postées par les utilisateurs dont les IDs sont fournis.
     * Cette requête est la base du fil d'actualité personnel.
     * * @param followedUserIds La liste des IDs d'utilisateurs que l'utilisateur courant suit.
     * @param pageable La pagination demandée.
     * @return Une page de projections de vidéos.
     */
    @Query(value = """
        SELECT v.id AS id, v.title AS title, v.category AS category, v.filename AS filename, 
               v.thumbnailUrl AS thumbnailUrl, v.dateUpload AS dateUpload, 
               v.uploader.username AS uploaderUsername, v.uploader.id AS uploaderId, 
               v.likesCount AS likesCount, v.commentsCount AS commentsCount
        FROM Video v
        WHERE v.uploader.id IN :followedUserIds
        ORDER BY v.dateUpload DESC
    """)
    Page<VideoFeedProjection> findFollowedFeedProjection(
        @Param("followedUserIds") List<Long> followedUserIds, 
        Pageable pageable
    );

    // 🛑 CORRECTION CRITIQUE (N+1) : Utiliser JOIN FETCH pour s'assurer que l'Uploader
    // est chargé en même temps que la Vidéo, éliminant les requêtes N+1 sur les pages de profil.
    @Query("SELECT v FROM Video v JOIN FETCH v.uploader u WHERE u = :uploader")
    Page<Video> findByUploader(@Param("uploader") User uploader, Pageable pageable);

    List<Video> findAllByUploader(User uploader, Sort sort);

    List<Video> findByDateUploadAfter(LocalDateTime date, Sort sort);

    // 🚨 3. Méthodes pour mettre à jour les compteurs (CRITIQUE pour l'atomicité)

    // Commentaires
@Transactional
    @Modifying
    @Query("UPDATE Video v SET v.commentsCount = v.commentsCount + 1 WHERE v.id = :videoId")
    void incrementCommentsCount(@Param("videoId") Long videoId);

    // ✅ NOUVEAU/CORRIGÉ : Protection CRITIQUE contre les négatifs
    @Modifying
    @Transactional
    @Query("UPDATE Video v SET v.commentsCount = CASE WHEN v.commentsCount > 0 THEN v.commentsCount - 1 ELSE 0 END WHERE v.id = :videoId")
    void decrementCommentsCount(@Param("videoId") Long videoId);
    
    /**
     * ✅ AJOUTÉ : Récupère le compteur de commentaires (nécessaire pour CommentService et Tests).
     */
    @Query("SELECT v.commentsCount FROM Video v WHERE v.id = :videoId")
    Long getCommentsCountById(@Param("videoId") Long videoId);

    // Likes
    @Transactional
    @Modifying
    @Query("UPDATE Video v SET v.likesCount = v.likesCount + 1 WHERE v.id = :videoId")
    void incrementLikesCount(@Param("videoId") Long videoId);

    @Modifying
    @Transactional
    @Query("UPDATE Video v SET v.likesCount = v.likesCount - 1 WHERE v.id = :videoId AND v.likesCount > 0")
    void decrementLikesCount(@Param("videoId") Long videoId);

    @Query("SELECT v.likesCount FROM Video v WHERE v.id = :videoId")
    Long getLikesCountById(@Param("videoId") Long videoId);
}