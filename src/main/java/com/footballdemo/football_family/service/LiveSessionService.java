package com.footballdemo.football_family.service;

import com.footballdemo.football_family.dto.LiveEventDTO;
import com.footballdemo.football_family.model.LiveSession;
import com.footballdemo.football_family.model.User;
import com.footballdemo.football_family.repository.LiveSessionRepository;

import jakarta.annotation.PostConstruct;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class LiveSessionService {

    private final LiveSessionRepository repo;
    private final UserService userService;

    // 🧩 Pour envoyer des événements WebSocket
    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    public LiveSessionService(LiveSessionRepository repo, UserService userService) {
        this.repo = repo;
        this.userService = userService;
    }

    public List<LiveSession> getLivesActifs() {
        return repo.findByActifTrue();
    }

    public LiveSession startLive(String titre, String description, String streamer) {
        User currentUser = userService.getCurrentUser();

        if (currentUser == null) {
            throw new RuntimeException("Aucun utilisateur connecté — impossible de démarrer un live.");
        }

        // 🔒 On écrase le streamer transmis par le front avec le vrai utilisateur
        // connecté
        streamer = currentUser.getUsername();

        // ⚠️ Étape 1 : désactiver tout ancien live actif du même utilisateur
        List<LiveSession> oldLives = repo.findByUserAndActifTrue(currentUser);
        for (LiveSession old : oldLives) {
            old.setActif(false);
            old.setDateFin(LocalDateTime.now());
            repo.save(old);
        }

        // 🚀 Étape 2 : créer le nouveau live
        LiveSession live = new LiveSession(titre, description, streamer, currentUser);
        live.setActif(true);
        live.setDateDebut(LocalDateTime.now());
        repo.save(live);

        // 📡 Étape 3 : notifier les viewers
        messagingTemplate.convertAndSend("/topic/lives",
                new LiveEventDTO(live.getId(), live.getTitre(), live.getStreamer(), "STARTED"));

        return live;
    }

    public void endLive(Long id) {
        Optional<LiveSession> optLive = repo.findById(id);

        if (optLive.isEmpty()) {
            System.err.println("⚠️ Avertissement : impossible de terminer le live " + id + " (introuvable en base)");
            return;
        }

        LiveSession live = optLive.get();

        // 🔒 Vérifie si le live est déjà inactif
        if (!live.isActif()) {
            System.out.println("ℹ️ Le live " + id + " est déjà terminé.");
            return;
        }

        live.setActif(false);
        live.setDateFin(LocalDateTime.now());
        repo.save(live);

        // 🛑 Notifie tous les abonnés WebSocket
        messagingTemplate.convertAndSend("/topic/lives",
                new LiveEventDTO(live.getId(), live.getTitre(), live.getStreamer(), "ENDED"));

        System.out.println("✅ Live terminé : " + live.getStreamer() + " (id=" + id + ")");
    }

    public List<LiveSession> findActiveLiveByUser(User user) {
        return repo.findByUserAndActifTrue(user);
    }

    // 🧹 Nettoyage automatique au démarrage de l’application
    @PostConstruct
    public void resetActiveLivesOnStartup() {
        List<LiveSession> activeLives = repo.findByActifTrue();
        if (!activeLives.isEmpty()) {
            System.out.println("🧹 Nettoyage : désactivation de " + activeLives.size()
                    + " lives restés actifs après redémarrage.");

            for (LiveSession live : activeLives) {
                live.setActif(false);
                live.setDateFin(LocalDateTime.now());
                repo.save(live);
            }

            System.out.println("✅ Tous les anciens lives actifs ont été désactivés au démarrage.");
        } else {
            System.out.println("✅ Aucun live actif à nettoyer au démarrage.");
        }
    }

    @Scheduled(fixedRate = 300000) // toutes les 5 minutes
    public void cleanOldLives() {
        LocalDateTime limit = LocalDateTime.now().minusHours(2);
        List<LiveSession> oldLives = repo.findByActifTrueOrderByDateDebutDesc();

        for (LiveSession live : oldLives) {
            if (live.getDateDebut().isBefore(limit)) {
                live.setActif(false);
                live.setDateFin(LocalDateTime.now());
                repo.save(live);

                // 🧩 NOTIFICATION temps réel aux viewers via WebSocket
                messagingTemplate.convertAndSend(
                        "/topic/lives",
                        new LiveEventDTO(live.getId(), live.getTitre(), live.getStreamer(), "ENDED"));

                System.out.println("🕒 Auto-nettoyage du live expiré : " + live.getStreamer());
            }
        }
    }

    public LiveSession getLiveById(Long id) {
        return repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Live introuvable avec ID : " + id));
    }

}
