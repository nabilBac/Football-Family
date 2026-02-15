package com.footballdemo.football_family.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "event_registration",
    uniqueConstraints = {
        @UniqueConstraint(columnNames = { "event_id", "player_id" }),
        @UniqueConstraint(columnNames = { "event_id", "team_id" })
    },
    indexes = {
        @Index(name = "idx_registration_event", columnList = "event_id"),
        @Index(name = "idx_registration_player", columnList = "player_id"),
        @Index(name = "idx_registration_team", columnList = "team_id"),
        @Index(name = "idx_registration_status", columnList = "status"),
        @Index(name = "idx_registration_event_status", columnList = "event_id, status") // 🆕
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventRegistration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "player_id")
    private User player;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id")
    private Team team;

    @Column(nullable = false)
    private LocalDate registrationDate;

    private LocalDateTime confirmedAt;

    @Builder.Default // 🆕
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RegistrationStatus status = RegistrationStatus.PENDING; // 🆕


    @Builder.Default
@Column(name = "payment_status", length = 20)
private String paymentStatus = "UNPAID";

    /**
     * Pour INDIVIDUAL uniquement : équipe assignée après formation automatique.
     * NULL pour CLUB_ONLY (team contient déjà l'équipe).
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_team_id")
    private Team assignedTeam;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (registrationDate == null) {
            registrationDate = LocalDate.now();
        }
        validateInvariants(); // 🆕
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
        validateInvariants(); // 🆕
    }

    /**
     * Validation des règles métier.
     */
    private void validateInvariants() {
        if (event == null) {
            throw new IllegalStateException("EventRegistration doit avoir un event");
        }

        if (status == null) {
            throw new IllegalStateException("EventRegistration doit avoir un status");
        }

        boolean hasPlayer = (player != null);
        boolean hasTeam = (team != null);

        if (!hasPlayer && !hasTeam) {
            throw new IllegalStateException(
                "EventRegistration doit avoir soit un player, soit une team"
            );
        }

        if (hasPlayer && hasTeam) {
            throw new IllegalStateException(
                "EventRegistration ne peut pas avoir à la fois un player ET une team"
            );
        }
    }

    /**
     * Accepte l'inscription et enregistre la date de confirmation.
     */
    public void accept() {
        this.status = RegistrationStatus.ACCEPTED;
        this.confirmedAt = LocalDateTime.now();
    }

    /**
     * Refuse l'inscription et enregistre la date.
     */
    public void reject() {
        this.status = RegistrationStatus.REJECTED;
        this.confirmedAt = LocalDateTime.now();
    }

    /**
     * Vérifie si l'inscription est en attente.
     */
    @Transient
    public boolean isPending() {
        return status == RegistrationStatus.PENDING;
    }

    /**
     * Vérifie si l'inscription est acceptée.
     */
    @Transient
    public boolean isAccepted() {
        return status == RegistrationStatus.ACCEPTED;
    }
}