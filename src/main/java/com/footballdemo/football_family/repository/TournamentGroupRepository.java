package com.footballdemo.football_family.repository;

import com.footballdemo.football_family.model.TournamentGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TournamentGroupRepository extends JpaRepository<TournamentGroup, Long> {

    List<TournamentGroup> findByEventId(Long eventId);

}
