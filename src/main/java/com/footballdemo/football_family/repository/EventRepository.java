package com.footballdemo.football_family.repository;

import com.footballdemo.football_family.model.Event;
import com.footballdemo.football_family.model.EventStatus;
import com.footballdemo.football_family.model.Visibility;
import com.footballdemo.football_family.model.EventType;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface EventRepository extends JpaRepository<Event, Long> {

    // VOS MÉTHODES EXISTANTES (avec pagination)
    // Note: findAll(Pageable) est déjà inclus dans JpaRepository, pas besoin de le
    // redéclarer
    List<Event> findByVisibility(Visibility visibility);

    List<Event> findByVisibilityIn(List<Visibility> visibilities);

    Page<Event> findByVisibility(Visibility visibility, Pageable pageable);

    Page<Event> findByVisibilityIn(List<Visibility> visibilities, Pageable pageable);

    // 1. FILTRE PAR TYPE SEUL (CAS 3 dans EventService)
    // 🚨 CORRECTION : Change List<Event> en Page<Event> et ajoute Pageable
    Page<Event> findByType(EventType type, Pageable pageable);

    // 2. RECHERCHE GÉNÉRALE (quand le type est "all") (CAS 2 dans EventService)
    // 🚨 CORRECTION : Change List<Event> en Page<Event> et ajoute Pageable
    Page<Event> findByNameContainingIgnoreCaseOrLocationContainingIgnoreCase(
            String name, String location, Pageable pageable); // Ajout de Pageable

    // Filtrer par type + nom
    Page<Event> findByTypeAndNameContainingIgnoreCase(EventType type, String name, Pageable pageable);

    // Filtrer par type + location
    Page<Event> findByTypeAndLocationContainingIgnoreCase(EventType type, String location, Pageable pageable);

    List<Event> findByVisibilityAndStatus(Visibility visibility, EventStatus status);

}