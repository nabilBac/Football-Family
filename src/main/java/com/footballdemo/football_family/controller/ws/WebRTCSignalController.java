package com.footballdemo.football_family.controller.ws;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import java.util.Map;

@Controller
public class WebRTCSignalController {

    private final SimpMessagingTemplate messagingTemplate;

    @Autowired
    public WebRTCSignalController(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    // SIGNALLING WebRTC (offer / answer / ICE), PAR liveId
    @MessageMapping("/signal")
    public void handleSignal(Map<String, Object> message) {
        try {
            System.out.println("📡 Signal WebRTC reçu : " + message);

            Object liveIdObj = message.get("liveId");
            if (liveIdObj == null) {
                System.err.println("❌ ERREUR : signal SANS liveId ! Signal ignoré.");
                return;
            }

            String liveId = liveIdObj.toString();
            String type = (String) message.get("type");
            String from = (String) message.get("from");

            String destination = "/topic/signal/" + liveId;

            // ✅ IMPORTANT : Quand le viewer demande une offre,
            // on la transmet au streamer via le même topic signal
            if ("REQUEST_OFFER".equals(type) && "viewer".equals(from)) {
                System.out.println("👀 REQUEST_OFFER reçu pour liveId=" + liveId);
                messagingTemplate.convertAndSend(destination, message);
                return;
            }

            // ✅ Tous les autres signaux (offer, answer, candidate, LIVE_ENDED)
            messagingTemplate.convertAndSend(destination, message);

        } catch (Exception e) {
            System.err.println("❌ Erreur signal WebRTC : " + e.getMessage());
            e.printStackTrace();
        }
    }

    // CHAT PAR liveId
    @MessageMapping("/chat")
    public void handleChat(Map<String, Object> message) {
        try {
            System.out.println("💬 Chat reçu : " + message);

            Object liveIdObj = message.get("liveId");
            if (liveIdObj == null) {
                System.err.println("❌ Message chat SANS liveId ! ignoré");
                return;
            }

            String liveId = liveIdObj.toString();
            messagingTemplate.convertAndSend("/topic/chat/" + liveId, message);

        } catch (Exception e) {
            System.err.println("❌ Erreur chat : " + e.getMessage());
            e.printStackTrace();
        }
    }
}