package com.footballdemo.football_family.controller.ws;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.Map;

@Controller
public class MatchWebSocketController {

    private final SimpMessagingTemplate messagingTemplate;

    public MatchWebSocketController(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * 📡 Handler pour les mises à jour de match en temps réel
     * (Optionnel - pour l'instant les events sont envoyés directement par le service)
     */
    @MessageMapping("/match/update")
    public void handleMatchUpdate(@Payload Map<String, Object> update) {
        
        Object matchIdObj = update.get("matchId");
        if (matchIdObj == null) {
            System.err.println("❌ Match update sans matchId");
            return;
        }

        String matchId = matchIdObj.toString();
        
        // Broadcast vers les abonnés du match
        messagingTemplate.convertAndSend("/topic/match/" + matchId, update);
        
        System.out.println("📡 Match update broadcasted for match " + matchId);
    }
}