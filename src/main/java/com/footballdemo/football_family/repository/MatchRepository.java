package com.footballdemo.football_family.repository;

import com.footballdemo.football_family.model.Match;
import com.footballdemo.football_family.model.MatchStatus;
import com.footballdemo.football_family.model.Team;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.jpa.repository.Modifying;

@Repository
public interface MatchRepository extends JpaRepository<Match, Long> {

    // =============================================
    // 🆕 REQUÊTES SOFT DELETE (VUES PUBLIQUES)
    // =============================================

    /**
     * Récupère tous les matchs ACTIFS d'un event
     */
    @Query("SELECT m FROM Match m WHERE m.event.id = :eventId AND m.deleted = false")
    List<Match> findActiveByEventId(@Param("eventId") Long eventId);

    /**
     * Récupère un match ACTIF par ID
     */
    @Query("SELECT m FROM Match m WHERE m.id = :id AND m.deleted = false")
    Optional<Match> findActiveById(@Param("id") Long id);

    /**
     * Vérifie si un match ACTIF existe
     */
    @Query("SELECT CASE WHEN COUNT(m) > 0 THEN true ELSE false END FROM Match m WHERE m.id = :id AND m.deleted = false")
    boolean existsActiveById(@Param("id") Long id);

    // =============================================
    // 🆕 REQUÊTES ADMIN (INCLUENT LES SUPPRIMÉS)
    // =============================================

    /**
     * Récupère un match par ID (même s'il est supprimé)
     */
    @Query("SELECT m FROM Match m WHERE m.id = :id")
    Optional<Match> findByIdIncludingDeleted(@Param("id") Long id);

    /**
     * Récupère tous les matchs SUPPRIMÉS d'un event
     */
    @Query("SELECT m FROM Match m WHERE m.event.id = :eventId AND m.deleted = true")
    List<Match> findDeletedByEventId(@Param("eventId") Long eventId);

    // =============================================
    // EXISTANT - REQUÊTES PUBLIQUES (NON SUPPRIMÉS)
    // =============================================

    @Query("SELECT m FROM Match m WHERE m.event.id = :eventId AND m.deleted = false")
    List<Match> findByEventId(@Param("eventId") Long eventId);

    @Query("SELECT m FROM Match m WHERE m.event.id = :eventId AND m.deleted = false")
    Page<Match> findByEventId(@Param("eventId") Long eventId, Pageable pageable);

    @Query("SELECT m FROM Match m WHERE m.date = :date AND m.deleted = false")
    List<Match> findByDate(@Param("date") LocalDate date);

    @Query("SELECT m FROM Match m WHERE LOWER(m.location) LIKE LOWER(CONCAT('%', :location, '%')) AND m.deleted = false")
    List<Match> findByLocationContainingIgnoreCase(@Param("location") String location);

    @Query("SELECT m FROM Match m WHERE m.status = :status AND m.deleted = false")
    List<Match> findByStatus(@Param("status") MatchStatus status);

    @Query("SELECT m FROM Match m WHERE m.status = :status AND m.deleted = false")
    Page<Match> findByStatus(@Param("status") MatchStatus status, Pageable pageable);

    @Query("SELECT m FROM Match m WHERE m.group.id = :groupId AND m.deleted = false")
    List<Match> findByGroupId(@Param("groupId") Long groupId);

    @Query("SELECT m FROM Match m WHERE m.event.id = :eventId AND m.group IS NOT NULL AND m.deleted = false ORDER BY m.date ASC, m.time ASC")
    List<Match> findByEventIdAndGroupIsNotNullOrderByDateAscTimeAsc(@Param("eventId") Long eventId);

    @Query("SELECT m FROM Match m WHERE m.event.id = :eventId AND m.round IS NOT NULL AND m.deleted = false ORDER BY m.date ASC, m.time ASC")
    List<Match> findByEventIdAndRoundIsNotNullOrderByDateAscTimeAsc(@Param("eventId") Long eventId);

    @Query("SELECT DISTINCT m.group.id FROM Match m WHERE m.event.id = :eventId AND m.deleted = false")
    List<Long> findDistinctGroupIdsByEvent(@Param("eventId") Long eventId);

    @Query("SELECT m FROM Match m WHERE m.event.id = :eventId AND m.round = :round AND m.deleted = false")
    List<Match> findByEventIdAndRound(@Param("eventId") Long eventId, @Param("round") String round);

    @Query("SELECT m FROM Match m WHERE m.event.id = :eventId AND m.round = :round AND m.deleted = false ORDER BY m.id DESC")
    Optional<Match> findFirstByEventIdAndRoundOrderByIdDesc(@Param("eventId") Long eventId, @Param("round") String round);

    // =============================================
    // RESET (HARD DELETE - ADMIN ONLY)
    // =============================================

    @Modifying
    @Transactional
    @Query("UPDATE Match m SET m.nextMatch = NULL WHERE m.event.id = :eventId")
    void clearNextMatchLinks(@Param("eventId") Long eventId);

    @Modifying
    @Transactional
    @Query("DELETE FROM Match m WHERE m.event.id = :eventId")
    void deleteByEventId(@Param("eventId") Long eventId);

    // =============================================
    // RÈGLES MÉTIER (FILTRENT LES DELETED)
    // =============================================

    @Query("SELECT CASE WHEN COUNT(m) > 0 THEN true ELSE false END FROM Match m WHERE m.event.id = :eventId AND m.deleted = false")
    boolean existsByEventId(@Param("eventId") Long eventId);

    @Query("SELECT CASE WHEN COUNT(m) > 0 THEN true ELSE false END FROM Match m WHERE m.event.id = :eventId AND m.group IS NULL AND m.deleted = false")
    boolean existsByEventIdAndGroupIsNull(@Param("eventId") Long eventId);

    @Query("SELECT CASE WHEN COUNT(m) > 0 THEN true ELSE false END FROM Match m WHERE m.event.id = :eventId AND m.group IS NOT NULL AND m.status <> :status AND m.deleted = false")
    boolean existsByEventIdAndGroupIsNotNullAndStatusNot(
            @Param("eventId") Long eventId,
            @Param("status") MatchStatus status
    );

    @Query("""
        SELECT CASE WHEN COUNT(m) > 0 THEN true ELSE false END
        FROM Match m
        WHERE m.event.id = :eventId
          AND m.deleted = false
          AND (m.scoreTeamA IS NOT NULL OR m.scoreTeamB IS NOT NULL)
    """)
    boolean existsAnyScoreByEventId(@Param("eventId") Long eventId);

    @Query("SELECT CASE WHEN COUNT(m) > 0 THEN true ELSE false END FROM Match m WHERE m.event.id = :eventId AND m.round LIKE CONCAT(:prefix, '%') AND m.deleted = false")
    boolean existsByEventIdAndRoundStartingWith(@Param("eventId") Long eventId, @Param("prefix") String prefix);

    @Query("""
        SELECT m.teamA
        FROM Match m
        WHERE m.event.id = :eventId 
          AND m.round = :round 
          AND m.status = :status
          AND m.deleted = false
          AND m.scoreTeamA > m.scoreTeamB
    """)
    List<Team> findTeamAWinners(
            @Param("eventId") Long eventId,
            @Param("round") String round,
            @Param("status") MatchStatus status
    );

    @Query("""
        SELECT m.teamB
        FROM Match m
        WHERE m.event.id = :eventId 
          AND m.round = :round 
          AND m.status = :status
          AND m.deleted = false
          AND m.scoreTeamB > m.scoreTeamA
    """)
    List<Team> findTeamBWinners(
            @Param("eventId") Long eventId,
            @Param("round") String round,
            @Param("status") MatchStatus status
    );

    default List<Team> findBarrageWinners(Long eventId) {
        List<Team> winners = new java.util.ArrayList<>();
        winners.addAll(findTeamAWinners(eventId, "BARRAGE", MatchStatus.COMPLETED));
        winners.addAll(findTeamBWinners(eventId, "BARRAGE", MatchStatus.COMPLETED));
        return winners;
    }

    // =============================================
    // VUE PUBLIQUE (NON SUPPRIMÉS)
    // =============================================

    @Query(value = """
        SELECT * FROM `match` 
        WHERE event_id = :eventId 
        AND deleted = false
        AND status IN ('SCHEDULED', 'IN_PROGRESS') 
        ORDER BY date ASC, time ASC 
        LIMIT :limit
        """, nativeQuery = true)
    List<Match> findUpcomingMatchesByEventId(
        @Param("eventId") Long eventId, 
        @Param("limit") int limit
    );

    @Query(value = """
        SELECT * FROM `match` 
        WHERE event_id = :eventId 
        AND deleted = false
        AND status = 'COMPLETED' 
        ORDER BY actual_end_time DESC 
        LIMIT :limit
        """, nativeQuery = true)
    List<Match> findRecentResultsByEventId(
        @Param("eventId") Long eventId, 
        @Param("limit") int limit
    );

    @Query("SELECT m FROM Match m WHERE m.event.id = :eventId AND m.deleted = false ORDER BY m.date ASC, m.time ASC")
    List<Match> findByEventIdOrderByDateTime(@Param("eventId") Long eventId);

    // =============================================
    // PLANNING ADMIN (NON SUPPRIMÉS)
    // =============================================

    @Query("SELECT m FROM Match m WHERE m.event.id = :eventId AND m.date IS NOT NULL AND m.time IS NOT NULL AND m.deleted = false ORDER BY m.date ASC, m.time ASC, m.field ASC")
    List<Match> findByEventIdAndDateIsNotNullAndTimeIsNotNullOrderByDateAscTimeAscFieldAsc(@Param("eventId") Long eventId);

    @Query("SELECT m FROM Match m WHERE m.event.id = :eventId AND m.group.id IS NOT NULL AND m.deleted = false")
    List<Match> findByEventIdAndGroupIdIsNotNull(@Param("eventId") Long eventId);

    @Query("""
        SELECT m
        FROM Match m
        LEFT JOIN FETCH m.teamA ta
        LEFT JOIN FETCH ta.club
        LEFT JOIN FETCH m.teamB tb
        LEFT JOIN FETCH tb.club
        LEFT JOIN FETCH m.group g
        WHERE m.event.id = :eventId
        AND m.deleted = false
    """)
    List<Match> findByEventIdWithTeamsAndClubs(@Param("eventId") Long eventId);



    List<Match> findByDeletedTrue();

List<Match> findByEventIdAndDeletedTrue(Long eventId);

List<Match> findByRoundAndDeletedTrue(String round);

List<Match> findByEventIdAndRoundAndDeletedTrue(Long eventId, String round);

@Query("SELECT m FROM Match m WHERE m.deleted = true AND m.event.club.id = :clubId")
List<Match> findByDeletedTrueAndEventClubId(@Param("clubId") Long clubId);

@Query("SELECT m FROM Match m WHERE m.event.id = :eventId AND m.deleted = true AND m.event.club.id = :clubId")
List<Match> findByEventIdAndDeletedTrueAndEventClubId(@Param("eventId") Long eventId, @Param("clubId") Long clubId);

@Query("SELECT m FROM Match m WHERE m.round = :round AND m.deleted = true AND m.event.club.id = :clubId")
List<Match> findByRoundAndDeletedTrueAndEventClubId(@Param("round") String round, @Param("clubId") Long clubId);

@Query("SELECT m FROM Match m WHERE m.event.id = :eventId AND m.round = :round AND m.deleted = true AND m.event.club.id = :clubId")
List<Match> findByEventIdAndRoundAndDeletedTrueAndEventClubId(@Param("eventId") Long eventId, @Param("round") String round, @Param("clubId") Long clubId);


@Query("""
  SELECT m
  FROM Match m
  WHERE m.event.id = :eventId
    AND m.deleted = false
    AND upper(m.round) like concat(upper(:prefix), '%')
  ORDER BY m.id
""")
List<Match> findActiveByEventIdAndRoundStartingWith(@Param("eventId") Long eventId,
                                                    @Param("prefix") String prefix);


@Modifying
@Transactional
@Query("""
  delete from Match m
  where m.event.id = :eventId
    and m.deleted = true
    and m.round is not null
    and upper(m.round) like 'C%'
""")
int purgeDeletedConsolante(@Param("eventId") Long eventId);

      @Modifying
@Transactional
@Query("""
  update Match m
  set m.nextMatch = null
  where m.event.id = :eventId
    and m.round is not null
    and upper(m.round) like 'C%'
""")
int clearNextLinksForConsolante(@Param("eventId") Long eventId);

@Modifying
@Transactional
@Query("""
  delete from Match m
  where m.event.id = :eventId
    and m.round is not null
    and upper(m.round) like 'C%'
""")
int hardDeleteConsolante(@Param("eventId") Long eventId);
                                              

}