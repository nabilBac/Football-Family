package com.footballdemo.football_family.repository;

import com.footballdemo.football_family.model.EventRegistration;
import com.footballdemo.football_family.model.RegistrationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EventRegistrationRepository extends JpaRepository<EventRegistration, Long> {

    // ═══════════════════════════════════════════════════════════
    // RECHERCHE PAR ÉVÉNEMENT
    // ═══════════════════════════════════════════════════════════

    /**
     * Récupère toutes les inscriptions d'un événement (tous statuts).
     */
    List<EventRegistration> findByEventId(Long eventId);

    /**
     * Récupère toutes les inscriptions d'un événement (paginé).
     */
    Page<EventRegistration> findByEventId(Long eventId, Pageable pageable);

    /**
     * Compte toutes les inscriptions pour un événement (tous statuts).
     */
    long countByEventId(Long eventId);



    // ═══════════════════════════════════════════════════════════
    // RECHERCHE PAR JOUEUR (INDIVIDUAL)
    // ═══════════════════════════════════════════════════════════

    /**
     * Récupère toutes les inscriptions d'un joueur.
     */
    List<EventRegistration> findByPlayerId(Long playerId);

    /**
     * Trouve une inscription spécifique par événement et joueur.
     */
    Optional<EventRegistration> findByEventIdAndPlayerId(Long eventId, Long playerId);

    // ═══════════════════════════════════════════════════════════
    // RECHERCHE PAR ÉQUIPE (CLUB_ONLY)
    // ═══════════════════════════════════════════════════════════

    /**
     * Vérifie si une équipe est déjà inscrite à un événement (quel que soit le statut).
     */
    boolean existsByEventIdAndTeamId(Long eventId, Long teamId);

    /**
     * Trouve une inscription spécifique par événement et équipe.
     */
    Optional<EventRegistration> findByEventIdAndTeamId(Long eventId, Long teamId);

    // ═══════════════════════════════════════════════════════════
    // RECHERCHE PAR STATUT
    // ═══════════════════════════════════════════════════════════
    List<EventRegistration> findByTeam_Club_Id(Long clubId);

    /**
     * Récupère les inscriptions d'un événement avec un statut spécifique.
     */
    List<EventRegistration> findByEventIdAndStatus(Long eventId, RegistrationStatus status);

    /**
     * Récupère les inscriptions d'un événement avec un statut spécifique (paginé).
     */
    Page<EventRegistration> findByEventIdAndStatus(
        Long eventId, 
        RegistrationStatus status, 
        Pageable pageable
    );

    /**
     * Compte les inscriptions d'un événement avec un statut spécifique.
     */
    long countByEventIdAndStatus(Long eventId, RegistrationStatus status);

    // ═══════════════════════════════════════════════════════════
    // RECHERCHE PAR CLUB
    // ═══════════════════════════════════════════════════════════

    /**
     * Récupère toutes les inscriptions d'un club pour un événement (tous statuts).
     */
    List<EventRegistration> findByEventIdAndTeam_Club_Id(Long eventId, Long clubId);

    /**
     * Récupère les inscriptions d'un club avec un statut spécifique.
     */
    List<EventRegistration> findByEventIdAndTeam_Club_IdAndStatus(
        Long eventId, 
        Long clubId, 
        RegistrationStatus status
    );

    /**
     * Compte les inscriptions d'un club pour un événement avec certains statuts.
     * Utile pour vérifier les quotas (ACCEPTED + PENDING).
     */
    long countByEventIdAndTeam_Club_IdAndStatusIn(
        Long eventId,
        Long clubId,
        List<RegistrationStatus> statuses
    );

    /**
     * @deprecated Utiliser countByEventIdAndTeam_Club_IdAndStatusIn() à la place.
     * Cette méthode ne vérifie pas le statut des inscriptions.
     */
    @Deprecated
    boolean existsByEventIdAndTeam_Club_Id(Long eventId, Long clubId);

    // ═══════════════════════════════════════════════════════════
    // COMPTAGE PAR TYPE (CLUB vs INDIVIDUAL)
    // ═══════════════════════════════════════════════════════════

    /**
     * Compte les inscriptions d'équipes (CLUB_ONLY) avec un statut spécifique.
     */
    int countByEventIdAndStatusAndTeamIsNotNull(
        Long eventId,
        RegistrationStatus status
    );

    /**
     * Compte les inscriptions de joueurs (INDIVIDUAL) avec un statut spécifique.
     */
    int countByEventIdAndStatusAndPlayerIsNotNull(
        Long eventId,
        RegistrationStatus status
    );

    
}