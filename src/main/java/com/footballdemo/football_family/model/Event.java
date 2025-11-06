package com.footballdemo.football_family.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

/**
 * Représente un événement sportif dans le système.
 * Supporte 2 modes :
 * - INDIVIDUAL (UTF) : Tournoi ouvert avec inscriptions individuelles
 * - TEAM_BASED (Spond) : Match entre équipes pré-existantes
 */
@Entity
@Table(name = "event", indexes = {
        @Index(name = "idx_event_visibility", columnList = "visibility"),
        @Index(name = "idx_event_date", columnList = "date"),
        @Index(name = "idx_event_registration_type", columnList = "registrationType")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Event {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EventType type;

    // 🆕 NOUVEAU : Type d'inscription (INDIVIDUAL ou TEAM_BASED)
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private RegistrationType registrationType = RegistrationType.INDIVIDUAL;

    @Column(nullable = false)
    private LocalDate date;

    private LocalDateTime startTime;
    private LocalDateTime endTime;

    @Column(nullable = false, length = 255)
    private String location;

    private String address;
    private String city;
    private String zipCode;

    // 🔹 Relations avec Club et Organisateur
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "club_id")
    private Club club; // Optionnel (NULL pour tournois ouverts)

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organizer_id", nullable = false)
    private User organizer;

    // 🔹 Visibilité et capacité
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Visibility visibility = Visibility.PUBLIC;

    private Integer maxParticipants;

    // 🆕 NOUVEAU : Nombre d'équipes à former (pour mode INDIVIDUAL)
    private Integer numberOfTeams;

    // 🆕 NOUVEAU : Taille des équipes (5v5, 7v7, 11v11)
    private Integer teamSize;

    // 🔹 Statut de l'événement
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private EventStatus status = EventStatus.PLANNED;

    // 🆕 NOUVEAU : Indique si les équipes ont été formées (mode INDIVIDUAL)
    @Column(nullable = false)
    @Builder.Default
    private Boolean teamsFormed = false;

    // 🔹 Relations
    @OneToMany(mappedBy = "event", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Match> matches = new ArrayList<>();

    @OneToMany(mappedBy = "event", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<EventRegistration> registrations = new ArrayList<>();

    @OneToMany(mappedBy = "event", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Media> mediaUploads = new ArrayList<>();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "event_teams", joinColumns = @JoinColumn(name = "event_id"), inverseJoinColumns = @JoinColumn(name = "team_id"))
    @Builder.Default
    private Set<Team> teams = new HashSet<>();

    // 🔹 Phases de tournoi (pour tournois à élimination)
    @OneToMany(mappedBy = "event", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<TournamentPhase> phases = new ArrayList<>();

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
     * Vérifie si l'événement est en mode inscription individuelle (UTF)
     */
    public boolean isIndividualRegistration() {
        return registrationType == RegistrationType.INDIVIDUAL;
    }

    /**
     * Vérifie si l'événement est en mode équipes pré-existantes (Spond)
     */
    public boolean isTeamBasedRegistration() {
        return registrationType == RegistrationType.TEAM_BASED;
    }

    /**
     * Vérifie si l'événement a atteint sa capacité maximale
     */
    public boolean isFull() {
        if (maxParticipants == null)
            return false;
        return getConfirmedParticipantsCount() >= maxParticipants;
    }

    /**
     * Compte le nombre de participants confirmés
     */
    public int getConfirmedParticipantsCount() {
        if (registrations == null)
            return 0;
        return (int) registrations.stream()
                .filter(r -> r.getStatus() == RegistrationStatus.VALIDE)
                .count();
    }

    /**
     * Vérifie si l'événement peut encore accepter des inscriptions
     */
    public boolean canAcceptRegistrations() {
        return status == EventStatus.PLANNED && !isFull();
    }

    // ═══════════════════════════════════════════════════════════
    // GESTION DES MATCHES
    // ═══════════════════════════════════════════════════════════

    public void addMatch(Match match) {
        if (matches == null)
            matches = new ArrayList<>();
        matches.add(match);
        match.setEvent(this);
    }

    public void removeMatch(Match match) {
        if (matches != null) {
            matches.remove(match);
            match.setEvent(null);
        }
    }

    // ═══════════════════════════════════════════════════════════
    // GESTION DES ÉQUIPES
    // ═══════════════════════════════════════════════════════════

    public void addTeam(Team team) {
        if (teams == null)
            teams = new HashSet<>();
        teams.add(team);
    }

    public void removeTeam(Team team) {
        if (teams != null) {
            teams.remove(team);
        }
    }

    // ═══════════════════════════════════════════════════════════
    // GESTION DES INSCRIPTIONS
    // ═══════════════════════════════════════════════════════════

    /**
     * Ajoute un participant à l'événement (mode INDIVIDUAL)
     */
    public void addParticipant(User player) {
        if (registrations == null)
            registrations = new ArrayList<>();

        boolean alreadyRegistered = registrations.stream()
                .anyMatch(r -> r.getPlayer().equals(player));
        if (alreadyRegistered)
            return;

        EventRegistration registration = EventRegistration.builder()
                .event(this)
                .player(player)
                .registrationDate(LocalDate.now())
                .status(RegistrationStatus.EN_ATTENTE)
                .build();

        registrations.add(registration);
        if (player.getRegistrations() == null) {
            player.setRegistrations(new ArrayList<>());
        }
        player.getRegistrations().add(registration);
    }

    /**
     * Retire un participant de l'événement
     */
    public void removeParticipant(User player) {
        if (registrations == null)
            return;

        registrations.removeIf(r -> {
            if (r.getPlayer().equals(player)) {
                if (player.getRegistrations() != null) {
                    player.getRegistrations().remove(r);
                }
                return true;
            }
            return false;
        });
    }

    // ═══════════════════════════════════════════════════════════
    // GESTION DES MÉDIAS
    // ═══════════════════════════════════════════════════════════

    public void addMedia(Media media) {
        if (mediaUploads == null)
            mediaUploads = new ArrayList<>();
        mediaUploads.add(media);
        media.setEvent(this);
    }

    public void removeMedia(Media media) {
        if (mediaUploads != null) {
            mediaUploads.remove(media);
            media.setEvent(null);
        }
    }

    // ═══════════════════════════════════════════════════════════
    // VALIDATION
    // ═══════════════════════════════════════════════════════════

    /**
     * Vérifie si l'utilisateur est l'organisateur de cet événement
     */
    public boolean isOrganizer(User user) {
        return organizer != null && organizer.getId().equals(user.getId());
    }

    /**
     * Vérifie si l'utilisateur peut modifier cet événement
     */
    public boolean canBeModifiedBy(User user) {
        return isOrganizer(user) || user.isSuperAdmin();
    }

    @Override
    public String toString() {
        return "Event{" +
                "id=" + id +
                ", name='" + name + '\'' +
                ", type=" + type +
                ", registrationType=" + registrationType +
                ", date=" + date +
                ", status=" + status +
                ", teamsFormed=" + teamsFormed +
                '}';
    }
}
