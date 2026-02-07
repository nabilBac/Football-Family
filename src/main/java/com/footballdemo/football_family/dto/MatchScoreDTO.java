package com.footballdemo.football_family.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MatchScoreDTO {
    
    private Long matchId;
    
    // Score temps réglementaire
    private Integer regularTimeTeamA;
    private Integer regularTimeTeamB;
    
    // Prolongations (optionnel)
    private Boolean hadExtraTime;
    private Integer extraTimeTeamA;
    private Integer extraTimeTeamB;
    
    // Tirs au but (optionnel)
    private Boolean hadPenalties;
    private Integer penaltyTeamA;
    private Integer penaltyTeamB;
}