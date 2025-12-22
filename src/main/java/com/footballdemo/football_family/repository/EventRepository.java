package com.footballdemo.football_family.repository;

import com.footballdemo.football_family.model.Event;
import com.footballdemo.football_family.model.EventType;
import com.footballdemo.football_family.model.EventStatus;
import com.footballdemo.football_family.model.EventVisibility;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EventRepository extends JpaRepository<Event, Long> {

    // Filtrer par visibilité (PUBLIC / PRIVATE)
    Page<Event> findByVisibility(EventVisibility visibility, Pageable pageable);

    // Filtrer par type (CLUB_EVENT / OPEN_EVENT)
    Page<Event> findByType(EventType type, Pageable pageable);

    // Filtrer par status (UPCOMING / RUNNING / FINISHED)
    Page<Event> findByStatus(EventStatus status, Pageable pageable);

    // Recherche générale par nom ou lieu
    Page<Event> findByNameContainingIgnoreCaseOrLocationContainingIgnoreCase(
            String name,
            String location,
            Pageable pageable
    );

    // Filtrer par type + nom (optionnel mais utile)
    Page<Event> findByTypeAndNameContainingIgnoreCase(
            EventType type,
            String name,
            Pageable pageable
    );

    Page<Event> findByVisibilityOrType(EventVisibility visibility, EventType type, Pageable pageable);

Page<Event> findByVisibilityAndType(EventVisibility visibility, EventType type, Pageable pageable);


List<Event> findByClubId(Long clubId);



// Recherche par nom/location avec filtre visibilité
Page<Event> findByVisibilityAndNameContainingIgnoreCaseOrLocationContainingIgnoreCase(
    EventVisibility visibility,
    String name,
    String location,
    Pageable pageable
);

// Recherche par type + nom avec filtre visibilité
Page<Event> findByVisibilityAndTypeAndNameContainingIgnoreCase(
    EventVisibility visibility,
    EventType type,
    String name,
    Pageable pageable
);


}
