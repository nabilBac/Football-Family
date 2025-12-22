package com.footballdemo.football_family.service;

import com.footballdemo.football_family.dto.CreateEventDTO;
import com.footballdemo.football_family.dto.GroupRankingDTO;
import com.footballdemo.football_family.dto.RegisterToEventDTO;
import com.footballdemo.football_family.exception.BadRequestException;
import com.footballdemo.football_family.exception.DuplicateResourceException;
import com.footballdemo.football_family.exception.ForbiddenException;
import com.footballdemo.football_family.exception.ResourceNotFoundException;
import com.footballdemo.football_family.model.*;
import com.footballdemo.football_family.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

import java.util.Collections;
import java.util.HashMap;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.Comparator;


@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class EventService {

    private final EventRepository eventRepo;
    private final TeamRepository teamRepo;
    private final MatchRepository matchRepo;
    private final EventRegistrationRepository registrationRepo;
    private final MediaRepository mediaRepo;
    private final ClubRepository clubRepo;
    private final ClubUserRepository clubUserRepo;
    private final TournamentGroupRepository groupRepo;
    private final EventRepository eventRepository;
    private final TournamentRulesService tournamentRulesService;


    


    // ═══════════════════════════════════════════════════════════
    // CRÉATION / MISE À JOUR D’ÉVÉNEMENTS
    // ═══════════════════════════════════════════════════════════

    /**
     * Crée un événement UTF (OPEN_EVENT ou CLUB_EVENT).
     * - OPEN_EVENT : tout utilisateur connecté peut créer (logique contrôlée dans RoleChecker)
     * - CLUB_EVENT : seul un membre du club avec rôle ADMIN / MANAGER / COACH peut créer
     * Inscription toujours INDIVIDUAL pour l’instant.
     */
    public Event createEvent(CreateEventDTO dto, User organizer) {
        log.info("Création événement UTF: {} par {}", dto.getName(), organizer.getUsername());

        if (dto.getDate() == null) {
            throw new BadRequestException("La date de l'événement est obligatoire");
        }
        if (dto.getName() == null || dto.getName().isBlank()) {
            throw new BadRequestException("Le nom de l'événement est obligatoire");
        }
        if (dto.getLocation() == null || dto.getLocation().isBlank()) {
            throw new BadRequestException("Le lieu de l'événement est obligatoire");
        }

        // Type d’événement (OPEN / CLUB)
        EventType type = dto.getType() != null ? dto.getType() : EventType.OPEN_EVENT;

        // Type d’inscription → pour l’instant INDIVIDUAL uniquement
       RegistrationType registrationType = dto.getRegistrationType() != null
        ? dto.getRegistrationType()
        : RegistrationType.INDIVIDUAL;

// ✅ MVP : seulement INDIVIDUAL ou CLUB_ONLY
if (registrationType != RegistrationType.INDIVIDUAL &&
    registrationType != RegistrationType.CLUB_ONLY) {
    throw new BadRequestException("Type d'inscription non supporté pour le MVP");
}



        // Visibilité
        EventVisibility visibility = dto.getVisibility() != null
                ? dto.getVisibility()
                : EventVisibility.PUBLIC;

        Event.EventBuilder builder = Event.builder()
                .name(dto.getName())
                .description(dto.getDescription())
                 .imageUrl(dto.getImageUrl())
                .type(type)
                .registrationType(registrationType)
                  .tournamentPhase(TournamentPhase.REGISTRATION)
                .date(dto.getDate())
                .startTime(dto.getStartTime())
                .endTime(dto.getEndTime())
                .location(dto.getLocation())
                .address(dto.getAddress())
                .city(dto.getCity())
                .zipCode(dto.getZipCode())

                .visibility(visibility)
                .maxParticipants(dto.getMaxParticipants())
                .maxTeamsPerClub(dto.getMaxTeamsPerClub())
                .organizer(organizer)
                .status(EventStatus.UPCOMING)
                .teamsFormed(false);

        // ╔═══════════════════════════════════════════════╗
        // ║      CAS SPÉCIFIQUE : CLUB_EVENT              ║
        // ╚═══════════════════════════════════════════════╝
     // Validation unifiée via canCreateEvent()
if (!canCreateEvent(type, organizer, dto.getClubId())) {
    throw new ForbiddenException("Vous n'avez pas les droits pour créer cet événement");
}

// CAS SPÉCIFIQUE CLUB_EVENT → associer le club
if (type == EventType.CLUB_EVENT) {
    if (dto.getClubId() == null) {
        throw new BadRequestException("Un CLUB_EVENT doit obligatoirement être lié à un club");
    }

    Club club = clubRepo.findById(dto.getClubId())
            .orElseThrow(() -> new ResourceNotFoundException("Club", dto.getClubId()));

    builder.club(club);



            
        } else {
            // OPEN_EVENT : clubId ignoré ou optionnel
            if (dto.getClubId() != null) {
                log.warn("clubId fourni pour un OPEN_EVENT, il sera ignoré. dto.clubId={}", dto.getClubId());
            }
        }

        Event event = builder.build();
        Event saved = eventRepo.save(event);

        log.info("✅ Événement créé - id={}", saved.getId());


        return saved;
    }

    @Transactional(readOnly = true)
    public Event getEventById(Long eventId) {
        return eventRepo.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Événement", eventId));
    }

    @Transactional(readOnly = true)
    public Page<Event> getAllEvents(Pageable pageable) {
        return eventRepo.findAll(pageable);
    }

    /**
     * Mise à jour du statut de l'événement.
     */
    public Event updateEventStatus(Long eventId, EventStatus status) {
        Event event = getEventById(eventId);
        event.setStatus(status);
        return eventRepo.save(event);
    }

    // ═══════════════════════════════════════════════════════════
    // INSCRIPTIONS UTF (INDIVIDUAL only)
    // ═══════════════════════════════════════════════════════════

    /**
     * Inscription d'un joueur à un événement UTF.
     * - INDIVIDUAL only
     * - pas d'inscription par équipe
     *
     * Note : pour l’instant, les CLUB_EVENT ne supportent pas les inscriptions individuelles.
     */
    public EventRegistration registerPlayerToEvent(RegisterToEventDTO dto, User player) {
        log.info("Inscription joueur {} à l'événement {}", player.getId(), dto.getEventId());

        Event event = eventRepo.findById(dto.getEventId())
                .orElseThrow(() -> new ResourceNotFoundException("Événement", dto.getEventId()));

        // Interdire temporairement l'inscription individuelle sur les events de club
        if (event.getType() == EventType.CLUB_EVENT) {
            throw new BadRequestException("Les inscriptions individuelles ne sont pas encore supportées pour les événements de club");
        }

        // Vérifier que l'événement accepte encore des participants
        if (!eventCanAcceptRegistration(event)) {
            throw new BadRequestException("Cet événement ne peut plus accepter de nouvelles inscriptions");
        }

        // Empêcher les doublons (confié à la contrainte unique + catch)
        EventRegistration registration = EventRegistration.builder()
                .event(event)
                .player(player)
                .registrationDate(LocalDate.now())
                .status(RegistrationStatus.PENDING)
                .notes(dto.getNotes())
                .build();

        try {
            EventRegistration saved = registrationRepo.save(registration);
            log.info("✅ Inscription créée - id={}", saved.getId());
            return saved;
        } catch (org.springframework.dao.DataIntegrityViolationException ex) {
            log.warn("Doublon d'inscription pour player={} sur event={}", player.getId(), event.getId());
            throw new DuplicateResourceException("Le joueur est déjà inscrit à cet événement");
        }
    }

public int countTeamsRegisteredByClub(Long eventId, Long clubId) {
    return (int) registrationRepo.countByEventIdAndTeam_Club_IdAndStatusIn(
        eventId, 
        clubId, 
        List.of(RegistrationStatus.ACCEPTED, RegistrationStatus.PENDING)
    );
}



/**
 * Nombre de participants ACCEPTÉS pour un événement.
 * - CLUB_ONLY : nombre d'équipes acceptées
 * - INDIVIDUAL : nombre de joueurs acceptés
 */
@Transactional(readOnly = true)
public int countAcceptedParticipants(Long eventId) {

    Event event = getEventById(eventId);

    // 🔹 Cas CLUB_ONLY → équipes acceptées
    if (event.getRegistrationType() == RegistrationType.CLUB_ONLY) {
        return registrationRepo.countByEventIdAndStatusAndTeamIsNotNull(
                eventId,
                RegistrationStatus.ACCEPTED
        );
    }

    // 🔹 Cas INDIVIDUAL → joueurs acceptés
    return registrationRepo.countByEventIdAndStatusAndPlayerIsNotNull(
            eventId,
            RegistrationStatus.ACCEPTED
    );
}


    /**
 * Inscription d'un club (via une équipe) sur un CLUB_EVENT avec registrationType=CLUB_ONLY.
 */
public EventRegistration registerTeamToEvent(Long eventId, Long teamId, User currentUser) {

    Event event = getEventById(eventId);

    // 1 — Vérifier que l’event accepte les clubs
    if (event.getRegistrationType() != RegistrationType.CLUB_ONLY) {
        throw new BadRequestException("Cet événement n'accepte pas d'inscriptions de clubs");
    }

    Team team = teamRepo.findById(teamId)
            .orElseThrow(() -> new ResourceNotFoundException("Équipe", teamId));

    Long teamClubId = team.getClub().getId();

    boolean isOrganizerTeam =           //attention
        event.getClub() != null &&
        teamClubId.equals(event.getClub().getId());


    // 2 — Vérifier que l'utilisateur a un rôle DANS CE CLUB
    boolean isClubStaff = clubUserRepo
            .findByClubIdAndUserId(teamClubId, currentUser.getId())
            .map(cu ->
                    cu.getRole() == ClubRole.ADMIN ||
                    cu.getRole() == ClubRole.MANAGER ||
                    cu.getRole() == ClubRole.COACH
            )
            .orElse(false);

    // 3 — Autoriser aussi le SUPER_ADMIN
    if (!currentUser.isSuperAdmin() && !isClubStaff) {
        throw new ForbiddenException("Vous n'avez pas les droits pour inscrire cette équipe");
    }

    // 4 — Empêcher les doublons (club déjà inscrit)
    boolean alreadyRegistered = registrationRepo
            .existsByEventIdAndTeamId(eventId, teamId);

    if (alreadyRegistered) {
        throw new DuplicateResourceException("Cette équipe est déjà inscrite à l'événement");
    }

// 🔒 BLOQUER SI LE TOURNOI EST COMPLET (ACCEPTED + PENDING)
int acceptedTeams = registrationRepo.countByEventIdAndStatusAndTeamIsNotNull(
        eventId,
        RegistrationStatus.ACCEPTED
);

int pendingTeams = registrationRepo.countByEventIdAndStatusAndTeamIsNotNull(
        eventId,
        RegistrationStatus.PENDING
);

int takenTeams = acceptedTeams + pendingTeams;

if (event.getMaxParticipants() != null && takenTeams >= event.getMaxParticipants()) {
    throw new BadRequestException("Tournoi complet");
}


// 🔒 Quota par club = ACCEPTED + PENDING
if (event.getMaxTeamsPerClub() != null) {

    long alreadyTaken = registrationRepo.countByEventIdAndTeam_Club_IdAndStatusIn(
            eventId,
            teamClubId,
            List.of(RegistrationStatus.ACCEPTED, RegistrationStatus.PENDING)
    );

    if (alreadyTaken >= event.getMaxTeamsPerClub()) {
        throw new BadRequestException(
                "Quota d'équipes atteint pour ce club (" 
                + event.getMaxTeamsPerClub() + ")"
        );
    }
}
    // 5 — Créer l'inscription
 EventRegistration registration = EventRegistration.builder()
        .event(event)
        .team(team)
        .status(RegistrationStatus.PENDING)
        .registrationDate(LocalDate.now())
        .build();

return registrationRepo.save(registration);

}


    @Transactional(readOnly = true)
    public List<EventRegistration> getRegistrationsForUser(Long userId) {
        return registrationRepo.findByPlayerId(userId);
    }
  

    // ═══════════════════════════════════════════════════════════
    // GESTION DES MATCHES
    // ═══════════════════════════════════════════════════════════

    public Match createMatch(Long eventId,
                             Long teamAId,
                             Long teamBId,
                             LocalDate date,
                             LocalTime time,
                             String field,
                             String location,
                             User currentUser) {

        Event event = getEventById(eventId);

        // 🔒 0 — BLOQUER SI LES POULES SONT DÉJÀ GÉNÉRÉES
        if (event.getGroupCount() != null) {
        throw new BadRequestException(
            "Inscriptions fermées : les poules ont déjà été générées"
            );
        }


        if (!canManageEvent(event, currentUser)) {
            throw new ForbiddenException("Vous ne pouvez pas créer de matchs pour cet événement");
        }

        Team teamA = teamRepo.findById(teamAId)
                .orElseThrow(() -> new ResourceNotFoundException("Équipe A", teamAId));
        Team teamB = teamRepo.findById(teamBId)
                .orElseThrow(() -> new ResourceNotFoundException("Équipe B", teamBId));

        if (!teamA.getEvent().getId().equals(eventId) || !teamB.getEvent().getId().equals(eventId)) {
            throw new BadRequestException("Les équipes doivent appartenir au même événement");
        }

        Match match = Match.builder()
                .date(date)
                .time(time)
                .field(field)
                .location(location)
                .event(event)
                .teamA(teamA)
                .teamB(teamB)
                .status(MatchStatus.SCHEDULED)
                .build();

        return matchRepo.save(match);
    }

    // ═══════════════════════════════════════════════════════════
    // GESTION DES MÉDIAS
    // ═══════════════════════════════════════════════════════════

    public Media addMediaToEvent(Long eventId, Media media, User currentUser) {
        Event event = getEventById(eventId);

        if (!canManageEvent(event, currentUser)) {
            throw new ForbiddenException("Vous ne pouvez pas ajouter de médias à cet événement");
        }

        media.setEvent(event);
        media.setUploadDate(LocalDate.now());

        Media saved = mediaRepo.save(media);
        log.info("Média {} ajouté à l'événement {}", saved.getId(), eventId);
        return saved;
    }

    public void removeMediaFromEvent(Long eventId, Long mediaId, User currentUser) {
        Event event = getEventById(eventId);

        if (!canManageEvent(event, currentUser)) {
            throw new ForbiddenException("Vous ne pouvez pas supprimer des médias de cet événement");
        }

        Media media = mediaRepo.findById(mediaId)
                .orElseThrow(() -> new ResourceNotFoundException("Média", mediaId));

        if (media.getEvent() == null || !media.getEvent().getId().equals(eventId)) {
            throw new BadRequestException("Le média ne correspond pas à cet événement");
        }

        mediaRepo.delete(media);
        log.info("Média {} supprimé de l'événement {}", mediaId, eventId);
    }

    // ═══════════════════════════════════════════════════════════
    // RECHERCHE / FILTRES
    // ═══════════════════════════════════════════════════════════

    /**
     * Recherche / filtre combiné :
     * - type : "all" ou OPEN_EVENT / CLUB_EVENT
     * - term : recherche sur name/location
     */
 @Transactional(readOnly = true)
public Page<Event> filterAndSearch(String type, String term, Pageable pageable) {

    String cleanType = (type == null || type.isBlank() || "all".equalsIgnoreCase(type))
            ? null
            : type.trim();

    String cleanTerm = (term == null || term.isBlank())
            ? null
            : term.trim();

    // ✅ TOUJOURS filtrer sur visibility = PUBLIC
    if (cleanType == null && cleanTerm == null) {
        return eventRepo.findByVisibility(EventVisibility.PUBLIC, pageable);
    }

    if (cleanType == null) {
        return eventRepo.findByVisibilityAndNameContainingIgnoreCaseOrLocationContainingIgnoreCase(
                EventVisibility.PUBLIC, cleanTerm, cleanTerm, pageable);
    }

    EventType eventType;
    try {
        eventType = EventType.valueOf(cleanType.toUpperCase());
    } catch (IllegalArgumentException e) {
        throw new BadRequestException("Type d'événement invalide : " + cleanType);
    }

    if (cleanTerm == null) {
        return eventRepo.findByVisibilityAndType(EventVisibility.PUBLIC, eventType, pageable);
    }

    return eventRepo.findByVisibilityAndTypeAndNameContainingIgnoreCase(
            EventVisibility.PUBLIC, eventType, cleanTerm, pageable);
}

    /**
     * Récupère les événements publics à venir.
     */
    @Transactional(readOnly = true)
    public Page<Event> getUpcomingPublicEvents(Pageable pageable) {
        return eventRepo.findByStatus(EventStatus.UPCOMING, pageable)
                .map(e -> e)
                .map(event -> event);
    }

    // ═══════════════════════════════════════════════════════════
    // UTILITAIRES / SUPPRESSION
    // ══════════════════════════════════════════════════════════


    /**
     * Suppression complète d’un événement + registrations + médias + matchs.
     */
    public void deleteEvent(Long eventId, User currentUser) {
        Event event = getEventById(eventId);

        if (!canManageEvent(event, currentUser)) {
            throw new ForbiddenException("Vous ne pouvez pas supprimer cet événement");
        }

        registrationRepo.deleteAll(event.getRegistrations());
        mediaRepo.deleteAll(event.getMediaUploads());
        matchRepo.deleteAll(event.getMatches());
        eventRepo.delete(event);

        log.info("Événement {} supprimé", eventId);
    }

    // ═══════════════════════════════════════════════════════════
    // LOGIQUE MÉTIER INTERNE
    // ═══════════════════════════════════════════════════════════

    private boolean eventCanAcceptRegistration(Event event) {

    if (!event.isRegistrationOpen()) {
        return false;
    }

    int accepted = countAcceptedParticipants(event.getId());
    return !event.isFull(accepted);
}

@Transactional(readOnly = true)
public boolean isEventFull(Long eventId) {
    Event event = getEventById(eventId);
    int accepted = countAcceptedParticipants(eventId);
    return event.isFull(accepted);
}
    /**
 * Vérifie si un utilisateur peut créer un événement :
 * - OPEN_EVENT : tout utilisateur connecté
 * - CLUB_EVENT : uniquement ADMIN / MANAGER / COACH du club
 */
public boolean canCreateEvent(EventType type, User user, Long clubId) {
    if (user == null) return false;

    // SUPER_ADMIN → full access
    if (user.isSuperAdmin()) return true;

    // OPEN_EVENT → tout utilisateur connecté
    if (type == EventType.OPEN_EVENT) {
        return true;
    }

    // CLUB_EVENT → vérifier le club et les rôles internes
    if (type == EventType.CLUB_EVENT) {
        if (clubId == null) return false;

        return clubUserRepo.findByClubIdAndUserId(clubId, user.getId())
                .map(ClubUser::getRole)
                .map(role ->
                        role == ClubRole.ADMIN ||
                        role == ClubRole.MANAGER ||
                        role == ClubRole.COACH
                )
                .orElse(false);
    }

    return false;
}


/**
 * Vérifie si un utilisateur peut gérer un événement :
 * - SUPER_ADMIN toujours OK
 * - OPEN_EVENT : uniquement ORGANIZER ou SUPER_ADMIN
 * - CLUB_EVENT :
 *      - ORGANIZER
 *      - ADMIN / MANAGER / COACH du club
 *      - SUPER_ADMIN
 */
public boolean canManageEvent(Event event, User user) {

    if (user == null) return false;

    // SUPER_ADMIN → full access
    if (user.isSuperAdmin()) return true;

    // Organisateur direct
    if (event.getOrganizer() != null && event.getOrganizer().getId().equals(user.getId())) {
        return true;
    }

    // OPEN_EVENT → personne d'autre ne peut gérer
    if (event.getType() == EventType.OPEN_EVENT) {
        return false;
    }

    // CLUB_EVENT → vérifications multiples
    if (event.getType() == EventType.CLUB_EVENT && event.getClub() != null) {
        
        Long eventClubId = event.getClub().getId();
        
        // ✅ 1. Vérifier si l'utilisateur est CLUB_ADMIN et que son clubId correspond
        if (user.isClubAdmin() && user.getPrimaryClubId() != null 
                && user.getPrimaryClubId().equals(eventClubId)) {
            return true;
        }

        // ✅ 2. Vérifier dans club_users
        Optional<ClubUser> clubUser = clubUserRepo.findByClubIdAndUserId(eventClubId, user.getId());
        if (clubUser.isPresent()) {
            ClubRole role = clubUser.get().getRole();
            return role == ClubRole.ADMIN || role == ClubRole.MANAGER || role == ClubRole.COACH;
        }
    }

    return false;
}


@Transactional(readOnly = true)
public Page<Event> getVisibleEvents(boolean isLogged, Pageable pageable) {
    return eventRepo.findByVisibility(EventVisibility.PUBLIC, pageable);
}



    /**
 * Vérifie si l'utilisateur a un rôle dans un club (coach, manager ou admin)
 */
private boolean userIsClubStaff(User user) {
    if (user == null) return false;

    List<ClubUser> memberships = clubUserRepo.findAllByUserId(user.getId());

    return memberships.stream()
            .map(ClubUser::getRole)
            .anyMatch(role ->
                    role == ClubRole.ADMIN ||
                    role == ClubRole.MANAGER ||
                    role == ClubRole.COACH
            );
}


@Transactional
public EventRegistration acceptTeamRegistration(Long eventId, Long regId, User currentUser) {

    Event event = getEventById(eventId);

    if (!canManageEvent(event, currentUser)) {
        throw new ForbiddenException("Vous n'avez pas les droits pour valider les inscriptions");
    }

    EventRegistration reg = registrationRepo.findById(regId)
            .orElseThrow(() -> new ResourceNotFoundException("Inscription", regId));

    if (!reg.getEvent().getId().equals(eventId)) {
        throw new ForbiddenException("Cette inscription n'appartient pas à cet événement");
    }

    if (reg.getTeam() == null) {
        throw new BadRequestException("Cette inscription n'est pas une inscription d'équipe");
    }

    // ✅ VALIDATION DE LA TRANSITION
    if (!RegistrationStatus.canTransition(reg.getStatus(), RegistrationStatus.ACCEPTED)) {
        throw new BadRequestException(
            "Impossible d'accepter cette inscription. Statut actuel : " + reg.getStatus()
        );
    }


    // 🔒 VÉRIFIER LES QUOTAS AVANT ACCEPTATION

// 1️⃣ Quota global (équipes ACCEPTED)
int acceptedTeams = registrationRepo.countByEventIdAndStatusAndTeamIsNotNull(
        eventId,
        RegistrationStatus.ACCEPTED
);

if (event.getMaxParticipants() != null && acceptedTeams >= event.getMaxParticipants()) {
    throw new BadRequestException(
        "Impossible d'accepter : le tournoi est complet"

    );
}

// 2️⃣ Quota par club (équipes ACCEPTED)
Long teamClubId = reg.getTeam().getClub().getId();

if (event.getMaxTeamsPerClub() != null) {

    long acceptedByClub = registrationRepo.countByEventIdAndTeam_Club_IdAndStatusIn(
            eventId,
            teamClubId,
            List.of(RegistrationStatus.ACCEPTED)
    );

    if (acceptedByClub >= event.getMaxTeamsPerClub()) {
        throw new BadRequestException(
            "Impossible d'accepter : quota d'équipes atteint pour ce club"
        );
    }
}

   // ✅ UTILISATION DE LA MÉTHODE HELPER
reg.accept();
registrationRepo.save(reg);

// 🔒 FERMETURE AUTOMATIQUE DES INSCRIPTIONS SI CAPACITÉ ATTEINTE
if (event.getMaxParticipants() != null) {

    int acceptedAfter = registrationRepo.countByEventIdAndStatusAndTeamIsNotNull(
            eventId,
            RegistrationStatus.ACCEPTED
    );

    if (acceptedAfter >= event.getMaxParticipants()) {
        event.setRegistrationClosed(true);
    }
}

// 💾 Sauvegarder l'événement si modifié
eventRepository.save(event);

return reg;

}

@Transactional
public EventRegistration rejectTeamRegistration(Long eventId, Long regId, User currentUser) {

    Event event = getEventById(eventId);

    if (!canManageEvent(event, currentUser)) {
        throw new ForbiddenException("Vous n'avez pas les droits pour rejeter les inscriptions");
    }

    EventRegistration reg = registrationRepo.findById(regId)
            .orElseThrow(() -> new ResourceNotFoundException("Inscription", regId));

    if (!reg.getEvent().getId().equals(eventId)) {
        throw new ForbiddenException("Cette inscription n'appartient pas à cet événement");
    }

    if (reg.getTeam() == null) {
        throw new BadRequestException("Cette inscription n'est pas une inscription d'équipe");
    }

    // ✅ VALIDATION DE LA TRANSITION
    if (!RegistrationStatus.canTransition(reg.getStatus(), RegistrationStatus.REJECTED)) {
        throw new BadRequestException(
            "Impossible de rejeter cette inscription. Statut actuel : " + reg.getStatus()
        );
    }

    // ✅ UTILISATION DE LA MÉTHODE HELPER
    reg.reject(); // Au lieu de setStatus()

    return registrationRepo.save(reg);
}

@Transactional
public List<TournamentGroup> generateGroups(
        Long eventId,
        int groupCount,
        int qualifiedPerGroup,
        boolean forceStart
)
 {

    Event event = getEventById(eventId);

    if (event.getTournamentPhase() != TournamentPhase.REGISTRATION) {
    throw new BadRequestException(
        "Impossible de générer les poules à cette phase"
    );
}


    List<EventRegistration> acceptedRegs =
        registrationRepo.findByEventIdAndStatus(
            eventId, RegistrationStatus.ACCEPTED
        );

    List<Team> teams = acceptedRegs.stream()
        .map(EventRegistration::getTeam)
        .collect(Collectors.toCollection(ArrayList::new));

        
Integer expectedTeams = event.getMaxParticipants();

if (!forceStart
        && expectedTeams != null
        && teams.size() < expectedTeams) {

    throw new BadRequestException(
        "Le tournoi n'est pas complet ("
        + teams.size() + "/" + expectedTeams
        + "). Confirmation requise."
    );
}


        

    if (teams.size() < 2) {
        throw new BadRequestException("Il faut au moins 2 équipes pour générer des poules");
    }

    if (groupCount <= 0) {
        throw new BadRequestException("Le nombre de poules doit être supérieur à 0");
    }

    if (qualifiedPerGroup <= 0) {
        throw new BadRequestException("Il faut au moins 1 qualifié par poule");
    }

    if (groupCount > teams.size()) {
        throw new BadRequestException("Impossible : plus de poules que d'équipes");
    }

    // Validation métier locale (bracket actuel)
   int totalQualified = groupCount * qualifiedPerGroup;

if (totalQualified < 2) {
    throw new BadRequestException(
        "Il faut au moins 2 équipes qualifiées pour continuer le tournoi"
    );
}



    // 💾 mémoriser la configuration
    event.setGroupCount(groupCount);
    event.setQualifiedPerGroup(qualifiedPerGroup);

    Collections.shuffle(teams);

    // 🧹 suppression des anciennes poules
    groupRepo.findByEventId(eventId).forEach(groupRepo::delete);

    // 🆕 création des nouvelles poules
    List<TournamentGroup> groups = new ArrayList<>();
    for (int i = 0; i < groupCount; i++) {
        TournamentGroup group = TournamentGroup.builder()
                .event(event)
                .name("Groupe " + (char) ('A' + i))
                .teams(new ArrayList<>())
                .build();
        groups.add(groupRepo.save(group));
    }

    // 🔁 répartition des équipes
// 🔁 répartition des équipes
int index = 0;
for (Team team : teams) {
    TournamentGroup group = groups.get(index % groupCount);
    
    // ✅ ASSIGNER L'EVENT À L'ÉQUIPE
    team.setEvent(event);
    teamRepo.save(team);
    
    group.getTeams().add(team);
    index++;
}

groups.forEach(groupRepo::save);
    

    return groups;
}

@Transactional
public List<Match> generateMatchesForEvent(Long eventId) {

    Event event = getEventById(eventId);

    if (
        event.getTournamentPhase() != TournamentPhase.GROUP_STAGE
        && event.getTournamentPhase() != TournamentPhase.GROUP_STAGE_FINISHED
    ) {
        throw new BadRequestException(
            "Impossible de générer les matchs à cette phase"
        );
    }

    // 🔒 GARDE-FOUS MÉTIER (LE BRANCHEMENT)
    tournamentRulesService.assertNoMatchesAlreadyGenerated(eventId);
    tournamentRulesService.assertNoScoresExist(eventId);

    // Récupérer les groupes
    List<TournamentGroup> groups = groupRepo.findByEventId(eventId);

    if (groups.isEmpty()) {
        throw new BadRequestException("Aucun groupe trouvé pour cet événement");
    }

    List<Match> createdMatches = new ArrayList<>();

    // Pour chaque poule → Round Robin
    for (TournamentGroup group : groups) {

        List<Team> teams = group.getTeams();
        if (teams == null || teams.size() < 2) continue;

        for (int i = 0; i < teams.size(); i++) {
            for (int j = i + 1; j < teams.size(); j++) {

                Match match = Match.builder()
                        .event(event)
                        .group(group)
                        .teamA(teams.get(i))
                        .teamB(teams.get(j))
                        .status(MatchStatus.SCHEDULED)
                        .build();

                createdMatches.add(matchRepo.save(match));
            }
        }
    }

    return createdMatches;
}



@Transactional(readOnly = true)
public Map<Long, List<GroupRankingDTO>> computeGroupRankings(Long eventId, User currentUser) {

    Event event = getEventById(eventId);

    // ✅ SI L'ÉVÉNEMENT EST PUBLIC, PAS BESOIN DE VÉRIFIER LES DROITS
    if (event.getVisibility() != EventVisibility.PUBLIC) {
        // ❌ Si l'événement est PRIVÉ, vérifier les droits
        if (currentUser == null || !canManageEvent(event, currentUser)) {
            throw new ForbiddenException("Vous n'avez pas les droits pour consulter le classement");
        }
    }

    // Récupère les groupes
    List<TournamentGroup> groups = groupRepo.findByEventId(eventId);

    Map<Long, List<GroupRankingDTO>> rankings = new HashMap<>();

    for (TournamentGroup group : groups) {

        // Récupérer les matchs du groupe
        List<Match> matches = matchRepo.findByGroupId(group.getId());

        // Stats par équipe
        Map<Long, GroupRankingDTO> table = new HashMap<>();

        // Initialisation des équipes
        for (Team t : group.getTeams()) {
            table.put(t.getId(), new GroupRankingDTO(t.getId(), t.getName()));
        }

        // Parcours des matchs
        for (Match m : matches) {

            // Si pas encore joué → on ignore
            if (m.getScoreTeamA() == null || m.getScoreTeamB() == null)
                continue;

            GroupRankingDTO a = table.get(m.getTeamA().getId());
            GroupRankingDTO b = table.get(m.getTeamB().getId());

            int sa = m.getScoreTeamA();
            int sb = m.getScoreTeamB();

            a.goalsFor += sa;
            a.goalsAgainst += sb;

            b.goalsFor += sb;
            b.goalsAgainst += sa;

            if (sa > sb) {
                a.points += 3;
            } else if (sa < sb) {
                b.points += 3;
            } else {
                a.points += 1;
                b.points += 1;
            }
        }

        // Convertir en liste pour classer
        List<GroupRankingDTO> sorted = new ArrayList<>(table.values());

        sorted.sort(Comparator.comparing(GroupRankingDTO::getPoints).reversed()
                .thenComparing(r -> r.getGoalDifference(), Comparator.reverseOrder())
                .thenComparing(r -> r.goalsFor, Comparator.reverseOrder()));

        rankings.put(group.getId(), sorted);
    }

    return rankings;
}


public List<Match> getMatchesForEvent(Long eventId) {
    return matchRepo.findByEventId(eventId);
}

@Transactional(readOnly = true)
public List<TournamentGroup> getGroups(Long eventId) {
    return groupRepo.findByEventId(eventId);
}

public Team getTeamById(Long id) {
    return teamRepo.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Équipe", id));
}


public List<Event> getAllEvents() {
    return eventRepository.findAll();
}

public List<Event> getEventsByClub(Long clubId) {
    return eventRepository.findByClubId(clubId);
}


@Transactional
public Event uploadEventMedia(Long eventId, MultipartFile file, User organizer) {

    Event event = getEventById(eventId);

    // Vérifier permissions
    if (!canManageEvent(event, organizer)) {
        throw new ForbiddenException("Vous ne pouvez pas ajouter un logo à cet événement");
    }

    if (file == null || file.isEmpty()) {
        throw new BadRequestException("Fichier vide");
    }

    try {
        // Dossier de stockage (créé automatiquement si n'existe pas)
        String uploadDir = "uploads/event-logos/";
        Files.createDirectories(Paths.get(uploadDir));

        // Nom du fichier
        String filename = "event_" + eventId + "_" + file.getOriginalFilename();
        String filepath = uploadDir + filename;

        // Copie du fichier physique
        Files.copy(
                file.getInputStream(),
                Paths.get(filepath),
                StandardCopyOption.REPLACE_EXISTING
        );

        // Enregistrer l’URL dans l’Event
        event.setImageUrl("/" + filepath);

        return eventRepo.save(event);

    } catch (Exception e) {
        throw new RuntimeException("Erreur upload logo: " + e.getMessage(), e);
    }
}
public Page<Event> getPublicEvents(Pageable pageable) {
    return eventRepo.findByVisibility(EventVisibility.PUBLIC, pageable);
}


/**
 * Compte le nombre d'équipes EN_ATTENTE pour un club sur un événement
 */
@Transactional(readOnly = true)
public int countPendingTeamsByClub(Long eventId, Long clubId) {
    return (int) registrationRepo.countByEventIdAndTeam_Club_IdAndStatusIn(
        eventId, 
        clubId, 
        List.of(RegistrationStatus.PENDING)
    );
}
public Event save(Event event) {
    return eventRepository.save(event);
}

public List<Team> getTeamsByEventId(Long eventId) {
    Event event = getEventById(eventId);
 return teamRepo.findByEvent_Id(eventId);
}
}
