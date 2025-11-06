package com.footballdemo.football_family.repository;

import com.footballdemo.football_family.model.EventRegistration;
import com.footballdemo.football_family.model.RegistrationStatus;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Repository
public interface EventRegistrationRepository extends JpaRepository<EventRegistration, Long> {
    List<EventRegistration> findByEventId(Long eventId);

    List<EventRegistration> findByPlayerId(Long playerId);

    Page<EventRegistration> findByEventId(Long eventId, Pageable pageable);

    Optional<EventRegistration> findByEventIdAndPlayerId(Long eventId, Long playerId);

    List<EventRegistration> findByEventIdAndStatus(Long eventId, RegistrationStatus status);

    long countByEventIdAndStatus(Long eventId, RegistrationStatus status);
}
