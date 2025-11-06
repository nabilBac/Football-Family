package com.footballdemo.football_family.model;

import jakarta.persistence.*;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonManagedReference;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Représente une équipe de football.
 * Supporte 2 types :
 * - PERMANENT : Équipe officielle d'un club avec membres fixes
 * - TEMPORARY : Équipe créée pour un tournoi spécifique (UTF)
 */
@Entity
@Table(name = "team", indexes = {
        @Index(name = "idx_team_type", columnList = "teamType"),
        @Index(name = "idx_team_club", columnList = "club_id"),
        @Index(name = "idx_team_event", columnList = "event_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Team {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 50)
    private String category; // U13, U15, Senior, etc.

    // 🆕 NOUVEAU : Type d'équipe (PERMANENT ou TEMPORARY)
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private TeamType teamType = TeamType.PERMANENT;

    // 🔹 Pour équipes PERMANENTES (clubs)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "club_id")
    private Club club; // NULL pour équipes temporaires

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "coach_id")
    private User coach; // NULL pour équipes temporaires

    // 🆕 NOUVEAU : Pour équipes TEMPORAIRES (tournois UTF)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id")
    private Event event; // NULL pour équipes permanentes

    // 🆕 NOUVEAU : Couleur de l'équipe (pour tournois)
    @Column(length = 7)
    private String color; // Format HEX : #FF5733

    // 🔹 Joueurs de l'équipe
    @OneToMany(mappedBy = "team", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonManagedReference
    @Builder.Default
    private List<User> players = new ArrayList<>();

    // 🆕 NOUVEAU : Pour tournois UTF, on peut aussi lier via EventRegistration
    @OneToMany(mappedBy = "assignedTeam", fetch = FetchType.LAZY)
    @Builder.Default
    private List<EventRegistration> registrations = new ArrayList<>();

    // 🔹 Statistiques de l'équipe
    private Integer wins = 0;
    private Integer losses = 0;
    private Integer draws = 0;
    private Integer goalsScored = 0;
    private Integer goalsConceded = 0;

    // 🔹 Métadonnées
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

    // ═══════════════════════════════════════════════════════════
    // MÉTHODES UTILITAIRES
    // ═══════════════════════════════════════════════════════════

    /**
     * Vérifie si l'équipe est permanente (club)
     */
    public boolean isPermanent() {
        return teamType == TeamType.PERMANENT;
    }

    /**
     * Vérifie si l'équipe est temporaire (tournoi)
     */
    public boolean isTemporary() {
        return teamType == TeamType.TEMPORARY;
    }

    /**
     * Retourne le nombre total de joueurs
     */
    public int getPlayerCount() {
        int count = 0;
        if (players != null)
            count += players.size();
        if (registrations != null)
            count += registrations.size();
        return count;
    }

    /**
     * Calcule les points (victoire = 3, nul = 1, défaite = 0)
     */
    public int getPoints() {
        return (wins * 3) + draws;
    }

    /**
     * Calcule la différence de buts
     */
    public int getGoalDifference() {
        return goalsScored - goalsConceded;
    }

    // ═══════════════════════════════════════════════════════════
    // GESTION DES JOUEURS (pour équipes PERMANENTES)
    // ═══════════════════════════════════════════════════════════

    /**
     * Ajoute un joueur à l'équipe (pour équipes permanentes)
     */
    public void addPlayer(User player) {
        if (players == null)
            players = new ArrayList<>();

        if (!players.contains(player)) {
            players.add(player);
            player.setTeam(this);
        }
    }

    /**
     * Retire un joueur de l'équipe
     */
    public void removePlayer(User player) {
        if (players != null && players.contains(player)) {
            players.remove(player);
            player.setTeam(null);
        }
    }

    // ═══════════════════════════════════════════════════════════
    // GESTION DES INSCRIPTIONS (pour équipes TEMPORAIRES)
    // ═══════════════════════════════════════════════════════════

    /**
     * Assigne une inscription à cette équipe (pour tournois UTF)
     */
    public void addRegistration(EventRegistration registration) {
        if (registrations == null)
            registrations = new ArrayList<>();

        if (!registrations.contains(registration)) {
            registrations.add(registration);
            registration.setAssignedTeam(this);
        }
    }

    /**
     * Retire une inscription de cette équipe
     */
    public void removeRegistration(EventRegistration registration) {
        if (registrations != null && registrations.contains(registration)) {
            registrations.remove(registration);
            registration.setAssignedTeam(null);
        }
    }

    // ═══════════════════════════════════════════════════════════
    // GESTION DES STATISTIQUES
    // ═══════════════════════════════════════════════════════════

    /**
     * Met à jour les stats après un match gagné
     */
    public void recordWin(int goalsFor, int goalsAgainst) {
        wins++;
        goalsScored += goalsFor;
        goalsConceded += goalsAgainst;
    }

    /**
     * Met à jour les stats après un match perdu
     */
    public void recordLoss(int goalsFor, int goalsAgainst) {
        losses++;
        goalsScored += goalsFor;
        goalsConceded += goalsAgainst;
    }

    /**
     * Met à jour les stats après un match nul
     */
    public void recordDraw(int goalsFor, int goalsAgainst) {
        draws++;
        goalsScored += goalsFor;
        goalsConceded += goalsAgainst;
    }

    /**
     * Réinitialise toutes les statistiques
     */
    public void resetStats() {
        wins = 0;
        losses = 0;
        draws = 0;
        goalsScored = 0;
        goalsConceded = 0;
    }

    // ═══════════════════════════════════════════════════════════
    // VALIDATION
    // ═══════════════════════════════════════════════════════════

    /**
     * Vérifie si l'utilisateur est le coach de cette équipe
     */
    public boolean isCoach(User user) {
        return coach != null && coach.getId().equals(user.getId());
    }

    /**
     * Vérifie si l'utilisateur est membre de cette équipe
     */
    public boolean hasMember(User user) {
        if (players != null && players.stream().anyMatch(p -> p.getId().equals(user.getId()))) {
            return true;
        }
        if (registrations != null && registrations.stream()
                .anyMatch(r -> r.getPlayer().getId().equals(user.getId()))) {
            return true;
        }
        return false;
    }

    /**
     * Vérifie si l'utilisateur peut gérer cette équipe
     */
    public boolean canBeManagedBy(User user) {
        return isCoach(user) ||
                (club != null && club.isClubAdmin(user)) ||
                user.isSuperAdmin();
    }

    @Override
    public String toString() {
        return "Team{" +
                "id=" + id +
                ", name='" + name + '\'' +
                ", teamType=" + teamType +
                ", playerCount=" + getPlayerCount() +
                ", points=" + getPoints() +
                '}';
    }
}
