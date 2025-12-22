package com.footballdemo.football_family.repository;

import com.footballdemo.football_family.model.Team;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TeamRepository extends JpaRepository<Team, Long> {

    // Équipes d’un événement UTF
    List<Team> findByEvent_Id(Long eventId);

    List<Team> findByClubId(Long clubId);


    // Équipes triées d’un event
    List<Team> findByEvent_IdOrderByNameAsc(Long eventId);

    // Coach
    List<Team> findByCoach_Id(Long coachId);

    // Club
    List<Team> findByClub_Id(Long clubId);
}
