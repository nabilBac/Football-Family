package com.footballdemo.football_family.repository;

import com.footballdemo.football_family.model.VideoLike;
import com.footballdemo.football_family.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;
import com.footballdemo.football_family.model.Video;

public interface VideoLikeRepository extends JpaRepository<VideoLike, Long> {

    Optional<VideoLike> findByUserAndVideo(User user, Video video);

    Long countByVideo(Video video);

    // ✅ Méthode optimisée pour récupérer tous les likes d’un utilisateur sur
    // plusieurs vidéos
    @Query("SELECT vl FROM VideoLike vl WHERE vl.user = :user AND vl.video.id IN :videoIds")
    List<VideoLike> findAllByUserAndVideoIdIn(@Param("user") User user, @Param("videoIds") List<Long> videoIds);

    @Query("SELECT vl.video.id FROM VideoLike vl WHERE vl.user.username = :username")
    List<Long> findLikedVideoIdsByUsername(@Param("username") String username);

    @Query("SELECT vl.video.id FROM VideoLike vl WHERE vl.user = :user AND vl.video.id IN :videoIds")
    List<Long> findLikedVideoIdsByUserAndVideoIds(@Param("user") User user, @Param("videoIds") List<Long> videoIds);

    @Query("""
                SELECT vl.video.id, COUNT(vl)
                FROM VideoLike vl
                WHERE vl.video.id IN :videoIds
                GROUP BY vl.video.id
            """)
    List<Object[]> countLikesForVideoIds(@Param("videoIds") List<Long> videoIds);

}
