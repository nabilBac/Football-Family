package com.footballdemo.football_family.service;

import com.footballdemo.football_family.dto.CreateEventDTO;
import com.footballdemo.football_family.dto.RegisterToEventDTO;
import com.footballdemo.football_family.exception.*;
import com.footballdemo.football_family.model.*;
import com.footballdemo.football_family.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class EventService {

    private final EventRepository eventRepo;
    private final TeamRepository teamRepo;
    private final MatchRepository matchRepository;
    private final EventRegistrationRepository eventRegistrationRepo;
    private final UserRepository userRepo;
    private final MediaRepository mediaRepository;
    private final ClubRepository clubRepo;

    // ═══════════════════════════════════════════════════════════
    // CRÉATION D'ÉVÉNEMENTS
    // ═══════════════════════════════════════════════════════════

    /**
     * ✅ NOUVELLE MÉTHODE : Crée un événement à partir du DTO complet
     * Supporte INDIVIDUAL (UTF) et TEAM_BASED (Spond)
     */
    public Event createEventFromDTO(CreateEventDTO dto, User organizer) {
        log.info("Création événement: {} - Type: {} - RegistrationType: {}",
                dto.getName(), dto.getType(), dto.getRegistrationType());

        // Convertir les Strings en Enums
        EventType eventType = dto.getType() != null
                ? EventType.fromLabel(dto.getType())
                : null;

        RegistrationType registrationType = dto.getRegistrationType() != null
                ? RegistrationType.valueOf(dto.getRegistrationType())
                : RegistrationType.INDIVIDUAL;

        Visibility visibility = dto.getVisibility() != null
                ? Visibility.valueOf(dto.getVisibility())
                : Visibility.PUBLIC;

        // Créer l'événement
        Event event = Event.builder()
                .name(dto.getName())
                .description(dto.getDescription())
                .type(eventType)
                .registrationType(registrationType)
                .date(dto.getDate())
                .startTime(dto.getStartTime())
                .endTime(dto.getEndTime())
                .location(dto.getLocation())
                .address(dto.getAddress())
                .city(dto.getCity())
                .zipCode(dto.getZipCode())
                .visibility(visibility)
                .maxParticipants(dto.getMaxParticipants())
                .numberOfTeams(dto.getNumberOfTeams())
                .teamSize(dto.getTeamSize())
                .organizer(organizer)
                .status(EventStatus.PLANNED)
                .teamsFormed(false)
                .build();

        // Gérer le club si spécifié
        if (dto.getClubId() != null) {
            Club club = clubRepo.findById(dto.getClubId())
                    .orElseThrow(() -> new ResourceNotFoundException("Club", dto.getClubId()));
            event.setClub(club);
        }

        Event saved = eventRepo.save(event);
        log.info("✅ Événement créé avec succès - ID: {}", saved.getId());
        return saved;
    }

    /**
     * ANCIENNE MÉTHODE : Conservée pour compatibilité
     * Utilisée par les anciens endpoints qui n'utilisent pas encore CreateEventDTO
     */
    public Event createEvent(String name, String typeStr, LocalDate date, String location) {
        log.info("Création événement (ancienne méthode): {} - Type: {} - Date: {}", name, typeStr, date);

        EventType eventType = null;
        if (typeStr != null && !typeStr.isBlank()) {
            try {
                eventType = EventType.fromLabel(typeStr);
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Type d'événement invalide : " + typeStr);
            }
        }

        Event event = Event.builder()
                .name(name)
                .type(eventType)
                .date(date)
                .location(location)
                .status(EventStatus.PLANNED)
                .registrationType(RegistrationType.INDIVIDUAL) // Par défaut
                .teamsFormed(false)
                .build();

        Event saved = eventRepo.save(event);
        log.info("Événement créé avec succès - ID: {}", saved.getId());
        return saved;
    }

    // ═══════════════════════════════════════════════════════════
    // GESTION DES INSCRIPTIONS
    // ═══════════════════════════════════════════════════════════

    /**
     * ✅ NOUVELLE MÉTHODE : Inscription avec support UTF
     * Gère les préférences de niveau et position
     */
    public EventRegistration registerPlayerToEvent(RegisterToEventDTO dto, User player) {
        log.info("Inscription joueur {} à l'événement {}", player.getId(), dto.getEventId());

        Event event = eventRepo.findById(dto.getEventId())
                .orElseThrow(() -> new ResourceNotFoundException("Événement", dto.getEventId()));

        // Convertir les Strings en Enums
        PlayerLevel level = dto.getLevel() != null
                ? PlayerLevel.valueOf(dto.getLevel())
                : null;

        PlayerPosition position = dto.getPreferredPosition() != null
                ? PlayerPosition.valueOf(dto.getPreferredPosition())
                : null;

        EventRegistration registration = EventRegistration.builder()
                .event(event)
                .player(player)
                .registrationDate(LocalDate.now())
                .status(RegistrationStatus.EN_ATTENTE)
                .level(level)
                .preferredPosition(position)
                .notes(dto.getNotes())
                .build();

        // Gestion mode TEAM_BASED (Spond)
        if (dto.getTeamId() != null) {
            Team team = teamRepo.findById(dto.getTeamId())
                    .orElseThrow(() -> new ResourceNotFoundException("Équipe", dto.getTeamId()));
            registration.setTeam(team);
        }

        try {
            EventRegistration saved = eventRegistrationRepo.save(registration);
            log.info("✅ Inscription créée - ID: {}", saved.getId());
            return saved;
        } catch (org.springframework.dao.DataIntegrityViolationException ex) {
            log.warn("Doublon détecté pour joueur {} sur l'événement {}", player.getId(), dto.getEventId());
            throw new DuplicateResourceException("Le joueur est déjà inscrit à cet événement");
        }
    }

    /**
     * ANCIENNE MÉTHODE : Conservée pour compatibilité
     */
    public EventRegistration registerPlayerToEvent(Long eventId, Long playerId) {
        log.info("Inscription joueur {} à l'événement {} (ancienne méthode)", playerId, eventId);

        Event event = eventRepo.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Événement", eventId));

        User player = userRepo.findById(playerId)
                .orElseThrow(() -> new ResourceNotFoundException("Joueur", playerId));

        EventRegistration registration = EventRegistration.builder()
                .event(event)
                .player(player)
                .registrationDate(LocalDate.now())
                .status(RegistrationStatus.EN_ATTENTE)
                .build();

        try {
            EventRegistration saved = eventRegistrationRepo.save(registration);
            log.info("Inscription créée - ID: {}", saved.getId());
            return saved;
        } catch (org.springframework.dao.DataIntegrityViolationException ex) {
            log.warn("Doublon détecté pour joueur {} sur l'événement {}", playerId, eventId);
            throw new DuplicateResourceException("Le joueur est déjà inscrit à cet événement");
        }
    }

    public EventRegistration validateRegistration(Long eventId, Long registrationId) {
        Event event = eventRepo.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Événement", eventId));

        EventRegistration registration = eventRegistrationRepo.findById(registrationId)
                .orElseThrow(() -> new ResourceNotFoundException("Inscription non trouvée"));

        if (!registration.getEvent().getId().equals(eventId)) {
            throw new ForbiddenException("L'inscription ne correspond pas à cet événement");
        }

        registration.setStatus(RegistrationStatus.VALIDE);
        return eventRegistrationRepo.save(registration);
    }

    // ═══════════════════════════════════════════════════════════
    // GESTION DES ÉQUIPES
    // ═══════════════════════════════════════════════════════════

    public Event addTeamToEvent(Long eventId, Long teamId) {
        log.debug("Ajout équipe {} à l'événement {}", teamId, eventId);

        Event event = eventRepo.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Événement", eventId));

        Team team = teamRepo.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Équipe", teamId));

        if (event.getTeams().contains(team)) {
            log.warn("L'équipe {} est déjà dans l'événement {}", teamId, eventId);
            return event;
        }

        event.addTeam(team);
        Event saved = eventRepo.save(event);
        log.info("Équipe {} ajoutée à l'événement {}", teamId, eventId);
        return saved;
    }

    // ═══════════════════════════════════════════════════════════
    // RÉCUPÉRATION D'ÉVÉNEMENTS
    // ═══════════════════════════════════════════════════════════

    @Transactional(readOnly = true)
    public Page<Event> getAllEvents(Pageable pageable) {
        log.debug("Récupération de tous les événements - Page: {}", pageable.getPageNumber());
        return eventRepo.findAll(pageable);
    }

    @Transactional(readOnly = true)
    public Event getEventById(Long eventId) {
        log.debug("Récupération événement ID: {}", eventId);
        return eventRepo.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Événement", eventId));
    }

    @Transactional(readOnly = true)
    public Page<Event> filterAndSearch(String type, String term, Pageable pageable) {
        log.debug("Filtrage événements - Type: {}, Terme: {}", type, term);

        String cleanType = (type == null || "all".equalsIgnoreCase(type) || type.isBlank())
                ? null
                : type.trim();
        String cleanTerm = (term == null || term.isBlank()) ? null : term.trim();

        if (cleanType == null && cleanTerm == null) {
            return eventRepo.findAll(pageable);
        }

        if (cleanType == null) {
            return eventRepo.findByNameContainingIgnoreCaseOrLocationContainingIgnoreCase(
                    cleanTerm, cleanTerm, pageable);
        }

        if (cleanTerm == null) {
            EventType eventType = EventType.fromLabel(cleanType);
            return eventRepo.findByType(eventType, pageable);
        } else {
            EventType eventType = EventType.fromLabel(cleanType);
            return eventRepo.findByTypeAndNameContainingIgnoreCase(eventType, cleanTerm, pageable);
        }
    }

    @Transactional(readOnly = true)
    public Page<Event> getVisibleEvents(boolean isClubMember, Pageable pageable) {
        log.debug("Récupération événements visibles - Membre: {}", isClubMember);

        if (isClubMember) {
            List<Visibility> visibilities = Arrays.asList(Visibility.PUBLIC, Visibility.CLUB);
            return eventRepo.findByVisibilityIn(visibilities, pageable);
        }
        return eventRepo.findByVisibility(Visibility.PUBLIC, pageable);
    }

    @Transactional(readOnly = true)
    public Page<Event> getEventsByType(String typeFromFront, Pageable pageable) {
        if (typeFromFront == null || typeFromFront.isBlank() || "all".equalsIgnoreCase(typeFromFront)) {
            return eventRepo.findAll(pageable);
        }

        EventType eventType;
        try {
            eventType = EventType.fromLabel(typeFromFront);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Type d'événement invalide : " + typeFromFront);
        }

        return eventRepo.findByType(eventType, pageable);
    }

    public List<Event> findAllVisibleEvents() {
        return eventRepo.findByVisibilityAndStatus(Visibility.PUBLIC, EventStatus.PLANNED);
    }

    // ═══════════════════════════════════════════════════════════
    // GESTION DES MATCHES
    // ═══════════════════════════════════════════════════════════

    public Match createMatch(Long eventId, String name, LocalDate date, String location, List<Long> teamIds) {
        log.info("Création match '{}' pour événement {} avec équipes {}", name, eventId, teamIds);

        Event event = eventRepo.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Événement", eventId));

        Match match = Match.builder()
                .name(name)
                .date(date)
                .location(location)
                .event(event)
                .build();

        if (teamIds != null && !teamIds.isEmpty()) {
            List<Team> teams = teamRepo.findAllById(teamIds);
            match.setTeams(teams);
        }

        Match saved = matchRepository.save(match);
        log.info("Match créé - ID: {}", saved.getId());
        return saved;
    }

    // ═══════════════════════════════════════════════════════════
    // GESTION DES MÉDIAS
    // ═══════════════════════════════════════════════════════════

    public Media addMediaToEvent(Long eventId, Media media) {
        log.info("Ajout média à l'événement {}", eventId);

        Event event = eventRepo.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Événement", eventId));

        media.setEvent(event);
        media.setUploadDate(LocalDate.now());

        Media saved = mediaRepository.save(media);
        log.info("Média ajouté - ID: {}", saved.getId());
        return saved;
    }

    public void removeMediaFromEvent(Long eventId, Long mediaId) {
        log.info("Suppression média {} de l'événement {}", mediaId, eventId);

        Event event = eventRepo.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Événement", eventId));

        Media media = mediaRepository.findById(mediaId)
                .orElseThrow(() -> new ResourceNotFoundException("Média", mediaId));

        if (!media.getEvent().getId().equals(eventId)) {
            throw new IllegalArgumentException("Le média ne correspond pas à cet événement");
        }

        mediaRepository.delete(media);
        log.info("Média supprimé - ID: {}", mediaId);
    }

    // ═══════════════════════════════════════════════════════════
    // UTILITAIRES
    // ═══════════════════════════════════════════════════════════

    @Transactional(readOnly = true)
    public int getRemainingPlaces(Long eventId) {
        Event event = eventRepo.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Événement", eventId));

        if (event.getMaxParticipants() == null) {
            return Integer.MAX_VALUE;
        }

        int current = event.getRegistrations().size();
        return Math.max(event.getMaxParticipants() - current, 0);
    }

    public Event updateEventStatus(Long eventId, EventStatus status) {
        log.info("Mise à jour statut événement {} -> {}", eventId, status);

        Event event = eventRepo.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Événement", eventId));

        event.setStatus(status);
        return eventRepo.save(event);
    }
}