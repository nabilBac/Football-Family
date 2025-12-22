package com.footballdemo.football_family.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Match {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDate date;

    private LocalTime time;

    private String field;
    private String location;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    // ⚠️ DOIT ÊTRE NULLABLE POUR LES MATCHS KO NON REMPLIS
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_a_id", nullable = true)
    private Team teamA;

    // ⚠️ DOIT ÊTRE NULLABLE POUR LES MATCHS KO NON REMPLIS
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_b_id", nullable = true)
    private Team teamB;

    // Groupe NULL pour les matchs KO
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = true)
    private TournamentGroup group;

    private Integer scoreTeamA;
    private Integer scoreTeamB;

    // Match suivant dans le bracket
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "next_match_id", nullable = true)
    private Match nextMatch;

    private String nextSlot; // "A" ou "B"

    @Column(length = 50)
    private String round; // "QF1", "SF1", "FINAL", etc.

    
@Builder.Default
@Enumerated(EnumType.STRING)
@Column(nullable = false)
private MatchStatus status = MatchStatus.SCHEDULED;

    

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
