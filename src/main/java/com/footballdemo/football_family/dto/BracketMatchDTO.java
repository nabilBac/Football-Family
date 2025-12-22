package com.footballdemo.football_family.dto;

import com.footballdemo.football_family.model.Match;
import lombok.Data;

@Data
public class BracketMatchDTO {

    private Long id;
    private String round;
    private String teamA;
    private String teamB;
    private Integer scoreA;
    private Integer scoreB;
    private Long nextMatchId;
    private String nextSlot;

    public static BracketMatchDTO from(Match m) {
        BracketMatchDTO dto = new BracketMatchDTO();

        dto.setId(m.getId());
        dto.setRound(m.getRound());
        
        // ✅ AJOUT DU NOM DU CLUB
        dto.setTeamA(m.getTeamA() != null 
            ? m.getTeamA().getClub().getName() + " - " + m.getTeamA().getName() 
            : null);
        dto.setTeamB(m.getTeamB() != null 
            ? m.getTeamB().getClub().getName() + " - " + m.getTeamB().getName() 
            : null);
        
        dto.setScoreA(m.getScoreTeamA());
        dto.setScoreB(m.getScoreTeamB());

        dto.setNextMatchId(
                m.getNextMatch() != null ? m.getNextMatch().getId() : null
        );

        dto.setNextSlot(m.getNextSlot());

        return dto;
    }
}