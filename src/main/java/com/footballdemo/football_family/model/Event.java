package com.footballdemo.football_family.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

import lombok.*;

import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "event", indexes = {
    @Index(name = "idx_event_visibility", columnList = "visibility"),
    @Index(name = "idx_event_date", columnList = "date"),
    @Index(name = "idx_event_status", columnList = "status"),
    @Index(name = "idx_event_type", columnList = "type"),
    @Index(name = "idx_event_club_id", columnList = "club_id")
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

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RegistrationType registrationType;

    // 🆕 Format de l'événement (tournoi ou match unique)
    @Enumerated(EnumType.STRING)
@Builder.Default
private EventFormat format = EventFormat.TOURNAMENT;

    @Column(nullable = false)
    private LocalDate date;

    private LocalDateTime startTime;
    private LocalDateTime endTime;

    private String location;
    private String address;
    private String city;
    private String zipCode;

    // ========== NOUVEAUX CHAMPS (FÉVRIER 2026) ==========

@Column(name = "category", length = 50)
private String category; // U7, U9, U11, U13, etc.

@Column(name = "level", length = 50)
private String level; // LOISIR, AMATEUR, COMPETITION, ELITE

@Column(name = "num_fields")
private Integer numFields; // Nombre de terrains

@Column(name = "surface", length = 50)
private String surface; // SYNTHETIC, NATURAL, INDOOR, BEACH

// Services disponibles
@Column(name = "has_parking")
@Builder.Default
private Boolean hasParking = false;

@Column(name = "has_vestiaires")
@Builder.Default
private Boolean hasVestiaires = false;

@Column(name = "has_douches")
@Builder.Default
private Boolean hasDouches = false;

@Column(name = "has_buvette")
@Builder.Default
private Boolean hasBuvette = false;

@Column(name = "has_wifi")
@Builder.Default
private Boolean hasWifi = false;

@Column(name = "has_first_aid")
@Builder.Default
private Boolean hasFirstAid = false;

@Column(name = "rules", columnDefinition = "TEXT")
private String rules; // Règlement du tournoi

@Column(name = "contact_email", length = 255)
private String contactEmail;

@Column(name = "contact_phone", length = 50)
private String contactPhone;

    /**
     * Capacité TOTALE de l'événement :
     * - INDIVIDUAL : nombre max de JOUEURS (ex: 20)
     * - CLUB_ONLY : nombre max d'ÉQUIPES (ex: 16)
     */
    private Integer maxParticipants;
    
    /**
     * Pour CLUB_ONLY uniquement : nombre max d'équipes PAR CLUB (ex: 2)
     * Si null → pas de limite par club
     */
    private Integer maxTeamsPerClub;


    /**
 * Prix d'inscription en centimes (0 = gratuit)
 * - INDIVIDUAL : prix par personne (par défaut côté UI)
 * - CLUB_ONLY  : prix par équipe (par défaut côté UI)
 */
@Column(name = "registration_fee_cents", nullable = false)
@Builder.Default
private Integer registrationFeeCents = 0;



    /**
 * 🆕 Nombre d'équipes acceptées (pour gestion capacité)
 */
@Column(name = "accepted_participants")
@Builder.Default
private Integer acceptedParticipants = 0;

    // ========== CLÔTURE DES INSCRIPTIONS ==========

    @Builder.Default
    @Column(name = "registration_closed", nullable = false)
    private boolean registrationClosed = false;

    @Column(name = "registration_deadline")
    private LocalDateTime registrationDeadline;

    @Builder.Default
    @Column(nullable = false)
    private boolean teamsFormed = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "club_id")
    @JsonIgnore
    private Club club;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organizer_id", nullable = false)
    @JsonIgnore
    private User organizer;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EventVisibility visibility;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EventStatus status = EventStatus.PUBLISHED;

    // ================= SOFT DELETE =================
    @Column(nullable = false)
    @Builder.Default
    private boolean deleted = false;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @Column(name = "deleted_by")
    private Long deletedBy; // 🆕 ID de l'user qui a supprimé

    // ========== RELATIONS ==========

    @OneToMany(mappedBy = "event", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<EventRegistration> registrations = new ArrayList<>();

    @OneToMany(mappedBy = "event", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<Team> teams = new ArrayList<>();

    @OneToMany(mappedBy = "event", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<Media> mediaUploads = new ArrayList<>();

    @OneToMany(mappedBy = "event", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<Match> matches = new ArrayList<>();

    // ========== AUTRES CHAMPS ==========

    private String imageUrl;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

@JsonIgnore
@Transient  // ⭐ Indique à JPA de ne PAS chercher en base
private Long drawSeed;


    @Column(name = "actual_start_date_time")
    private LocalDateTime actualStartDateTime;

    @Column(name = "actual_end_date_time")
    private LocalDateTime actualEndDateTime;

    @Column(name = "group_count")
    private Integer groupCount;

    @Column(name = "qualified_per_group")
    private Integer qualifiedPerGroup;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "VARCHAR(50) DEFAULT 'REGISTRATION'")
    private TournamentPhase tournamentPhase = TournamentPhase.REGISTRATION;

    @ElementCollection
    @CollectionTable(name = "qualified_teams", joinColumns = @JoinColumn(name = "event_id"))
    @Column(name = "team_id")
    private List<Long> qualifiedTeamIds = new ArrayList<>();

    /* =========================
       LIFECYCLE
       ========================= */

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();

        if (tournamentPhase == null) {
            tournamentPhase = TournamentPhase.REGISTRATION;
        }
        
        validateInvariants();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
        validateInvariants();
    }

    /* =========================
       MÉTIER - SOFT DELETE
       ========================= */

    /**
     * 🆕 Soft delete de l'event (VERSION PRO)
     * @param userId ID de l'utilisateur qui supprime
     */
public boolean softDelete(Long userId) {
    if (this.deleted) {
        return false; // ✅ déjà supprimé => idempotent
    }

    if (!isDeletable()) {
        throw new IllegalStateException("Cannot delete event in ONGOING status");
    }

    this.deleted = true;
    this.deletedAt = LocalDateTime.now();
    this.deletedBy = userId;
    return true;
}


    /**
     * 🆕 Restaurer un event supprimé
     */
    public void restore() {
        if (!this.deleted) {
            throw new IllegalStateException("Event is not deleted");
        }
        
        this.deleted = false;
        this.deletedAt = null;
        this.deletedBy = null;
        // Status reste ARCHIVED, l'admin doit le changer manuellement
    }

    /**
     * 🆕 Vérifie si l'event peut être supprimé
     */
    @Transient
    public boolean isDeletable() {
        // On ne peut pas supprimer un event EN COURS
        return !deleted && status != EventStatus.ONGOING;
    }

    /* =========================
       AUTRES MÉTHODES MÉTIER
       ========================= */

    @Transient
    public boolean isEditable() {
        return tournamentPhase == TournamentPhase.REGISTRATION
            && status == EventStatus.PUBLISHED
            && !deleted;
    }

    @Transient
    public boolean isClubOnly() {
        return registrationType == RegistrationType.CLUB_ONLY;
    }

    @Transient
    public boolean isIndividual() {
        return registrationType == RegistrationType.INDIVIDUAL;
    }


    // 🆕 Méthodes helper pour le format
@Transient
public boolean isTournament() {
    return format == EventFormat.TOURNAMENT;
}

@Transient
public boolean isSingleMatch() {
    return format == EventFormat.SINGLE_MATCH;
}

    @Transient
    public int getCapacity() {
        return maxParticipants == null ? 0 : maxParticipants;
    }

    @Transient
    public boolean isRegistrationOpen() {
        if (registrationClosed) {
            return false;
        }

        if (groupCount != null) {
            return false;
        }

        if (status == EventStatus.COMPLETED || status == EventStatus.CANCELED) {
            return false;
        }

        if (registrationDeadline != null && LocalDateTime.now().isAfter(registrationDeadline)) {
            return false;
        }

        LocalDateTime cutoff = (endTime != null)
                ? endTime
                : (date != null ? date.atTime(LocalTime.MAX) : null);

        return cutoff != null && cutoff.isAfter(LocalDateTime.now());
    }

    @Transient
    public boolean isFull(int acceptedParticipants) {
        return getCapacity() > 0 && acceptedParticipants >= getCapacity();
    }

    @Transient
    public int remainingSlots(int acceptedParticipants) {
        if (getCapacity() <= 0) return 0;
        return Math.max(0, getCapacity() - acceptedParticipants);
    }

    /* =========================
       VALIDATIONS
       ========================= */
    
    private void validateInvariants() {
        if (registrationType == null)
            throw new IllegalStateException("registrationType obligatoire");

        if (type == null)
            throw new IllegalStateException("type obligatoire");

        if (visibility == null)
            throw new IllegalStateException("visibility obligatoire");

        if (date == null)
            throw new IllegalStateException("date obligatoire");

       if (organizer == null)
    throw new IllegalStateException("organizer obligatoire");

// 🆕 Validation format
if (format == null)
    throw new IllegalStateException("format obligatoire");

// 🆕 Si SINGLE_MATCH, on ignore les validations de tournoi
if (isSingleMatch()) {
    // Pour un match unique, pas besoin de maxParticipants ni maxTeamsPerClub
    if (startTime != null && endTime != null && !endTime.isAfter(startTime)) {
        throw new IllegalStateException("endTime doit être après startTime");
    }
    return; // On sort ici
}

// Validations UNIQUEMENT pour TOURNAMENT
if (isClubOnly()) {
            if (maxParticipants == null || maxParticipants <= 0) {
                throw new IllegalStateException(
                    "CLUB_EVENT requiert maxParticipants > 0"
                );
            }
            if (maxTeamsPerClub == null || maxTeamsPerClub <= 0) {
                throw new IllegalStateException(
                    "CLUB_EVENT requiert maxTeamsPerClub > 0"
                );
            }
        }

        if (isIndividual()) {
            if (maxParticipants == null || maxParticipants <= 0) {
                throw new IllegalStateException(
                    "INDIVIDUAL requiert maxParticipants > 0"
                );
            }
        }

        if (startTime != null && endTime != null && !endTime.isAfter(startTime)) {
            throw new IllegalStateException("endTime doit être après startTime");
        }
    }
}