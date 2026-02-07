package com.footballdemo.football_family.service;

import com.footballdemo.football_family.dto.CommentDto;
import com.footballdemo.football_family.dto.VideoStatsUpdateDto;
import com.footballdemo.football_family.exception.BadRequestException;
import com.footballdemo.football_family.exception.ForbiddenException;
import com.footballdemo.football_family.exception.ResourceNotFoundException;
import com.footballdemo.football_family.model.Comment;
import com.footballdemo.football_family.model.User;
import com.footballdemo.football_family.model.Video;
import com.footballdemo.football_family.repository.CommentRepository;
import com.footballdemo.football_family.repository.UserRepository;
import com.footballdemo.football_family.repository.VideoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final UserRepository userRepository;
    private final VideoRepository videoRepository;
    private final SimpMessagingTemplate messagingTemplate;

    private static final String VIDEO_STATS_TOPIC = "/topic/video/";
    private static final String VIDEO_COMMENTS_TOPIC = "/topic/video/%d/comments";
    private static final int MAX_COMMENT_LENGTH = 500;

    // ✅ THROTTLE: WebSocket notifications (1 par vidéo par seconde)
    private final Map<Long, Long> lastNotificationTime = new ConcurrentHashMap<>();

    /**
     * ✅ OPTIMISÉ: Récupère commentaires avec fetch join + cache
     */
    @Transactional(readOnly = true)
    //@Cacheable(value = "comments", key = "#videoId + '-' + #page", unless = "#result == null || #result.isEmpty()")
    public Page<CommentDto> getCommentsForVideo(Long videoId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        
        // ✅ FETCH JOIN: Charge auteurs en UNE requête
        Page<Comment> pageResult = commentRepository.findByVideoIdWithAuthor(videoId, pageable);

        List<CommentDto> dtoList = pageResult.getContent().stream()
                .map(CommentDto::new)
                .collect(Collectors.toList());

        return new PageImpl<>(dtoList, pageable, pageResult.getTotalElements());
    }

    /**
     * Helper : vérifie si l'utilisateur est l'auteur du commentaire
     */
    @Transactional(readOnly = true)
    public boolean isAuthor(Long commentId, String username) {
        return commentRepository.findById(commentId)
                .map(comment -> comment.getAuthor() != null
                        && Objects.equals(comment.getAuthor().getUsername(), username))
                .orElse(false);
    }

    /**
     * ✅ OPTIMISÉ: Ajoute commentaire avec validation + atomic count
     */
    @Transactional(isolation = Isolation.READ_COMMITTED)
    //@CacheEvict(value = "comments", key = "#videoId + '-*'", allEntries = true)
    public CommentDto addComment(Long videoId, String content, String username) {

        // ✅ VALIDATION: Contenu
        if (content == null || content.trim().isEmpty()) {
            throw new BadRequestException("Le contenu du commentaire ne peut pas être vide.");
        }

        // ✅ VALIDATION: Longueur max
        if (content.trim().length() > MAX_COMMENT_LENGTH) {
            throw new BadRequestException("Commentaire trop long (max " + MAX_COMMENT_LENGTH + " caractères).");
        }

        Video video = videoRepository.findById(videoId)
                .orElseThrow(() -> new ResourceNotFoundException("Vidéo", videoId));

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur avec username = " + username));

        Comment comment = new Comment();
        comment.setContent(content.trim());
        comment.setCreatedAt(LocalDateTime.now());
        comment.setAuthor(user);
        comment.setVideo(video);

        Comment saved = commentRepository.save(comment);

        // ✅ ATOMIC: Incrément + récupération en une transaction
        videoRepository.incrementCommentsCount(videoId);
        long newCount = videoRepository.getCommentsCountById(videoId);

        CommentDto commentDto = new CommentDto(saved);

        // ✅ THROTTLE: WebSocket notifications
        sendStatsUpdateThrottled(videoId, newCount);
        sendCommentEvent(videoId, "CREATED", commentDto, null);

        log.info("Commentaire {} ajouté sur la vidéo {} par {}", saved.getId(), videoId, username);
        return commentDto;
    }

    /**
     * ✅ OPTIMISÉ: Met à jour un commentaire avec validation
     */
    @Transactional(isolation = Isolation.READ_COMMITTED)
    //@CacheEvict(value = "comments", key = "#commentId", allEntries = true)
    public CommentDto updateComment(Long commentId, String newContent, String username) {

        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Commentaire", commentId));

        if (comment.getAuthor() == null
                || !Objects.equals(comment.getAuthor().getUsername(), username)) {
            throw new ForbiddenException("Vous ne pouvez modifier que vos propres commentaires.");
        }

        // ✅ VALIDATION
        if (newContent == null || newContent.trim().isEmpty()) {
            throw new BadRequestException("Le contenu du commentaire ne peut pas être vide.");
        }

        if (newContent.trim().length() > MAX_COMMENT_LENGTH) {
            throw new BadRequestException("Commentaire trop long (max " + MAX_COMMENT_LENGTH + " caractères).");
        }

        comment.setContent(newContent.trim());
        comment.setUpdatedAt(LocalDateTime.now());

        Comment updated = commentRepository.save(comment);
        CommentDto dto = new CommentDto(updated);
        Long videoId = updated.getVideo().getId();

        sendCommentEvent(videoId, "UPDATED", dto, null);

        log.info("Commentaire {} mis à jour par {}", commentId, username);
        return dto;
    }

    /**
     * ✅ OPTIMISÉ: Supprime commentaire + atomic count
     */
    @Transactional(isolation = Isolation.READ_COMMITTED)
    //@CacheEvict(value = "comments", allEntries = true)
    public void deleteComment(Long commentId, String username) {

        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Commentaire", commentId));

        if (comment.getAuthor() == null
                || !Objects.equals(comment.getAuthor().getUsername(), username)) {
            throw new ForbiddenException("Vous ne pouvez supprimer que vos propres commentaires.");
        }

        Long videoId = comment.getVideo().getId();

        commentRepository.delete(comment);

        // ✅ ATOMIC: Décrément + récupération
        videoRepository.decrementCommentsCount(videoId);
        long newCount = videoRepository.getCommentsCountById(videoId);

        sendStatsUpdateThrottled(videoId, newCount);
        sendCommentEvent(videoId, "DELETED", null, commentId);

        log.info("Commentaire {} supprimé par {}", commentId, username);
    }

    /**
     * Liste tous les commentaires d'une vidéo (non paginé)
     */
    @Transactional(readOnly = true)
    public List<CommentDto> getCommentsByVideoId(Long videoId) {
        List<Comment> comments = commentRepository.findByVideoIdWithAuthor(videoId);
        return comments.stream()
                .map(CommentDto::new)
                .collect(Collectors.toList());
    }

    /**
     * Compte le nombre de commentaires pour une vidéo
     */
    @Transactional(readOnly = true)
    public long getCommentCountByVideoId(Long videoId) {
        return commentRepository.countByVideoId(videoId);
    }

    // ==========================================
    // Helpers privés pour WebSocket
    // ==========================================

    /**
     * ✅ THROTTLED: Envoie stats max 1 fois par seconde par vidéo
     */
    private void sendStatsUpdateThrottled(Long videoId, Long newCommentsCount) {
        long now = System.currentTimeMillis();
        Long lastTime = lastNotificationTime.get(videoId);

        if (lastTime == null || (now - lastTime) > 1000) {
            VideoStatsUpdateDto statsPayload = new VideoStatsUpdateDto(
                    videoId,
                    null,
                    null,
                    newCommentsCount,
                    null
            );

            String topic = VIDEO_STATS_TOPIC + videoId;
            messagingTemplate.convertAndSend(topic, statsPayload);
            lastNotificationTime.put(videoId, now);
        }
    }

    /**
     * Envoie un évènement de commentaire (CREATED/UPDATED/DELETED)
     */
    private void sendCommentEvent(Long videoId, String action, CommentDto commentDto, Long commentId) {
        CommentWsMessage payload = new CommentWsMessage(
                action,
                videoId,
                commentId != null ? commentId : (commentDto != null ? commentDto.getId() : null),
                commentDto
        );
        String topic = String.format(VIDEO_COMMENTS_TOPIC, videoId);
        messagingTemplate.convertAndSend(topic, payload);
    }

    /**
     * Payload typé pour les messages WebSocket concernant les commentaires
     */
    public record CommentWsMessage(
            String action,
            Long videoId,
            Long commentId,
            CommentDto comment
    ) {}
}