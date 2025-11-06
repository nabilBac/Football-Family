package com.footballdemo.football_family.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlayerStatsDTO {
    private Long id;
    private Long playerId;
    private String playerUsername;
    private int goals;
    private int assists;
    private int yellowCards;
    private int redCards;

    public static PlayerStatsDTO from(com.footballdemo.football_family.model.PlayerStats stats) {
        return PlayerStatsDTO.builder()
                .id(stats.getId())
                .playerId(stats.getPlayer().getId())
                .playerUsername(stats.getPlayer().getUsername())
                .goals(stats.getGoals())
                .assists(stats.getAssists())
                .yellowCards(stats.getYellowCards())
                .redCards(stats.getRedCards())
                .build();
    }
}
