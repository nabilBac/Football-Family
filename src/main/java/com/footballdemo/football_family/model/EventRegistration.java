package com.footballdemo.football_family.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Représente l'inscription d'un joueur à un événement.
 * Supporte 2 modes :
 * - Inscription INDIVIDUELLE (UTF) : assignedTeam NULL jusqu'à formation des
 * équipes
 * - Inscription par ÉQUIPE (Spond) : team pré-remplie
 */
@Entity
@Table(name = "event_registration", uniqueConstraints = @UniqueConstraint(columnNames = { "event_id",
        "player_id" }), indexes = {
                @Index(name = "idx_registration_event", columnList = "event_id"),
                @Index(name = "idx_registration_player", columnList = "player_id"),
                @Index(name = "idx_registration_status", columnList = "status")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventRegistration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 🔹 Relations principales
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "player_id", nullable = false)
    private User player;

    // 🔹 Dates
    @Column(nullable = false)
    private LocalDate registrationDate;

    private LocalDateTime confirmedAt;

    // 🔹 Statut de l'inscription
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private RegistrationStatus status = RegistrationStatus.EN_ATTENTE;

    // 🔹 Pour mode TEAM_BASED : équipe du joueur (pré-remplie)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id")
    private Team team;

    // 🆕 NOUVEAU : Pour mode INDIVIDUAL (UTF) : équipe assignée APRÈS inscription
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_team_id")
    private Team assignedTeam; // NULL jusqu'à ce que l'organisateur forme les équipes

    // 🆕 NOUVEAU : Préférences du joueur (pour équilibrage UTF)
    @Enumerated(EnumType.STRING)
    private PlayerLevel level; // Niveau de compétence

    @Enumerated(EnumType.STRING)
    private PlayerPosition preferredPosition; // Position préférée

    @Column(length = 500)
    private String notes; // Notes du joueur (ex: "Disponible que l'après-midi")

    // 🆕 NOUVEAU : Paiement (si événement payant)
    private Boolean paid = false;
    private Double amount;
    private LocalDateTime paidAt;

    // 🔹 Métadonnées
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
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // ═══════════════════════════════════════════════════════════
    // MÉTHODES UTILITAIRES
    // ═══════════════════════════════════════════════════════════

    /**
     * Vérifie si l'inscription est confirmée/validée
     */
    public boolean isConfirmed() {
        return status == RegistrationStatus.VALIDE;
    }

    /**
     * Vérifie si l'inscription est en attente
     */
    public boolean isPending() {
        return status == RegistrationStatus.EN_ATTENTE;
    }

    /**
     * Vérifie si l'inscription a été refusée
     */
    public boolean isRejected() {
        return status == RegistrationStatus.REFUSE;
    }

    /**
     * Vérifie si le joueur est assigné à une équipe (mode UTF)
     */
    public boolean hasTeamAssigned() {
        return assignedTeam != null;
    }

    /**
     * Retourne l'équipe effective (assignedTeam pour UTF, team pour Spond)
     */
    public Team getEffectiveTeam() {
        return assignedTeam != null ? assignedTeam : team;
    }

    /**
     * Confirme l'inscription
     */
    public void confirm() {
        this.status = RegistrationStatus.VALIDE;
        this.confirmedAt = LocalDateTime.now();
    }

    /**
     * Refuse l'inscription
     */
    public void reject() {
        this.status = RegistrationStatus.REFUSE;
    }

    /**
     * Annule l'inscription
     */
    public void cancel() {
        this.status = RegistrationStatus.ANNULE;
    }

    /**
     * Marque le paiement comme effectué
     */
    public void markAsPaid(Double amount) {
        this.paid = true;
        this.amount = amount;
        this.paidAt = LocalDateTime.now();
    }

    /**
     * Vérifie si le paiement a été effectué
     */
    public boolean isPaid() {
        return paid != null && paid;
    }

    /**
     * Assigne le joueur à une équipe (mode UTF)
     */
    public void assignToTeam(Team team) {
        this.assignedTeam = team;
        if (!team.getRegistrations().contains(this)) {
            team.getRegistrations().add(this);
        }
    }

    /**
     * Retire l'assignation d'équipe
     */
    public void removeTeamAssignment() {
        if (this.assignedTeam != null) {
            this.assignedTeam.getRegistrations().remove(this);
            this.assignedTeam = null;
        }
    }

    // ═══════════════════════════════════════════════════════════
    // VALIDATION
    // ═══════════════════════════════════════════════════════════

    /**
     * Vérifie si l'inscription peut être modifiée
     */
    public boolean canBeModified() {
        return status == RegistrationStatus.EN_ATTENTE;
    }

    /**
     * Vérifie si l'inscription peut être annulée
     */
    public boolean canBeCancelled() {
        return status != RegistrationStatus.ANNULE &&
                event != null &&
                event.getStatus() == EventStatus.PLANNED;
    }

    @Override
    public String toString() {
        return "EventRegistration{" +
                "id=" + id +
                ", player=" + (player != null ? player.getUsername() : "null") +
                ", event=" + (event != null ? event.getName() : "null") +
                ", status=" + status +
                ", assignedTeam=" + (assignedTeam != null ? assignedTeam.getName() : "none") +
                ", level=" + level +
                ", position=" + preferredPosition +
                '}';
    }
}
