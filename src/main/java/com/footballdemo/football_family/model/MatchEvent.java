package com.footballdemo.football_family.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "match_event")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MatchEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "match_id", nullable = false)
    private Match match;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MatchEventType type;

    @Column(name = "match_minute")  // 🔧 FIX: "minute" est un mot réservé SQL
    private Integer minute;

    private String playerName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id")
    private Team team;

    @Column(length = 500)
    private String details;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}