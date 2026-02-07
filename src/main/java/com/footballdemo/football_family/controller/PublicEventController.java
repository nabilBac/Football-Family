package com.footballdemo.football_family.controller;

import com.footballdemo.football_family.dto.MatchDTO;
import com.footballdemo.football_family.dto.PublicEventDTO;
import com.footballdemo.football_family.model.Event;

import com.footballdemo.football_family.repository.EventRepository;
import com.footballdemo.football_family.repository.MatchRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/public/events")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PublicEventController {

    private final EventRepository eventRepository;
    private final MatchRepository matchRepository;

    /**
     * Vue publique d'un événement - ACCESSIBLE SANS CONNEXION
     */
    @GetMapping("/{eventId}")
    public ResponseEntity<PublicEventDTO> getPublicEvent(@PathVariable Long eventId) {
        
        Event event = eventRepository.findById(eventId)
            .orElseThrow(() -> new EntityNotFoundException("Événement non trouvé"));

        PublicEventDTO dto = new PublicEventDTO();
        dto.setEventId(event.getId());
        dto.setName(event.getName());
        dto.setDescription(event.getDescription());
        dto.setDate(event.getDate());
        dto.setStartTime(event.getStartTime());
        dto.setEndTime(event.getEndTime());
        dto.setLocation(event.getLocation());
        dto.setOrganizer(event.getOrganizer().getUsername());
        dto.setStatus(event.getStatus());

        // Prochains matchs (limité à 10)
        List<MatchDTO> upcomingMatches = matchRepository.findUpcomingMatchesByEventId(eventId, 10)
            .stream()
            .map(MatchDTO::from)
            .collect(Collectors.toList());
        dto.setUpcomingMatches(upcomingMatches);

        // Résultats récents (limité à 10)
        List<MatchDTO> recentResults = matchRepository.findRecentResultsByEventId(eventId, 10)
            .stream()
            .map(MatchDTO::from)
            .collect(Collectors.toList());
        dto.setRecentResults(recentResults);

        return ResponseEntity.ok(dto);
    }
}