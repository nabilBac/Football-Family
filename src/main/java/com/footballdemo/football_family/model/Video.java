package com.footballdemo.football_family.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;



@Entity
public class Video {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    private String category;

    private String filename;

    private LocalDateTime dateUpload;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User uploader;

    @OneToMany(mappedBy = "video", cascade = CascadeType.ALL, fetch = FetchType.EAGER) // <-- CHANGEMENT ICI
    private List<Comment> comments = new ArrayList<>();

    @Column(nullable = false)
    private int likes = 0;

    // Getters / Setters

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getFilename() { return filename; }
    public void setFilename(String filename) { this.filename = filename; }

    public LocalDateTime getDateUpload() { return dateUpload; }
    public void setDateUpload(LocalDateTime dateUpload) { this.dateUpload = dateUpload; }

    public User getUploader() { return uploader; }
    public void setUploader(User uploader) { this.uploader = uploader; }

     public int getLikes() { return likes; }
    public void setLikes(int likes) { this.likes = likes; }

     public List<Comment> getComments() {
    return comments;
    }

    public void setComments(List<Comment> comments) {
    this.comments = comments;
    }

    
    
}
