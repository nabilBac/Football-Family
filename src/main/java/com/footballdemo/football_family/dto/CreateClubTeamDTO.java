package com.footballdemo.football_family.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateClubTeamDTO {

    private String name;
    private String category; 
    private String color;
    private Long coachId;   // optionnel selon ton modèle
}
