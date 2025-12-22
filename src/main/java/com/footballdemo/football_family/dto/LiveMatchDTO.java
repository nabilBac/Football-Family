package com.footballdemo.football_family.dto;

import com.footballdemo.football_family.model.Match;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LiveMatchDTO {

    private Long id;
    private Long eventId;
    private String eventName;
    
    private Long teamAId;
    private String teamAName;
    private Integer scoreA;
    
    private Long teamBId;
    private String teamBName;
    private Integer scoreB;
    
    private String status;
    private LocalDate date;
    private LocalTime time;
    private String field;
    private String round;
    
    private Integer minute; // Minute actuelle du match
    private String lastEvent; // Dernier événement (ex: "⚽ But de Thomas (42')")

    // 🔧 Constructeur depuis entité
    public LiveMatchDTO(Match match) {
        this.id = match.getId();
        this.eventId = match.getEvent().getId();
        this.eventName = match.getEvent().getName();
        this.status = match.getStatus().name();
        this.date = match.getDate();
        this.time = match.getTime();
        this.field = match.getField();
        this.round = match.getRound();
        
        if (match.getTeamA() != null) {
            this.teamAId = match.getTeamA().getId();
            this.teamAName = match.getTeamA().getName();
        }
        
        if (match.getTeamB() != null) {
            this.teamBId = match.getTeamB().getId();
            this.teamBName = match.getTeamB().getName();
        }
        
        this.scoreA = match.getScoreTeamA();
        this.scoreB = match.getScoreTeamB();
    }
}