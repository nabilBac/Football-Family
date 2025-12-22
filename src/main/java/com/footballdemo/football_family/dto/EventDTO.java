package com.footballdemo.football_family.dto;

import com.footballdemo.football_family.model.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventDTO {

    private Long id;
    private String name;
    private String description;
    private Integer capacity;

    // ===== CLUB REGISTRATION STATE =====
    private Boolean clubAlreadyRegistered;
    private String clubRegistrationStatus;
    private Integer pendingTeamsByMyClub; // 🆕

    // Image
    private String imageUrl;

    private EventType type;
    private RegistrationType registrationType;
    private EventVisibility visibility;
    private EventStatus status;

    private TournamentPhase tournamentPhase;

    private LocalDate date;
    private LocalDateTime startTime;
    private LocalDateTime endTime;

    private String location;
    private String address;
    private String city;
    private String zipCode;

    private Integer maxParticipants;
    private Integer acceptedParticipants;
    private Integer remainingPlaces;

    // ===== QUOTA PAR CLUB =====
    private Integer maxTeamsPerClub;
    private Integer teamsRegisteredByMyClub;
    private Integer remainingTeamsForMyClub;

    // ========== CLÔTURE DES INSCRIPTIONS ==========
    private Boolean registrationClosed;
    private LocalDateTime registrationDeadline;
    private Boolean isFull;

    private Long organizerId;
    private String organizerUsername;

    private Long clubId;
    private String clubName;

    private boolean isOrganizer;
    private boolean isClubOnly;

    private List<Long> teamIds;
    private List<Long> mediaIds;

    // =====================================================
    // FACTORY
    // =====================================================
    public static EventDTO from(
            Event event,
            Long currentUserId,
            Integer acceptedParticipants,
            Integer teamsRegisteredByMyClub,
            Integer pendingTeamsByMyClub
    ) {
        if (event == null) return null;

        User organizer = event.getOrganizer();
        Club club = event.getClub();

        // ===== CAPACITÉ & RESTANT =====
        Integer capacity = event.getRegistrationType() == RegistrationType.CLUB_ONLY
                ? event.getMaxTeamsPerClub()
                : event.getMaxParticipants();

        Integer remainingPlaces = (capacity != null && acceptedParticipants != null)
                ? Math.max(capacity - acceptedParticipants, 0)
                : null;

        Integer remainingTeamsForMyClub = null;
        if (event.isClubOnly() && teamsRegisteredByMyClub != null) {
            remainingTeamsForMyClub = Math.max(
                event.getMaxTeamsPerClub() - teamsRegisteredByMyClub, 0
            );
        }

// ===== CALCULER SI COMPLET =====
boolean isFull = false;

if (event.getRegistrationType() == RegistrationType.INDIVIDUAL) {
    // INDIVIDUAL : comparer participants acceptés vs capacité totale
    if (event.getMaxParticipants() != null && acceptedParticipants != null) {
        isFull = acceptedParticipants >= event.getMaxParticipants();
    }
}

if (event.getRegistrationType() == RegistrationType.CLUB_ONLY) {
    // CLUB_ONLY : comparer équipes acceptées (tous clubs) vs capacité totale
    if (event.getMaxParticipants() != null && acceptedParticipants != null) {
        isFull = acceptedParticipants >= event.getMaxParticipants();
    }
}

        return EventDTO.builder()
                .id(event.getId())
                .name(event.getName())
                .description(event.getDescription())
                .imageUrl(event.getImageUrl())
                .capacity(capacity)

                // ===== MÉTIER =====
                .type(event.getType())
                .registrationType(event.getRegistrationType())
                .visibility(event.getVisibility())
                .status(event.getStatus())
                .tournamentPhase(event.getTournamentPhase())

                // ===== DATE / LIEU =====
                .date(event.getDate())
                .startTime(event.getStartTime())
                .endTime(event.getEndTime())
                .location(event.getLocation())
                .address(event.getAddress())
                .city(event.getCity())
                .zipCode(event.getZipCode())

                // ===== CAPACITÉ / INSCRIPTIONS =====
                .maxParticipants(event.getMaxParticipants())
                .acceptedParticipants(acceptedParticipants)
                .remainingPlaces(remainingPlaces)

                // ===== CLUB / QUOTAS =====
                .maxTeamsPerClub(event.getMaxTeamsPerClub())
                .teamsRegisteredByMyClub(teamsRegisteredByMyClub)
                .remainingTeamsForMyClub(remainingTeamsForMyClub)
                .pendingTeamsByMyClub(pendingTeamsByMyClub) // 🆕

                // ===== CLÔTURE =====
                .registrationClosed(event.getRegistrationClosed())
                .registrationDeadline(event.getRegistrationDeadline())
                .isFull(isFull)

                // ===== ORGANISATEUR =====
                .organizerId(organizer != null ? organizer.getId() : null)
                .organizerUsername(organizer != null ? organizer.getUsername() : null)

                // ===== CLUB =====
                .clubId(club != null ? club.getId() : null)
                .clubName(club != null ? club.getName() : null)

                // ===== UX FLAGS =====
                .isOrganizer(
                        currentUserId != null &&
                        organizer != null &&
                        organizer.getId().equals(currentUserId)
                )
                .isClubOnly(event.isClubOnly())
                .clubAlreadyRegistered(
                        teamsRegisteredByMyClub != null && teamsRegisteredByMyClub > 0
                )
                .clubRegistrationStatus(
                    // 🆕 LOGIQUE COMPLÈTE DU STATUT
                    pendingTeamsByMyClub != null && pendingTeamsByMyClub > 0 
                        ? "PENDING" 
                        : (teamsRegisteredByMyClub != null && teamsRegisteredByMyClub > 0 
                            ? "ACCEPTED" 
                            : null)
                )

                // ===== IDS =====
                .teamIds(event.getTeams() == null
                        ? List.of()
                        : event.getTeams()
                            .stream()
                            .map(Team::getId)
                            .collect(Collectors.toList())
                )
                .mediaIds(event.getMediaUploads() == null
                        ? List.of()
                        : event.getMediaUploads()
                            .stream()
                            .map(Media::getId)
                            .collect(Collectors.toList())
                )
                .build();
    }

    // =====================================================
    // OVERLOAD SIMPLE
    // =====================================================
    public static EventDTO from(Event event, Long currentUserId) {
        return from(event, currentUserId, null, null, null);
    }
}