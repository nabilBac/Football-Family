package com.footballdemo.football_family.dto;



import lombok.Data;

@Data
public class GroupRankingDTO {

    private Long teamId;
    private String teamName;

    public int points = 0;
    public int goalsFor = 0;
    public int goalsAgainst = 0;

    public GroupRankingDTO(Long id, String name) {
        this.teamId = id;
        this.teamName = name;
    }

    public int getGoalDifference() {
        return goalsFor - goalsAgainst;
    }
}

