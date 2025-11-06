package com.footballdemo.football_family.model;

import jakarta.persistence.*;
import lombok.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TournamentPhase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Enumerated(EnumType.STRING)
    private PhaseType type;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id")
    private Event event;

    @OneToMany(mappedBy = "phase", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Match> matches = new ArrayList<>();

    public void addMatch(Match match) {
        matches.add(match);
        match.setPhase(this);
    }
}
