package com.footballdemo.football_family.dto;

import com.footballdemo.football_family.model.Team;

public class TeamStats {

    private Long teamId;
    private Team team;
    private int points;
    private int played;        // 🆕 Matchs joués
    private int won;           // 🆕 Victoires
    private int drawn;         // 🆕 Matchs nuls
    private int lost;          // 🆕 Défaites
    private int goalsFor;
    private int goalsAgainst;

    public TeamStats(Team team) {
        this.team = team;
        this.teamId = team.getId();
        this.points = 0;
        this.played = 0;
        this.won = 0;
        this.drawn = 0;
        this.lost = 0;
        this.goalsFor = 0;
        this.goalsAgainst = 0;
    }

    // ========== GETTERS ==========
    public Long getTeamId() { return teamId; }
    public Team getTeam() { return team; }
    public int getPoints() { return points; }
    public int getPlayed() { return played; }
    public int getWon() { return won; }
    public int getDrawn() { return drawn; }
    public int getLost() { return lost; }
    public int getGoalsFor() { return goalsFor; }
    public int getGoalsAgainst() { return goalsAgainst; }
    
    // Différence de buts
    public int getGoalDifference() {
        return goalsFor - goalsAgainst;
    }

    // ========== CONVERSION ==========
    public TeamLightDTO toLightDTO() {
        TeamLightDTO dto = new TeamLightDTO();
        dto.setId(this.team.getId());
        dto.setName(this.team.getName());
        return dto;
    }

    // ========== MAJ STATS VIA UN MATCH ==========
public void recordMatch(int goalsScored, int goalsConceded) {
    this.played++;

    this.goalsFor += goalsScored;
    this.goalsAgainst += goalsConceded;

    if (goalsScored > goalsConceded) {
        this.won++;
        this.points += 3;
    } else if (goalsScored == goalsConceded) {
        this.drawn++;
        this.points += 1;
    } else {
        this.lost++;
    }
}

}