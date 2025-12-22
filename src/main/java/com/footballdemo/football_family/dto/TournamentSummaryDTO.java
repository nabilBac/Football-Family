package com.footballdemo.football_family.dto;

import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
public class TournamentSummaryDTO {

    private Map<Long, List<TeamLightDTO>> rankings;

    private List<BracketMatchDTO> bracket;
    private List<BracketMatchDTO> consolante;

    private FinalResultsDTO finalResults;
}
