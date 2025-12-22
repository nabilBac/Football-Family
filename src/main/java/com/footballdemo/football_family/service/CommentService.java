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
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final UserRepository userRepository;
    private final VideoRepository videoRepository;
    private final SimpMessagingTemplate messagingTemplate;

    private static final String VIDEO_STATS_TOPIC = "/topic/video/";              // + {videoId}
    private static final String VIDEO_COMMENTS_TOPIC = "/topic/video/%d/comments"; // String.format

    /**
     * Récupère les commentaires d'une vidéo, paginés, triés du plus récent au plus ancien.
     * On renvoie des DTO directement pour simplifier l'usage côté contrôleur.
     */
    @Transactional(readOnly = true)
  public Page<CommentDto> getCommentsForVideo(Long videoId, int page, int size)
{
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Comment> pageResult = commentRepository.findByVideoIdPaged(videoId, pageable);

        // Charger les auteurs pour éviter les LazyInitializationException
        pageResult.getContent().forEach(c -> {
            if (c.getAuthor() != null) {
                c.getAuthor().getUsername();
            }
        });

        List<CommentDto> dtoList = pageResult.getContent().stream()
                .map(CommentDto::new)
                .collect(Collectors.toList());

        return new PageImpl<>(dtoList, pageable, pageResult.getTotalElements());
    }

    /**
     * Simple helper : vérifie si l'utilisateur est l'auteur du commentaire.
     */
    @Transactional(readOnly = true)
    public boolean isAuthor(Long commentId, String username) {
        return commentRepository.findById(commentId)
                .map(comment -> comment.getAuthor() != null
                        && Objects.equals(comment.getAuthor().getUsername(), username))
                .orElse(false);
    }

    /**
     * Ajoute un commentaire sur une vidéo et envoie les mises à jour WebSocket
     * pour les stats + pour la liste des commentaires.
     */
    @Transactional
    public CommentDto addComment(Long videoId, String content, String username) {

        if (content == null || content.trim().isEmpty()) {
            throw new BadRequestException("Le contenu du commentaire ne peut pas être vide.");
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

        // Optionnel : maintenir la collection en mémoire cohérente
        video.getComments().add(saved);

        // Incrémenter le compteur persistant
        videoRepository.incrementCommentsCount(videoId);

        // Récupérer le nouveau nombre de commentaires
        long newCount = videoRepository.getCommentsCountById(videoId);

        CommentDto commentDto = new CommentDto(saved);

        // WS : mise à jour des stats pour le feed
        sendStatsUpdate(videoId, newCount);

        // WS : évènement "CREATED" pour la liste des commentaires
        sendCommentEvent(videoId, "CREATED", commentDto, null);

        log.info("Commentaire {} ajouté sur la vidéo {} par {}", saved.getId(), videoId, username);
        return commentDto;
    }

    /**
     * Met à jour un commentaire si l'utilisateur en est bien l'auteur.
     */
    @Transactional
    public CommentDto updateComment(Long commentId, String newContent, String username) {

        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Commentaire", commentId));

        if (comment.getAuthor() == null
                || !Objects.equals(comment.getAuthor().getUsername(), username)) {
            throw new ForbiddenException("Vous ne pouvez modifier que vos propres commentaires.");
        }

        if (newContent == null || newContent.trim().isEmpty()) {
            throw new BadRequestException("Le contenu du commentaire ne peut pas être vide.");
        }

        comment.setContent(newContent.trim());
        comment.setUpdatedAt(LocalDateTime.now());

        Comment updated = commentRepository.save(comment);
        CommentDto dto = new CommentDto(updated);
        Long videoId = updated.getVideo().getId();

        // WS : évènement "UPDATED"
        sendCommentEvent(videoId, "UPDATED", dto, null);

        log.info("Commentaire {} mis à jour par {}", commentId, username);
        return dto;
    }

    /**
     * Supprime un commentaire si l'utilisateur en est bien l'auteur.
     * Met à jour le compteur de commentaires de la vidéo et envoie les messages WS.
     */
    @Transactional
    public void deleteComment(Long commentId, String username) {

        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Commentaire", commentId));

        if (comment.getAuthor() == null
                || !Objects.equals(comment.getAuthor().getUsername(), username)) {
            throw new ForbiddenException("Vous ne pouvez supprimer que vos propres commentaires.");
        }

        Long videoId = comment.getVideo().getId();
        Video video = comment.getVideo();

        // Maintenir la liste in-memory cohérente
        video.getComments().remove(comment);

        commentRepository.delete(comment);

        videoRepository.decrementCommentsCount(videoId);
        long newCount = videoRepository.getCommentsCountById(videoId);

        // WS : mise à jour des stats
        sendStatsUpdate(videoId, newCount);

        // WS : évènement "DELETED"
        sendCommentEvent(videoId, "DELETED", null, commentId);

        log.info("Commentaire {} supprimé par {}", commentId, username);
    }

    /**
     * Liste tous les commentaires d'une vidéo (version non paginée).
     */
    @Transactional(readOnly = true)
    public List<CommentDto> getCommentsByVideoId(Long videoId) {
        List<Comment> comments = commentRepository.findByVideoId(videoId);
        return comments.stream()
                .map(CommentDto::new)
                .collect(Collectors.toList());
    }

    /**
     * Compte le nombre de commentaires pour une vidéo.
     */
    @Transactional(readOnly = true)
    public long getCommentCountByVideoId(Long videoId) {
        return commentRepository.countByVideoId(videoId);
    }

    // ==========================================
    // Helpers privés pour WebSocket
    // ==========================================

    /**
     * Envoie une mise à jour des stats (nombre de commentaires) vers le topic feed.
     */
    private void sendStatsUpdate(Long videoId, Long newCommentsCount) {
        VideoStatsUpdateDto statsPayload = new VideoStatsUpdateDto(
                videoId,
                null,           // newLikesCount
                null,           // isLiked
                newCommentsCount,
                null            // lastActionBy
        );

        String topic = VIDEO_STATS_TOPIC + videoId;
        messagingTemplate.convertAndSend(topic, statsPayload);
    }

    /**
     * Envoie un évènement de commentaire (CREATED/UPDATED/DELETED) vers le topic comments.
     *
     * @param videoId    ID de la vidéo
     * @param action     "CREATED", "UPDATED", "DELETED"
     * @param commentDto DTO du commentaire (null si DELETED)
     * @param commentId  ID du commentaire si DELETED (sinon peut être null)
     */
    private void sendCommentEvent(Long videoId, String action, CommentDto commentDto, Long commentId) {
        CommentWsMessage payload = new CommentWsMessage(
                action,
                videoId,
                commentId != null ? commentId : (commentDto != null ? commentDto.getId()
 : null),
                commentDto
        );
        String topic = String.format(VIDEO_COMMENTS_TOPIC, videoId);
        messagingTemplate.convertAndSend(topic, payload);
    }

    /**
     * Payload typé pour les messages WebSocket concernant les commentaires.
     */
    public record CommentWsMessage(
            String action,      // CREATED / UPDATED / DELETED
            Long videoId,
            Long commentId,
            CommentDto comment  // null pour DELETED
    ) {}
}
