package com.footballdemo.football_family.repository;



import com.footballdemo.football_family.model.MatchEvent;
import com.footballdemo.football_family.model.MatchEventType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface MatchEventRepository extends JpaRepository<MatchEvent, Long> {

    // 🔍 Tous les événements d'un match
    List<MatchEvent> findByMatchIdOrderByCreatedAtDesc(Long matchId);

    // 🔍 Événements d'un match par type
    List<MatchEvent> findByMatchIdAndTypeOrderByCreatedAtDesc(Long matchId, MatchEventType type);

    // 🔍 Événements récents d'un tournoi (via event_id)
    @Query("SELECT me FROM MatchEvent me " +
           "WHERE me.match.event.id = :eventId " +
           "ORDER BY me.createdAt DESC")
    List<MatchEvent> findRecentByEventId(@Param("eventId") Long eventId);

    // 🔍 Événements récents d'un tournoi avec limite
    @Query("SELECT me FROM MatchEvent me " +
           "WHERE me.match.event.id = :eventId " +
           "ORDER BY me.createdAt DESC")
    List<MatchEvent> findRecentByEventIdWithLimit(@Param("eventId") Long eventId, 
                                                   org.springframework.data.domain.Pageable pageable);

    // 🔍 Événements d'une période
    List<MatchEvent> findByCreatedAtAfterOrderByCreatedAtDesc(LocalDateTime after);

    // 🔍 Dernier événement d'un match
    MatchEvent findFirstByMatchIdOrderByCreatedAtDesc(Long matchId);

    // 🧹 Supprimer tous les événements d'un match
    void deleteByMatchId(Long matchId);

    
}
