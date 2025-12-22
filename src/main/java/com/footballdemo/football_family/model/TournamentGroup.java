package com.footballdemo.football_family.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})  // ← SUR LA CLASSE
public class TournamentGroup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "groups", "teams"})  // ← IMPORTANT
    private Event event;

    @ManyToMany(fetch = FetchType.EAGER)  // ← EAGER pour charger les teams
    @JoinTable(
            name = "group_teams",
            joinColumns = @JoinColumn(name = "group_id"),
            inverseJoinColumns = @JoinColumn(name = "team_id")
    )
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "groups", "event"})
    @Builder.Default
    private List<Team> teams = new ArrayList<>();
}