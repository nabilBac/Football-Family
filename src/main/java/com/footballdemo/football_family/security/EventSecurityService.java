package com.footballdemo.football_family.security;



import com.footballdemo.football_family.model.Event;
import com.footballdemo.football_family.model.Match;
import com.footballdemo.football_family.model.EventRegistration;
import com.footballdemo.football_family.model.User;
import com.footballdemo.football_family.model.UserRole;
import com.footballdemo.football_family.repository.EventRepository;
import com.footballdemo.football_family.repository.MatchRepository;
import com.footballdemo.football_family.repository.EventRegistrationRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

@Service
public class EventSecurityService {

    private final EventRepository eventRepository;
    private final MatchRepository matchRepository;
    private final EventRegistrationRepository registrationRepository;

    public EventSecurityService(
            EventRepository eventRepository,
            MatchRepository matchRepository,
            EventRegistrationRepository registrationRepository
    ) {
        this.eventRepository = eventRepository;
        this.matchRepository = matchRepository;
        this.registrationRepository = registrationRepository;
    }

    /**
     * Vérifie que l'utilisateur est ADMIN ou ORGANISATEUR de l'événement
     */
    public Event assertAdminOrOrganizer(Long eventId, User user) {

        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new AccessDeniedException("Événement introuvable"));

        boolean isOrganizer = event.getOrganizer().getId().equals(user.getId());
        boolean isAdmin = user.hasRole(UserRole.SUPER_ADMIN);


        if (!isOrganizer && !isAdmin) {
            throw new AccessDeniedException("Accès refusé à cet événement");
        }

        return event;
    }

    /**
     * Vérifie que l'utilisateur peut agir sur ce match
     */
    public Match assertMatchAdminOrOrganizer(Long matchId, User user) {

        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new AccessDeniedException("Match introuvable"));

        assertAdminOrOrganizer(match.getEvent().getId(), user);
        return match;
    }

    /**
     * Vérifie que l'utilisateur peut accepter/refuser une inscription
     */
    public EventRegistration assertRegistrationOrganizer(
            Long eventId,
            Long registrationId,
            User user
    ) {

        Event event = assertAdminOrOrganizer(eventId, user);

        EventRegistration registration = registrationRepository.findById(registrationId)
                .orElseThrow(() -> new AccessDeniedException("Inscription introuvable"));

        if (!registration.getEvent().getId().equals(event.getId())) {
            throw new AccessDeniedException("Inscription non liée à cet événement");
        }

        return registration;
    }
}

