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
    @Index(name = "idx_event_date", columnList = "date")
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

    @Column(nullable = false)
    private LocalDate date;

    private LocalDateTime startTime;
    private LocalDateTime endTime;

    private String location;
    private String address;
    private String city;
    private String zipCode;

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

    // ========== CLÔTURE DES INSCRIPTIONS ==========

@Builder.Default
@Column(name = "registration_closed", nullable = false)
private Boolean registrationClosed = false;

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
    private EventStatus status = EventStatus.UPCOMING;

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

    private String imageUrl;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

@Column(name = "group_count")
private Integer groupCount;

@Column(name = "qualified_per_group")
private Integer qualifiedPerGroup;

@Builder.Default
@Enumerated(EnumType.STRING)
@Column(nullable = false)
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
       MÉTIER
       ========================= */

    @Transient
    public boolean isClubOnly() {
        return registrationType == RegistrationType.CLUB_ONLY;
    }

    @Transient
    public boolean isIndividual() {
        return registrationType == RegistrationType.INDIVIDUAL;
    }

    /**
     * 👉 CAPACITÉ UNIQUE POUR L’AFFICHAGE (0 / 16)
     */
    @Transient
    public int getCapacity() {
        return maxParticipants == null ? 0 : maxParticipants;
    }

  @Transient
public boolean isRegistrationOpen() {
    // 🔒 1. Vérifier si les inscriptions sont manuellement fermées
    if (Boolean.TRUE.equals(registrationClosed)) {
        return false;
    }

    // ❌ 2. Vérifier le statut de l'événement
    if (status == EventStatus.FINISHED || status == EventStatus.CANCELED) {
        return false;
    }

    // ⏰ 3. Vérifier la deadline si définie
    if (registrationDeadline != null && LocalDateTime.now().isAfter(registrationDeadline)) {
        return false;
    }

    // 📅 4. Sinon, vérifier si l'événement est dans le futur
    LocalDateTime cutoff = (endTime != null)
            ? endTime
            : (date != null ? date.atTime(LocalTime.MAX) : null);

    return cutoff != null && cutoff.isAfter(LocalDateTime.now());
}


    /**
 * Vérifie si l'événement est complet.
 * ⚠️ Nécessite le comptage externe des participants acceptés.
 * 
 * @param acceptedParticipants Nombre de participants/équipes ACCEPTÉS
 * @return true si capacité atteinte
 */

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

        // 🔒 PHASE DE TOURNOI OBLIGATOIRE
if (tournamentPhase == null) {
    throw new IllegalStateException("tournamentPhase obligatoire");
}


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

        // ✅ CLUB_EVENT → capacité globale obligatoire (16)
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

        // ✅ OPEN_EVENT individuel
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
