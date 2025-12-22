package com.footballdemo.football_family.repository;

import com.footballdemo.football_family.entity.VideoReaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VideoReactionRepository extends JpaRepository<VideoReaction, Long> {

    // Trouver toutes les réactions d'une vidéo
    List<VideoReaction> findByVideoId(Long videoId);

    // Trouver la réaction d'un user sur une vidéo spécifique
    Optional<VideoReaction> findByVideoIdAndUserId(Long videoId, Long userId);

    // Compter les réactions par emoji pour une vidéo
    @Query("SELECT vr.emoji, COUNT(vr) FROM VideoReaction vr WHERE vr.video.id = :videoId GROUP BY vr.emoji")
    List<Object[]> countReactionsByEmoji(@Param("videoId") Long videoId);

    // Supprimer la réaction d'un user sur une vidéo
    void deleteByVideoIdAndUserId(Long videoId, Long userId);
}