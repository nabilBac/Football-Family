package com.footballdemo.football_family.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import com.footballdemo.football_family.model.Video;
import com.footballdemo.football_family.model.User;


@Entity
@Table(name = "video_reactions", 
       uniqueConstraints = @UniqueConstraint(columnNames = {"video_id", "user_id", "emoji"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
public class VideoReaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "video_id", nullable = false)
    private Video video;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 10)
    private String emoji; // ❤️, 😂, 🔥, etc.

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}