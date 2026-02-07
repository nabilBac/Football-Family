package com.footballdemo.football_family.dto;

import lombok.Data;

@Data
public class GroupRankingDTO {

    private Long teamId;
    private String teamName;

    // ✅ Stats complètes pour le tableau
    private int points = 0;
    private int played = 0;     // ✅ J
    private int wins = 0;       // ✅ G
    private int draws = 0;      // ✅ N
    private int losses = 0;     // ✅ P

    private int goalsFor = 0;
    private int goalsAgainst = 0;

    // ✅ Confrontation directe (optionnel)
    private Integer headToHeadPoints = null;
    private Integer headToHeadGoalDiff = null;

    // ✅ Fair-play
    private int yellowCards = 0;
    private int redCards = 0;

    public GroupRankingDTO(Long id, String name) {
        this.teamId = id;
        this.teamName = name;
    }

    // Jackson va l’exposer comme "goalDifference"
    public int getGoalDifference() {
        return goalsFor - goalsAgainst;
    }

    // Jackson va l’exposer comme "fairPlayScore"
    public int getFairPlayScore() {
        return yellowCards + (redCards * 3);
    }
}
