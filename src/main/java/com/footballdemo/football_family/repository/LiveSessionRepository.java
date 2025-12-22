package com.footballdemo.football_family.repository;

import com.footballdemo.football_family.model.LiveSession;
import com.footballdemo.football_family.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface LiveSessionRepository extends JpaRepository<LiveSession, Long> {
    List<LiveSession> findByActifTrue(); // tous les lives actifs

    // ✅ modifié : retourne une liste, plus un seul résultat
    List<LiveSession> findByUserAndActifTrue(User user);

    List<LiveSession> findByActifTrueOrderByDateDebutDesc();

    List<LiveSession> findByUser(User user);

    long countByActifTrue();
}
