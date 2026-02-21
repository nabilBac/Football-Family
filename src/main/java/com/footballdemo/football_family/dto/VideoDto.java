package com.footballdemo.football_family.dto;

import lombok.Builder;
import lombok.Value;

import java.time.LocalDateTime;
import java.util.List;
import com.footballdemo.football_family.model.VideoStatus;

import java.util.Collections;

@Value
@Builder
public class VideoDto {
    Long id;
    String title;
    String uploaderUsername;
    Long uploaderId;
    String uploaderAvatarUrl;       // ⭐ NOUVEAU — avatar du créateur
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
    boolean isFollowingUploader;    // ⭐ NOUVEAU — est-ce que le viewer suit ce créateur

    boolean live;
    boolean top;
}