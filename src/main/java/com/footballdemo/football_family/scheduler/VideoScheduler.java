package com.footballdemo.football_family.scheduler;

import com.footballdemo.football_family.service.VideoService;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.Set;

@Component
public class VideoScheduler {

    private final VideoService videoService;
    private final SimpMessagingTemplate messagingTemplate;

    // SimpMessagingTemplate est utilisé pour envoyer des messages sur le canal WebSocket
    public VideoScheduler(VideoService videoService, SimpMessagingTemplate messagingTemplate) {
        this.videoService = videoService;
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * Tâche planifiée qui s'exécute toutes les 5 secondes (5000 ms) en continu.
     * Elle agrège les likes accumulés et envoie une seule mise à jour par vidéo.
     */
    @Scheduled(fixedRate = 5000) 
    public void aggregateAndSendUpdates() {
        
        // 1. Récupérer les IDs des vidéos qui ont été modifiées et vider la file
        Set<Long> videoIdsToUpdate = videoService.getVideosToUpdateAndClear();

        if (!videoIdsToUpdate.isEmpty()) {
            System.out.println("SCHEDULER: Mise à jour agrégée lancée pour " + videoIdsToUpdate.size() + " vidéos.");

            for (Long videoId : videoIdsToUpdate) {
                
                // 2. Récupérer le nombre de likes actuel depuis la base de données
                Long currentLikesCount = videoService.countLikesForVideo(videoId); 
                
                // 3. Envoyer la mise à jour par WebSocket à tous les clients abonnés
                // On suppose que le topic pour une vidéo est /topic/video/{videoId}
                // Le message envoyé est le nouveau nombre de likes (Long)
                
                // Le client reçoit le long représentant le nouveau compteur de likes.
                messagingTemplate.convertAndSend("/topic/video/" + videoId, currentLikesCount); 
            }
        }
    }
}