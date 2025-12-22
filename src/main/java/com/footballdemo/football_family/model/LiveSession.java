package com.footballdemo.football_family.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" }) // ← Ajoute ceci
public class LiveSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String titre;
    private String description;
    private String streamer;
    private boolean actif = false;
    private LocalDateTime dateDebut;
    private LocalDateTime dateFin;

    // 🧩 Relier le live à un utilisateur
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    @JsonIgnoreProperties({ "liveSessions", "memberships", "eventsOrganized", "registrations", "password" }) // ← Ajoute
                                                                                                             // ceci
    private User user;

    // ✅ Constructeur personnalisé
    public LiveSession(String titre, String description, String streamer, User user) {
        this.titre = titre;
        this.description = description;
        this.streamer = streamer;
        this.user = user;
        this.dateDebut = LocalDateTime.now();
        this.actif = true;
    }
}