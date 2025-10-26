package com.footballdemo.football_family.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set; 
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.Min;

@Entity
@Table(name = "video", indexes = {
    @Index(name = "idx_video_uploader", columnList = "user_id"),
    @Index(name = "idx_video_dateUpload", columnList = "dateUpload")
})
@Getter
@Setter
@NoArgsConstructor
public class Video {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private String category;
    private String filename;
    private String thumbnailUrl;

    @Column(nullable = false, updatable = false)
    private LocalDateTime dateUpload;

    @Column(columnDefinition = "int default 0")
    @Min(0)
    private int likesCount = 0;

    @Column(columnDefinition = "int default 0")
    @Min(0)
    private int commentsCount = 0;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User uploader;

    @OneToMany(mappedBy = "video", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Comment> comments = new ArrayList<>();

    @OneToMany(mappedBy = "video", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Set<VideoLike> videoLikes;

    // --- Hook JPA pour dateUpload automatique ---
    @PrePersist
    protected void onCreate() {
        this.dateUpload = LocalDateTime.now();
    }
}

