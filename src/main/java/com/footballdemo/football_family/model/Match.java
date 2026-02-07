package com.footballdemo.football_family.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "match", indexes = {
    @Index(name = "idx_match_event_id", columnList = "event_id"),
    @Index(name = "idx_match_group_id", columnList = "group_id"),
    @Index(name = "idx_match_status", columnList = "status"),
    @Index(name = "idx_match_date_time", columnList = "date, time")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Match {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ========== PLANNING ==========
    private LocalDate date;
    private LocalTime time;
    private String field;

    // 🆕 NIVEAU DE COMPÉTITION
@Enumerated(EnumType.STRING)
@Column(name = "competition_level")
private MatchCompetitionLevel competitionLevel;

// 🆕 TYPE DE TERRAIN
@Enumerated(EnumType.STRING)
@Column(name = "field_type")
private FieldType fieldType;
    private String location;

    // ========== RELATIONS ==========
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_a_id", nullable = true)
    private Team teamA;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_b_id", nullable = true)
    private Team teamB;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = true)
    private TournamentGroup group;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "next_match_id", nullable = true)
    private Match nextMatch;

    private String nextSlot;

    @Column(length = 50)
    private String round;

    // ========== SCORES ==========
    
    private Integer scoreTeamA;
    private Integer scoreTeamB;

    @Column(name = "penalty_score_team_a")
    private Integer penaltyScoreTeamA;

    @Column(name = "penalty_score_team_b")
    private Integer penaltyScoreTeamB;

    @Builder.Default
    @Column(name = "went_to_penalties")
    private Boolean wentToPenalties = false;

    @Builder.Default
    @Column(name = "went_to_extra_time")
    private Boolean wentToExtraTime = false;

    @Column(name = "extra_time_score_team_a")
    private Integer extraTimeScoreTeamA;

    @Column(name = "extra_time_score_team_b")
    private Integer extraTimeScoreTeamB;

    // ========== STATUT ==========
    
    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MatchStatus status = MatchStatus.SCHEDULED;

    // ========== HORAIRES ==========
    
    @Column(name = "actual_start_time")
    private LocalDateTime actualStartTime;

    @Column(name = "actual_end_time")
    private LocalDateTime actualEndTime;

    // ========== SOFT DELETE ==========
    
    @Column(name = "deleted", nullable = false)
    @Builder.Default
    private boolean deleted = false;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    // ========== TIMESTAMPS ==========
    
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    // ========== LIFECYCLE ==========

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // ========== MÉTHODES SOFT DELETE ==========

    /**
     * 🆕 Soft delete du match
     */
    public void softDelete() {
        if (this.deleted) {
            throw new IllegalStateException("Match already deleted");
        }
        
        if (this.status == MatchStatus.IN_PROGRESS) {
            throw new IllegalStateException("Cannot delete match in progress");
        }
        
        this.deleted = true;
        this.deletedAt = LocalDateTime.now();
    }

    /**
     * 🆕 Restaurer un match supprimé
     */
    public void restore() {
        if (!this.deleted) {
            throw new IllegalStateException("Match is not deleted");
        }
        
        this.deleted = false;
        this.deletedAt = null;
    }

    /**
     * 🆕 Vérifie si le match peut être supprimé
     */
    @Transient
    public boolean isDeletable() {
        return !deleted && status != MatchStatus.IN_PROGRESS;
    }

    // ========== MÉTHODES HELPER - SCORES ==========

    @Transient
    public boolean isFinished() {
        return status == MatchStatus.COMPLETED;
    }

    @Transient
    public boolean hasScore() {
        return scoreTeamA != null && scoreTeamB != null;
    }

    @Transient
    public Team getWinner() {
        if (!hasScore()) return null;
        
        // Si tirs au but
        if (Boolean.TRUE.equals(wentToPenalties)) {
            if (penaltyScoreTeamA == null || penaltyScoreTeamB == null) return null;
            return penaltyScoreTeamA > penaltyScoreTeamB ? teamA : teamB;
        }
        
        // Si prolongations
        if (Boolean.TRUE.equals(wentToExtraTime)) {
            if (extraTimeScoreTeamA == null || extraTimeScoreTeamB == null) return null;
            if (extraTimeScoreTeamA > extraTimeScoreTeamB) return teamA;
            if (extraTimeScoreTeamB > extraTimeScoreTeamA) return teamB;
            return null;
        }
        
        // Score normal
        if (scoreTeamA > scoreTeamB) return teamA;
        if (scoreTeamB > scoreTeamA) return teamB;
        return null;
    }

    @Transient
    public Team getLoser() {
        if (!hasScore()) return null;
        
        // Si tirs au but
        if (Boolean.TRUE.equals(wentToPenalties)) {
            if (penaltyScoreTeamA == null || penaltyScoreTeamB == null) return null;
            return penaltyScoreTeamA < penaltyScoreTeamB ? teamA : teamB;
        }
        
        // Si prolongations
        if (Boolean.TRUE.equals(wentToExtraTime)) {
            if (extraTimeScoreTeamA == null || extraTimeScoreTeamB == null) return null;
            if (extraTimeScoreTeamA < extraTimeScoreTeamB) return teamA;
            if (extraTimeScoreTeamB < extraTimeScoreTeamA) return teamB;
            return null;
        }
        
        // Score normal
        if (scoreTeamA < scoreTeamB) return teamA;
        if (scoreTeamB < scoreTeamA) return teamB;
        return null;
    }

    @Transient
    public boolean isDraw() {
        if (!hasScore()) return false;
        
        if (Boolean.TRUE.equals(wentToPenalties)) {
            return false;
        }
        
        if (Boolean.TRUE.equals(wentToExtraTime)) {
            return extraTimeScoreTeamA != null && extraTimeScoreTeamA.equals(extraTimeScoreTeamB);
        }
        
        return scoreTeamA.equals(scoreTeamB);
    }

    @Transient
    public String getFullScore() {
        if (!hasScore()) return "-";
        
        StringBuilder sb = new StringBuilder();
        sb.append(scoreTeamA).append(" - ").append(scoreTeamB);
        
        if (Boolean.TRUE.equals(wentToExtraTime)) {
            sb.append(" (après prolongations: ")
              .append(extraTimeScoreTeamA).append(" - ").append(extraTimeScoreTeamB)
              .append(")");
        }
        
        if (Boolean.TRUE.equals(wentToPenalties)) {
            sb.append(" (tirs au but: ")
              .append(penaltyScoreTeamA).append(" - ").append(penaltyScoreTeamB)
              .append(")");
        }
        
        return sb.toString();
    }

    // ========== MÉTHODES HELPER - TYPES ==========

    @Transient
    public boolean isGroupMatch() {
        return group != null;
    }

    @Transient
    public boolean isKnockoutMatch() {
        return round != null && !round.isEmpty();
    }

    @Transient
    public int getGoalDifference(Team team) {
        if (!hasScore()) return 0;
        
        Integer finalScoreA = Boolean.TRUE.equals(wentToExtraTime) && extraTimeScoreTeamA != null
            ? extraTimeScoreTeamA
            : scoreTeamA;
            
        Integer finalScoreB = Boolean.TRUE.equals(wentToExtraTime) && extraTimeScoreTeamB != null
            ? extraTimeScoreTeamB
            : scoreTeamB;
        
        if (team.equals(teamA)) {
            return finalScoreA - finalScoreB;
        } else if (team.equals(teamB)) {
            return finalScoreB - finalScoreA;
        }
        
        return 0;
    }

    // ========== MÉTHODES HELPER - PLANNING ==========

    @Transient
    public LocalDateTime getScheduledDateTime() {
        if (date == null || time == null) return null;
        return LocalDateTime.of(date, time);
    }

    @Transient
    public boolean isScheduled() {
        return date != null && time != null;
    }
}