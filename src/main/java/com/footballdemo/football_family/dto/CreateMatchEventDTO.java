package com.footballdemo.football_family.dto;

import com.footballdemo.football_family.model.MatchEventType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateMatchEventDTO {

    private Long matchId;
    private MatchEventType type;
    private Integer minute;
    private String playerName;
    private Long teamId;
    private String details;
}