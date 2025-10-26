package com.footballdemo.football_family.model;



import jakarta.persistence.*;

@Entity
@Table(name = "video_like",
       uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "video_id"}),
       indexes = {
           @Index(name = "idx_videolike_user", columnList = "user_id"),
           @Index(name = "idx_videolike_video", columnList = "video_id")
       })
public class VideoLike {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "video_id")
    private Video video;

    // Getters / Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public Video getVideo() { return video; }
    public void setVideo(Video video) { this.video = video; }
}

