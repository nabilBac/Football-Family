package com.footballdemo.football_family.repository;

import com.footballdemo.football_family.model.Event;
import com.footballdemo.football_family.model.EventType;
import com.footballdemo.football_family.model.EventStatus;
import com.footballdemo.football_family.model.EventVisibility;
import com.footballdemo.football_family.model.User;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface EventRepository extends JpaRepository<Event, Long> {

    // =============================================
    // 🆕 REQUÊTES SOFT DELETE (VUES PUBLIQUES)
    // =============================================

    /**
     * Récupère tous les events ACTIFS (non supprimés)
     */
    @Query("SELECT e FROM Event e WHERE e.deleted = false")
    List<Event> findAllActive();

    /**
     * Récupère un event ACTIF par ID
     */
    @Query("SELECT e FROM Event e WHERE e.deleted = false AND e.id = :id")
    Optional<Event> findActiveById(@Param("id") Long id);

    /**
     * Récupère les events ACTIFS d'un club
     */
    @Query("SELECT e FROM Event e WHERE e.deleted = false AND e.club.id = :clubId")
    List<Event> findActiveByClubId(@Param("clubId") Long clubId);

    /**
     * Vérifie si un event ACTIF existe
     */
    @Query("SELECT CASE WHEN COUNT(e) > 0 THEN true ELSE false END FROM Event e WHERE e.id = :id AND e.deleted = false")
    boolean existsActiveById(@Param("id") Long id);

    // =============================================
    // 🆕 REQUÊTES ADMIN (INCLUENT LES SUPPRIMÉS)
    // =============================================

    /**
     * Récupère tous les events SUPPRIMÉS (pour l'admin)
     */
    @Query("SELECT e FROM Event e WHERE e.deleted = true")
    List<Event> findAllDeleted();

    /**
     * Récupère un event par ID (même s'il est supprimé)
     */
    @Query("SELECT e FROM Event e WHERE e.id = :id")
    Optional<Event> findByIdIncludingDeleted(@Param("id") Long id);

    // =============================================
    // EXISTANT - FILTRES PUBLICS (NON SUPPRIMÉS)
    // =============================================

    @Query("SELECT e FROM Event e WHERE e.deleted = false AND e.visibility = :visibility")
    Page<Event> findByVisibility(@Param("visibility") EventVisibility visibility, Pageable pageable);

    @Query("SELECT e FROM Event e WHERE e.deleted = false AND e.type = :type")
    Page<Event> findByType(@Param("type") EventType type, Pageable pageable);

    @Query("SELECT e FROM Event e WHERE e.deleted = false AND e.status = :status")
    Page<Event> findByStatus(@Param("status") EventStatus status, Pageable pageable);

    @Query("SELECT e FROM Event e WHERE e.deleted = false AND (LOWER(e.name) LIKE LOWER(CONCAT('%', :name, '%')) OR LOWER(e.location) LIKE LOWER(CONCAT('%', :location, '%')))")
    Page<Event> findByNameContainingIgnoreCaseOrLocationContainingIgnoreCase(
            @Param("name") String name,
            @Param("location") String location,
            Pageable pageable
    );

    @Query("SELECT e FROM Event e WHERE e.deleted = false AND e.type = :type AND LOWER(e.name) LIKE LOWER(CONCAT('%', :name, '%'))")
    Page<Event> findByTypeAndNameContainingIgnoreCase(
            @Param("type") EventType type,
            @Param("name") String name,
            Pageable pageable
    );

    @Query("SELECT e FROM Event e WHERE e.deleted = false AND (e.visibility = :visibility OR e.type = :type)")
    Page<Event> findByVisibilityOrType(
            @Param("visibility") EventVisibility visibility,
            @Param("type") EventType type,
            Pageable pageable
    );

    @Query("SELECT e FROM Event e WHERE e.deleted = false AND e.visibility = :visibility AND e.type = :type")
    Page<Event> findByVisibilityAndType(
            @Param("visibility") EventVisibility visibility,
            @Param("type") EventType type,
            Pageable pageable
    );

    @Query("SELECT e FROM Event e WHERE e.deleted = false AND e.visibility = :visibility AND (LOWER(e.name) LIKE LOWER(CONCAT('%', :name, '%')) OR LOWER(e.location) LIKE LOWER(CONCAT('%', :location, '%')))")
    Page<Event> findByVisibilityAndNameContainingIgnoreCaseOrLocationContainingIgnoreCase(
            @Param("visibility") EventVisibility visibility,
            @Param("name") String name,
            @Param("location") String location,
            Pageable pageable
    );

    @Query("SELECT e FROM Event e WHERE e.deleted = false AND e.visibility = :visibility AND e.type = :type AND LOWER(e.name) LIKE LOWER(CONCAT('%', :name, '%'))")
    Page<Event> findByVisibilityAndTypeAndNameContainingIgnoreCase(
            @Param("visibility") EventVisibility visibility,
            @Param("type") EventType type,
            @Param("name") String name,
            Pageable pageable
    );

    @Query("SELECT e FROM Event e WHERE e.deleted = true AND e.organizer = :organizer ORDER BY e.deletedAt DESC")
List<Event> findDeletedByOrganizer(@Param("organizer") User organizer);

    // =============================================
    // EXISTANT - SANS CHANGEMENT
    // =============================================

    List<Event> findByClubId(Long clubId);

/**
 * Récupérer les events par status (non supprimés)
 */
Page<Event> findByStatusAndDeletedFalse(EventStatus status, Pageable pageable);

/**
 * Récupérer les events par status et type (non supprimés)
 */
Page<Event> findByStatusAndTypeAndDeletedFalse(
    EventStatus status, 
    EventType type, 
    Pageable pageable
);

/**
 * Récupérer les events avec plusieurs statuts (PUBLISHED, ONGOING)
 * Pour l'onglet "Découvrir" - events actifs uniquement
 */
Page<Event> findByStatusInAndDeletedFalse(
    List<EventStatus> statuses, 
    Pageable pageable
);


}