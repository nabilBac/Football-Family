package com.footballdemo.football_family.model;

import jakarta.persistence.*;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonIgnore;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "team")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Team {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    // Catégorie optionnelle (U13, U15, Senior…)
    @Column(length = 50)
    private String category;

    // Couleur optionnelle
    @Column(length = 7)
    private String color;

    // PERMANENT = Club | TEMPORARY = UTF Event
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TeamType teamType;

    // Coach de l'équipe
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "coach_id")
    private User coach;

    // Joueurs (club ou UTF)
    @ManyToMany
    @JoinTable(
            name = "team_players",
            joinColumns = @JoinColumn(name = "team_id"),
            inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    @Builder.Default
    private List<User> players = new ArrayList<>();

    // Équipe de club (si permanente)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "club_id")
    @JsonIgnore
    private Club club;

    // Équipe UTF (si temporaire)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id")
    @JsonIgnore
    private Event event;


    @Column(nullable = false)
private LocalDate createdAt;

@PrePersist
protected void onCreate() {
    createdAt = LocalDate.now();
}

}
