package com.footballdemo.football_family.dto;

import com.footballdemo.football_family.model.Match;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MatchDTO {

    private Long id;
    private String teamA;
    private String teamB;
    private String group;
    private String status;

    private Integer scoreTeamA;
    private Integer scoreTeamB;

    public static MatchDTO from(Match match) {
        return MatchDTO.builder()
                .id(match.getId())
                // ✅ AJOUT DU NOM DU CLUB
                .teamA(match.getTeamA() != null 
                    ? match.getTeamA().getClub().getName() + " - " + match.getTeamA().getName() 
                    : null)
                .teamB(match.getTeamB() != null 
                    ? match.getTeamB().getClub().getName() + " - " + match.getTeamB().getName() 
                    : null)
                .group(match.getGroup() != null ? match.getGroup().getName() : null)
                .status(match.getStatus().name())
                .scoreTeamA(match.getScoreTeamA())
                .scoreTeamB(match.getScoreTeamB())
                .build();
    }
}