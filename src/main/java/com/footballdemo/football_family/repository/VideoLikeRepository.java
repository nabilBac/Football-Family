package com.footballdemo.football_family.repository;



import com.footballdemo.football_family.model.VideoLike;
import com.footballdemo.football_family.model.User;
import com.footballdemo.football_family.model.Video;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface VideoLikeRepository extends JpaRepository<VideoLike, Long> {
    Optional<VideoLike> findByUserAndVideo(User user, Video video);
    int countByVideo(Video video);
}
