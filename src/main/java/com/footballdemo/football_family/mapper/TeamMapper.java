package com.footballdemo.football_family.mapper;

import com.footballdemo.football_family.dto.TeamResponseDTO;
import com.footballdemo.football_family.model.Team;

public class TeamMapper {

    public static TeamResponseDTO toDTO(Team team) {
        return TeamResponseDTO.builder()
                .id(team.getId())
                .name(team.getName())
                .category(team.getCategory())
                .color(team.getColor())
                .teamType(team.getTeamType().name())
                .clubId(team.getClub() != null ? team.getClub().getId() : null)
                .eventId(team.getEvent() != null ? team.getEvent().getId() : null)
                .coachId(team.getCoach() != null ? team.getCoach().getId() : null)
                .build();
    }
}
