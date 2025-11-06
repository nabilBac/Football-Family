package com.footballdemo.football_family.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Match {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private LocalDate date;
    private String location;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id")
    private Event event;

    @ManyToMany
    @JoinTable(name = "match_teams", joinColumns = @JoinColumn(name = "match_id"), inverseJoinColumns = @JoinColumn(name = "team_id"))
    private List<Team> teams = new ArrayList<>();

    @OneToMany(mappedBy = "match", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PlayerStats> playerStats = new ArrayList<>();

    // 🔹 Nouvelle relation UTF : phase du tournoi
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "phase_id")
    private TournamentPhase phase;

    // 🔹 Score intégré
    @Embedded
    private MatchScore score;

    // 🔹 Statut du match (programmée, en cours, terminée…)
    @Enumerated(EnumType.STRING)
    private MatchStatus status = MatchStatus.SCHEDULED;

    // 🔹 Équipe gagnante / perdante
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "winner_team_id")
    private Team winner;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "loser_team_id")
    private Team loser;

    // Méthodes utilitaires
    public void addTeam(Team team) {
        if (!teams.contains(team)) {
            teams.add(team);
        }
    }

    public void removeTeam(Team team) {
        teams.remove(team);
    }
}
