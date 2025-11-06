package com.footballdemo.football_family.dto;

import lombok.Builder;
import lombok.Value;

import java.time.LocalDateTime;
import java.util.List;

import java.util.Collections;

// DTO final et allégé (Priorité #1).
// Utilise @Value pour l'immuabilité (final fields) et @Builder pour la création facile.
// Il ne charge PLUS la liste lourde des commentaires.

@Value
@Builder
public class VideoDto {

    private final Long id;
    private final String title;
    private final String uploaderUsername;
    private final Long uploaderId;
    private final String category;
    private final java.time.LocalDateTime dateUpload;
    private final String filename;
    private final String thumbnailUrl;
    @Builder.Default
    private final List<CommentDto> topComments = Collections.emptyList();

    // Statistiques optimisées, lues directement depuis l'entité Video
    private final int likesCount;
    private final long commentsCount; // <-- REMPLACEMENT de la List<CommentDto>
    private final boolean likedByCurrentUser;
    private LocalDateTime date;

    private final boolean live; // ajoute et initialise via Builder
    private final boolean top;
}