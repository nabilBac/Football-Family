package com.footballdemo.football_family.dto;

import com.footballdemo.football_family.model.TournamentGroup;
import lombok.Builder;
import lombok.Data;
import java.util.List;


@Data
@Builder
public class TournamentGroupDTO {

    private Long id;
    private String name;
    private List<String> teams;

    public static TournamentGroupDTO from(TournamentGroup group) {
        return TournamentGroupDTO.builder()
                .id(group.getId())
                .name(group.getName())
                .teams(group.getTeams().stream()
                        .map(team -> team.getClub().getName() + " - " + team.getName())  // ← MODIFIE ICI
                        .toList())
                .build();
    }
}