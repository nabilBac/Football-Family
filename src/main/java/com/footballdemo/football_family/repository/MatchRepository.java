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

// 🆕 Imports obligatoires
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.jpa.repository.Modifying;

@Repository
public interface MatchRepository extends JpaRepository<Match, Long> {

    // =====================
    // EXISTANT (inchangé)
    // =====================

    List<Match> findByEventId(Long eventId);

    Page<Match> findByEventId(Long eventId, Pageable pageable);

    List<Match> findByDate(LocalDate date);

    List<Match> findByLocationContainingIgnoreCase(String location);

    List<Match> findByStatus(MatchStatus status);

    Page<Match> findByStatus(MatchStatus status, Pageable pageable);

    List<Match> findByGroupId(Long groupId);

    @Query("SELECT DISTINCT m.group.id FROM Match m WHERE m.event.id = :eventId")
    List<Long> findDistinctGroupIdsByEvent(@Param("eventId") Long eventId);

    Optional<Match> findByEventIdAndRound(Long eventId, String round);

    Optional<Match> findFirstByEventIdAndRoundOrderByIdDesc(Long eventId, String round);

    // =====================
    // RESET (inchangé)
    // =====================

    @Modifying
    @Transactional
    @Query("UPDATE Match m SET m.nextMatch = NULL WHERE m.event.id = :eventId")
    void clearNextMatchLinks(@Param("eventId") Long eventId);

    @Modifying
    @Transactional
    @Query("DELETE FROM Match m WHERE m.event.id = :eventId")
    void deleteByEventId(@Param("eventId") Long eventId);

    // =====================
    // 🆕 AJOUTS POUR LES RÈGLES MÉTIER
    // =====================

    // 🔒 1) Y a-t-il AU MOINS un match pour cet event ?
    boolean existsByEventId(Long eventId);

    // 🔒 2) Y a-t-il déjà des matchs KO ?
    // Convention MVP : KO = group IS NULL
    boolean existsByEventIdAndGroupIsNull(Long eventId);

    // 🔒 3) Y a-t-il des matchs de poule non terminés ?
    boolean existsByEventIdAndGroupIsNotNullAndStatusNot(
            Long eventId,
            MatchStatus status
    );

    // 🔒 4) Y a-t-il AU MOINS un score saisi ?
    @Query("""
        SELECT CASE WHEN COUNT(m) > 0 THEN true ELSE false END
        FROM Match m
        WHERE m.event.id = :eventId
          AND (m.scoreTeamA IS NOT NULL OR m.scoreTeamB IS NOT NULL)
    """)
    boolean existsAnyScoreByEventId(@Param("eventId") Long eventId);

    // 🔒 5) Y a-t-il déjà une consolante (round commençant par "C") ?
boolean existsByEventIdAndRoundStartingWith(Long eventId, String prefix);


@Query("""
    SELECT m.teamA
    FROM Match m
    WHERE m.event.id = :eventId 
      AND m.round = :round 
      AND m.status = :status
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
      AND m.scoreTeamB > m.scoreTeamA
""")
List<Team> findTeamBWinners(
        @Param("eventId") Long eventId,
        @Param("round") String round,
        @Param("status") MatchStatus status
);

default List<Team> findBarrageWinners(Long eventId) {
    List<Team> winners = new java.util.ArrayList<>();
    winners.addAll(findTeamAWinners(eventId, "BARRAGE", MatchStatus.FINISHED));
    winners.addAll(findTeamBWinners(eventId, "BARRAGE", MatchStatus.FINISHED));
    return winners;
}

}
