package com.footballdemo.football_family.dto;

import com.footballdemo.football_family.model.MatchEvent;
import com.footballdemo.football_family.model.MatchEventType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MatchEventDTO {

    private Long id;
    private Long matchId;
    private MatchEventType type;
    private Integer minute;
    private String playerName;
    private Long teamId;
    private String teamName;
    private String details;
    private LocalDateTime createdAt;

    // 🏆 Infos match (pour le fil d'actualité)
    private String teamAName;
    private String teamBName;
    private Integer scoreA;
    private Integer scoreB;
    private Long eventId;

    // 🔧 Constructeur depuis entité
    public MatchEventDTO(MatchEvent event) {
        this.id = event.getId();
        this.matchId = event.getMatch().getId();
        this.type = event.getType();
        this.minute = event.getMinute();
        this.playerName = event.getPlayerName();
        this.details = event.getDetails();
        this.createdAt = event.getCreatedAt();

        // Équipe
        if (event.getTeam() != null) {
            this.teamId = event.getTeam().getId();
            this.teamName = event.getTeam().getName();
        }

        // Infos match
        if (event.getMatch() != null) {
            this.eventId = event.getMatch().getEvent().getId();
            this.scoreA = event.getMatch().getScoreTeamA();
            this.scoreB = event.getMatch().getScoreTeamB();

            if (event.getMatch().getTeamA() != null) {
                this.teamAName = event.getMatch().getTeamA().getName();
            }
            if (event.getMatch().getTeamB() != null) {
                this.teamBName = event.getMatch().getTeamB().getName();
            }
        }
    }
}