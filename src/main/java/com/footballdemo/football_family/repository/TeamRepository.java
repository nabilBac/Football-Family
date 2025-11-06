package com.footballdemo.football_family.repository;



import com.footballdemo.football_family.model.Team;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TeamRepository extends JpaRepository<Team, Long> {

    // Chercher les équipes par coach
    List<Team> findByCoachId(Long coachId);

    // Chercher les équipes par catégorie
    List<Team> findByCategory(String category);
}

