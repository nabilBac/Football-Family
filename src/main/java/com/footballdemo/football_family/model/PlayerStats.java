package com.footballdemo.football_family.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlayerStats {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private int goals;
    private int assists;
    private int yellowCards;
    private int redCards;

    @ManyToOne
    @JoinColumn(name = "player_id")
    private User player;

    @ManyToOne
    @JoinColumn(name = "match_id")
    private Match match;
}
