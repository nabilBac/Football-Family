package com.footballdemo.football_family.dto;

import lombok.Data;

@Data
public class CreateMatchDTO {

    private Long groupId;   // ID de la poule
    private Long teamAId;   // équipe A
    private Long teamBId;   // équipe B

    private String field;   // terrain
    private String date;    // "2025-12-15"
    private String time;    // "10:30"
}
