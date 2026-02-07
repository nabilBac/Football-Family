package com.footballdemo.football_family.dto;

import com.footballdemo.football_family.model.Match;
import com.footballdemo.football_family.model.Team;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@Builder
public class MatchDTO {

    private Long id;
    private String teamA;
    private String teamB;
    
    // 🔥 NOUVEAU : IDs des équipes
    private Long teamAId;
    private Long teamBId;
    
    private String group;
    private String status;

    private Integer scoreTeamA;
    private Integer scoreTeamB;

    private Boolean wentToPenalties;
    private Integer penaltyScoreTeamA;
    private Integer penaltyScoreTeamB;

    private Boolean wentToExtraTime;
    private Integer extraTimeScoreTeamA;
    private Integer extraTimeScoreTeamB;

    private LocalDate date;
    private LocalTime time;
    private String field;
    private String location;
    private String round;

    private String competitionLevel;  
    private String fieldType;  

    public static MatchDTO from(Match match) {
        return MatchDTO.builder()
                .id(match.getId())
                .teamA(match.getTeamA() != null ? formatTeam(match.getTeamA()) : null)
                .teamB(match.getTeamB() != null ? formatTeam(match.getTeamB()) : null)
                // 🔥 NOUVEAU : Ajouter les IDs
                .teamAId(match.getTeamA() != null ? match.getTeamA().getId() : null)
                .teamBId(match.getTeamB() != null ? match.getTeamB().getId() : null)
                .group(match.getGroup() != null ? match.getGroup().getName() : null)
                .status(match.getStatus().name())
                .scoreTeamA(match.getScoreTeamA())
                .scoreTeamB(match.getScoreTeamB())
                .wentToPenalties(match.getWentToPenalties())
                .penaltyScoreTeamA(match.getPenaltyScoreTeamA())
                .penaltyScoreTeamB(match.getPenaltyScoreTeamB())
                .wentToExtraTime(match.getWentToExtraTime())
                .extraTimeScoreTeamA(match.getExtraTimeScoreTeamA())
                .extraTimeScoreTeamB(match.getExtraTimeScoreTeamB())
                .date(match.getDate())
                .time(match.getTime())
                .field(match.getField())
                .location(match.getLocation())
                .round(match.getRound())
                .competitionLevel(match.getCompetitionLevel() != null 
                ? match.getCompetitionLevel().name() 
                : null)
                .fieldType(match.getFieldType() != null 
                 ? match.getFieldType().name() 
                    : null)
                .build();
    }

    private static String formatTeam(Team team) {
        if (team.getClub() != null) {
            return team.getClub().getName() + " - " + team.getName();
        }
        return team.getName();
    }
}