package com.footballdemo.football_family.dto;

import lombok.Getter;
import lombok.Setter;
import com.footballdemo.football_family.model.TeamType; // ✅ IMPORT OBLIGATOIRE

@Getter
@Setter
public class CreateTeamDTO {

    private String name;
    private String category;
    private Long coachId;
    private Long clubId;
    private Long eventId;
    private String color;
    private TeamType teamType;
}
