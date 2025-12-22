package com.footballdemo.football_family.service;

import com.footballdemo.football_family.dto.CreateMatchEventDTO;
import com.footballdemo.football_family.dto.MatchEventDTO;
import com.footballdemo.football_family.model.Match;
import com.footballdemo.football_family.model.MatchEvent;
import com.footballdemo.football_family.model.MatchEventType;
import com.footballdemo.football_family.model.Team;
import com.footballdemo.football_family.repository.MatchEventRepository;
import com.footballdemo.football_family.repository.MatchRepository;
import com.footballdemo.football_family.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MatchEventService {

    private final MatchEventRepository eventRepo;
    private final MatchRepository matchRepo;
    private final TeamRepository teamRepo;
    private final SimpMessagingTemplate messagingTemplate; // ✅ WebSocket

    // ========================================
    // 📊 CRÉATION D'ÉVÉNEMENTS
    // ========================================

    /**
     * Créer un événement et le broadcaster via WebSocket
     */
    @Transactional
    public MatchEventDTO createEvent(CreateMatchEventDTO dto) {
        
        Match match = matchRepo.findById(dto.getMatchId())
                .orElseThrow(() -> new RuntimeException("Match introuvable"));

        Team team = null;
        if (dto.getTeamId() != null) {
            team = teamRepo.findById(dto.getTeamId()).orElse(null);
        }

        MatchEvent event = MatchEvent.builder()
                .match(match)
                .type(dto.getType())
                .minute(dto.getMinute())
                .playerName(dto.getPlayerName())
                .team(team)
                .details(dto.getDetails())
                .build();

        event = eventRepo.save(event);

        // 🔥 BROADCAST VIA WEBSOCKET
        MatchEventDTO eventDTO = new MatchEventDTO(event);
        broadcastEvent(eventDTO);

        return eventDTO;
    }

    /**
     * Créer un événement GOAL automatiquement
     */
    @Transactional
    public void createGoalEvent(Match match, String playerName, Long teamId) {
        
        Team team = teamRepo.findById(teamId).orElse(null);
        
        MatchEvent event = MatchEvent.builder()
                .match(match)
                .type(MatchEventType.GOAL)
                .minute(getCurrentMatchMinute(match))
                .playerName(playerName)
                .team(team)
                .details("⚽ But de " + playerName)
                .build();

        event = eventRepo.save(event);
        
        // 🔥 BROADCAST
        broadcastEvent(new MatchEventDTO(event));
    }

    /**
     * Créer un événement MI-TEMPS
     */
    @Transactional
    public void createHalfTimeEvent(Match match) {
        
        MatchEvent event = MatchEvent.builder()
                .match(match)
                .type(MatchEventType.HALF_TIME)
                .minute(45)
                .details("⏰ Mi-temps")
                .build();

        event = eventRepo.save(event);
        broadcastEvent(new MatchEventDTO(event));
    }

    /**
     * Créer un événement FIN DE MATCH
     */
    @Transactional
    public void createFullTimeEvent(Match match) {
        
        MatchEvent event = MatchEvent.builder()
                .match(match)
                .type(MatchEventType.FULL_TIME)
                .minute(90)
                .details("🏆 Fin du match")
                .build();

        event = eventRepo.save(event);
        broadcastEvent(new MatchEventDTO(event));
    }

    /**
     * Créer un événement DÉBUT DE MATCH
     */
    @Transactional
    public void createMatchStartedEvent(Match match) {
        
        MatchEvent event = MatchEvent.builder()
                .match(match)
                .type(MatchEventType.MATCH_STARTED)
                .minute(0)
                .details("🔴 Match commencé")
                .build();

        event = eventRepo.save(event);
        broadcastEvent(new MatchEventDTO(event));
    }

    /**
     * Créer un événement CARTON JAUNE
     */
    @Transactional
    public void createYellowCardEvent(Match match, String playerName, Long teamId) {
        
        Team team = teamRepo.findById(teamId).orElse(null);
        
        MatchEvent event = MatchEvent.builder()
                .match(match)
                .type(MatchEventType.YELLOW_CARD)
                .minute(getCurrentMatchMinute(match))
                .playerName(playerName)
                .team(team)
                .details("🟨 Carton jaune pour " + playerName)
                .build();

        event = eventRepo.save(event);
        broadcastEvent(new MatchEventDTO(event));
    }

    /**
     * Créer un événement CARTON ROUGE
     */
    @Transactional
    public void createRedCardEvent(Match match, String playerName, Long teamId) {
        
        Team team = teamRepo.findById(teamId).orElse(null);
        
        MatchEvent event = MatchEvent.builder()
                .match(match)
                .type(MatchEventType.RED_CARD)
                .minute(getCurrentMatchMinute(match))
                .playerName(playerName)
                .team(team)
                .details("🟥 Carton rouge pour " + playerName)
                .build();

        event = eventRepo.save(event);
        broadcastEvent(new MatchEventDTO(event));
    }

    // ========================================
    // 📡 WEBSOCKET BROADCAST
    // ========================================

    /**
     * Broadcaster un événement via WebSocket
     */
    private void broadcastEvent(MatchEventDTO eventDTO) {
        
        // 🔥 Broadcast vers le match spécifique
        messagingTemplate.convertAndSend(
            "/topic/match/" + eventDTO.getMatchId(), 
            eventDTO
        );

        // 🔥 Broadcast vers le tournoi entier
        messagingTemplate.convertAndSend(
            "/topic/event/" + eventDTO.getEventId(), 
            eventDTO
        );

        // 🔥 Broadcast global (tous les matchs live)
        messagingTemplate.convertAndSend(
            "/topic/live-matches", 
            eventDTO
        );

        System.out.println("📡 Event broadcasted: " + eventDTO.getType() + " - Match " + eventDTO.getMatchId());
    }

    // ========================================
    // 📋 RÉCUPÉRATION D'ÉVÉNEMENTS
    // ========================================

    /**
     * Récupérer tous les événements d'un match
     */
    public List<MatchEventDTO> getMatchEvents(Long matchId) {
        return eventRepo.findByMatchIdOrderByCreatedAtDesc(matchId)
                .stream()
                .map(MatchEventDTO::new)
                .collect(Collectors.toList());
    }

    /**
     * Récupérer les événements récents d'un tournoi
     */
    public List<MatchEventDTO> getEventFeed(Long eventId, int limit) {
        return eventRepo.findRecentByEventId(eventId)
                .stream()
                .limit(limit)
                .map(MatchEventDTO::new)
                .collect(Collectors.toList());
    }

    /**
     * Récupérer le dernier événement d'un match
     */
    public MatchEventDTO getLastMatchEvent(Long matchId) {
        MatchEvent event = eventRepo.findFirstByMatchIdOrderByCreatedAtDesc(matchId);
        return event != null ? new MatchEventDTO(event) : null;
    }

    // ========================================
    // 🛠️ UTILITAIRES
    // ========================================

    /**
     * Calculer la minute actuelle du match (approximatif)
     */
    private Integer getCurrentMatchMinute(Match match) {
        // TODO: Implémenter un vrai timer si besoin
        // Pour l'instant, on retourne une valeur par défaut
        return 0;
    }

    /**
     * Supprimer tous les événements d'un match
     */
    @Transactional
    public void deleteMatchEvents(Long matchId) {
        eventRepo.deleteByMatchId(matchId);
    }
}