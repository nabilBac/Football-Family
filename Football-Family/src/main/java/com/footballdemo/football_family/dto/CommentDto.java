package com.footballdemo.football_family.dto;

import com.footballdemo.football_family.model.Comment;
import java.time.LocalDateTime;

public class CommentDto {
    private final Long id;
    private final String content;
    private final String authorUsername;
    private final LocalDateTime createdAt;

    public CommentDto(Comment comment) {
        this.id = comment.getId();
        this.content = comment.getContent();
        // Gestion des valeurs nulles
        this.authorUsername = comment.getAuthor() != null ? comment.getAuthor().getUsername() : "Anonymous";
        this.createdAt = comment.getCreatedAt();
    }

    // --- Getters ---
    public Long getId() { return id; }
    public String getContent() { return content; }
    public String getAuthorUsername() { return authorUsername; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
