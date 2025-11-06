package com.footballdemo.football_family.repository;

import com.footballdemo.football_family.model.Match;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Repository
public interface MatchRepository extends JpaRepository<Match, Long> {

    List<Match> findByEventId(Long eventId);
List<Match> findByDate(LocalDate date);
List<Match> findByLocationContainingIgnoreCase(String location);

Page<Match> findByEventId(Long eventId, Pageable pageable);
}
