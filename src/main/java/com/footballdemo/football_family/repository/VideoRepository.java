package com.footballdemo.football_family.repository;

import com.footballdemo.football_family.model.Video;
import com.footballdemo.football_family.model.User;
import org.springframework.data.domain.Sort;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.repository.query.Param;
import com.footballdemo.football_family.model.VideoStatus;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface VideoRepository extends JpaRepository<Video, Long> {

    // ==========================================
    // 1️⃣ PROJECTION INTERFACE
    // ==========================================

    interface VideoFeedProjection {
        Long getId();
        String getTitle();
        String getCategory();
        String getFilename();
        String getThumbnailUrl();
        LocalDateTime getDateUpload();
        String getUploaderUsername();
        Long getUploaderId();
        String getUploaderAvatarUrl();    // ⭐ NOUVEAU
        VideoStatus getStatus();
        int getLikesCount();
        long getCommentsCount();
    }

    // ==========================================
    // 2️⃣ FEED QUERIES
    // ==========================================

    @Query("""
        SELECT v.id AS id, 
               v.title AS title, 
               v.category AS category, 
               v.filename AS filename, 
               v.thumbnailUrl AS thumbnailUrl, 
               v.status AS status, 
               v.dateUpload AS dateUpload, 
               v.uploader.username AS uploaderUsername, 
               v.uploader.id AS uploaderId, 
               v.uploader.avatarUrl AS uploaderAvatarUrl,
               v.likesCount AS likesCount, 
               v.commentsCount AS commentsCount
        FROM Video v
        WHERE v.status = 'READY'
        ORDER BY v.dateUpload DESC
    """)
    Page<VideoFeedProjection> findReadyFeedProjectionOrderByDateUploadDesc(Pageable pageable);

    @Query("""
        SELECT v.id AS id, 
               v.title AS title, 
               v.category AS category, 
               v.filename AS filename, 
               v.thumbnailUrl AS thumbnailUrl, 
               v.status AS status, 
               v.dateUpload AS dateUpload, 
               v.uploader.username AS uploaderUsername, 
               v.uploader.id AS uploaderId, 
               v.uploader.avatarUrl AS uploaderAvatarUrl,
               v.likesCount AS likesCount, 
               v.commentsCount AS commentsCount
        FROM Video v
        WHERE v.uploader.id IN :followedUserIds
          AND v.status = 'READY'
        ORDER BY v.dateUpload DESC
    """)
    Page<VideoFeedProjection> findReadyFollowedFeedProjection(
        @Param("followedUserIds") List<Long> followedUserIds, 
        Pageable pageable
    );

    @Query("""
        SELECT v.id AS id, 
               v.title AS title, 
               v.category AS category, 
               v.filename AS filename, 
               v.thumbnailUrl AS thumbnailUrl, 
               v.dateUpload AS dateUpload, 
               v.uploader.username AS uploaderUsername, 
               v.uploader.id AS uploaderId,
               v.uploader.avatarUrl AS uploaderAvatarUrl,
               v.status AS status,
               v.likesCount AS likesCount, 
               v.commentsCount AS commentsCount
        FROM Video v
        WHERE v.status IN :statuses
        ORDER BY v.dateUpload DESC
    """)
    Page<VideoFeedProjection> findFeedProjectionByStatuses(
        @Param("statuses") List<VideoStatus> statuses,
        Pageable pageable
    );

    @Query("""
        SELECT v.id AS id, 
               v.title AS title, 
               v.category AS category, 
               v.filename AS filename, 
               v.thumbnailUrl AS thumbnailUrl, 
               v.dateUpload AS dateUpload, 
               v.uploader.username AS uploaderUsername, 
               v.uploader.id AS uploaderId,
               v.uploader.avatarUrl AS uploaderAvatarUrl,
               v.status AS status,
               v.likesCount AS likesCount, 
               v.commentsCount AS commentsCount
        FROM Video v
        WHERE v.uploader.id IN :followedUserIds
          AND v.status IN :statuses
        ORDER BY v.dateUpload DESC
    """)
    Page<VideoFeedProjection> findFollowedFeedProjectionByStatuses(
        @Param("followedUserIds") List<Long> followedUserIds,
        @Param("statuses") List<VideoStatus> statuses,
        Pageable pageable
    );

    // ==========================================
    // 3️⃣ PROFILE QUERIES
    // ==========================================

    List<Video> findAllByUploader(User uploader, Sort sort);

    List<Video> findByDateUploadAfter(LocalDateTime date, Sort sort);

    Page<Video> findAllByUploader(User uploader, Pageable pageable);

    // ==========================================
    // 4️⃣ COMPTEURS ATOMIQUES (Comments)
    // ==========================================

    @Transactional
    @Modifying
    @Query("UPDATE Video v SET v.commentsCount = v.commentsCount + 1 WHERE v.id = :videoId")
    void incrementCommentsCount(@Param("videoId") Long videoId);

    @Transactional
    @Modifying
    @Query("UPDATE Video v SET v.commentsCount = CASE WHEN v.commentsCount > 0 THEN v.commentsCount - 1 ELSE 0 END WHERE v.id = :videoId")
    void decrementCommentsCount(@Param("videoId") Long videoId);

    @Query("SELECT v.commentsCount FROM Video v WHERE v.id = :videoId")
    Long getCommentsCountById(@Param("videoId") Long videoId);

    // ==========================================
    // 5️⃣ COMPTEURS ATOMIQUES (Likes)
    // ==========================================

    @Transactional
    @Modifying
    @Query("UPDATE Video v SET v.likesCount = v.likesCount + 1 WHERE v.id = :videoId")
    void incrementLikesCount(@Param("videoId") Long videoId);

    @Transactional
    @Modifying
    @Query("UPDATE Video v SET v.likesCount = CASE WHEN v.likesCount > 0 THEN v.likesCount - 1 ELSE 0 END WHERE v.id = :videoId")
    void decrementLikesCount(@Param("videoId") Long videoId);

    @Query("SELECT v.likesCount FROM Video v WHERE v.id = :videoId")
    Long getLikesCountById(@Param("videoId") Long videoId);
}