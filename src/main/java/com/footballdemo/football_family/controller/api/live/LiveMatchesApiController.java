package com.footballdemo.football_family.controller.api.live;

import com.footballdemo.football_family.dto.ApiResponse;
import com.footballdemo.football_family.dto.LiveMatchDTO;
import com.footballdemo.football_family.dto.MatchEventDTO;
import com.footballdemo.football_family.model.Match;
import com.footballdemo.football_family.model.MatchStatus;
import com.footballdemo.football_family.repository.MatchRepository;
import com.footballdemo.football_family.service.MatchEventService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/public/live")
@RequiredArgsConstructor
public class LiveMatchesApiController {

    private final MatchRepository matchRepo;
    private final MatchEventService eventService;

    /**
     * 🔴 Récupérer tous les matchs en direct
     */
    @GetMapping("/matches")
    @PreAuthorize("permitAll()")
    public ApiResponse<List<LiveMatchDTO>> getLiveMatches() {

        List<Match> liveMatches = matchRepo.findByStatus(MatchStatus.IN_PROGRESS);

        List<LiveMatchDTO> dtos = liveMatches.stream()
                .map(match -> {
                    LiveMatchDTO dto = new LiveMatchDTO(match);
                    
                    // 🔥 Ajouter le dernier événement
                    MatchEventDTO lastEvent = eventService.getLastMatchEvent(match.getId());
                    if (lastEvent != null) {
                        dto.setLastEvent(formatEventText(lastEvent));
                    }
                    
                    return dto;
                })
                .collect(Collectors.toList());

        return new ApiResponse<>(true, "Matchs en direct récupérés", dtos);
    }

   /**
 * 📰 Récupérer le fil d'actualité d'un tournoi
 */
@GetMapping("/feed/event/{eventId}")
@PreAuthorize("permitAll()")
public ApiResponse<List<MatchEventDTO>> getEventFeed(@PathVariable Long eventId) {

    try {
        List<MatchEventDTO> events = eventService.getEventFeed(eventId, 50);
        
        return new ApiResponse<>(true, "Fil d'actualité récupéré", events);
        
    } catch (Exception e) {
        // 🔥 LOG L'ERREUR
        System.err.println("❌ Erreur getEventFeed: " + e.getMessage());
        e.printStackTrace();
        
        // Retourner une liste vide au lieu de crasher
        return new ApiResponse<>(true, "Aucun événement", new ArrayList<>());
    }
}

    /**
     * 📊 Récupérer tous les événements d'un match
     */
    @GetMapping("/match/{matchId}/events")
    @PreAuthorize("permitAll()")
    public ApiResponse<List<MatchEventDTO>> getMatchEvents(@PathVariable Long matchId) {

        List<MatchEventDTO> events = eventService.getMatchEvents(matchId);

        return new ApiResponse<>(true, "Événements du match récupérés", events);
    }

    /**
     * 📊 Formater un événement en texte lisible
     */
    private String formatEventText(MatchEventDTO event) {
        switch (event.getType()) {
            case GOAL:
                return "⚽ But de " + (event.getPlayerName() != null ? event.getPlayerName() : "Joueur") + 
                       " (" + (event.getMinute() != null ? event.getMinute() + "'" : "");
            case YELLOW_CARD:
                return "🟨 Carton jaune • " + (event.getPlayerName() != null ? event.getPlayerName() : "");
            case RED_CARD:
                return "🟥 Carton rouge • " + (event.getPlayerName() != null ? event.getPlayerName() : "");
            case HALF_TIME:
                return "⏰ Mi-temps";
            case FULL_TIME:
                return "🏆 Fin du match";
            case MATCH_STARTED:
                return "🔴 Match commencé";
            default:
                return event.getType().toString();
        }
    }
}