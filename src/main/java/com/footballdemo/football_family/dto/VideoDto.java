package com.footballdemo.football_family.dto;

import lombok.Builder;
import lombok.Value;

import java.time.LocalDateTime;
import java.util.List;
import com.footballdemo.football_family.model.VideoStatus;

import java.util.Collections;

// DTO final et allégé (Priorité #1).
// Utilise @Value pour l'immuabilité (final fields) et @Builder pour la création facile.
// Il ne charge PLUS la liste lourde des commentaires.

@Value
@Builder
public class VideoDto {
    Long id;
    String title;
    String uploaderUsername;
    Long uploaderId;
    String category;
    LocalDateTime dateUpload;
    String filename;
    String thumbnailUrl;
    VideoStatus status; 

    @Builder.Default
    List<CommentDto> topComments = Collections.emptyList();

    int likesCount;
    long commentsCount;
    boolean likedByCurrentUser;

    boolean live;
    boolean top;
}
