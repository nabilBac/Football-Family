package com.footballdemo.football_family.repository;

import com.footballdemo.football_family.model.ClubUser;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ClubUserRepository extends JpaRepository<ClubUser, Long> {

    // Vérifie si un user est membre d'un club précis
    boolean existsByClubIdAndUserId(Long clubId, Long userId);
    

    // Récupère la membership d'un user dans un club précis
    Optional<ClubUser> findByClubIdAndUserId(Long clubId, Long userId);

    // Récupère TOUTES les memberships d'un user (multi-clubs)
    List<ClubUser> findAllByUserId(Long userId);

        Optional<ClubUser> findFirstByUserIdOrderByIdAsc(Long userId);

}
