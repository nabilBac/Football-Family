package com.footballdemo.football_family.dto;

import com.footballdemo.football_family.model.Team;

public class TeamStats {

    private Long teamId;
    private Team team;
    private int points;
    private int goalsFor;
    private int goalsAgainst;

    public TeamStats(Team team) {
        this.team = team;
        this.teamId = team.getId();
        this.points = 0;
        this.goalsFor = 0;
        this.goalsAgainst = 0;
    }

    public Long getTeamId() { return teamId; }
    public Team getTeam() { return team; }
    public int getPoints() { return points; }
    public int getGoalsFor() { return goalsFor; }
    public int getGoalsAgainst() { return goalsAgainst; }

    public void addGoalsFor(int g) { this.goalsFor += g; }
    public void addGoalsAgainst(int g) { this.goalsAgainst += g; }
    public void addPoints(int p) { this.points += p; }

    // 🔥 AJOUT ICI : convertir en Team pour le bracket
   

    public TeamLightDTO toLightDTO() {
    TeamLightDTO dto = new TeamLightDTO();
    dto.setId(this.team.getId());
    dto.setName(this.team.getName());
    return dto;
}

}
