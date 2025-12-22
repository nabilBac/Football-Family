package com.footballdemo.football_family.dto;

import lombok.*;

@Getter @Setter
@AllArgsConstructor @NoArgsConstructor
@Builder
public class TeamResponseDTO {

    private Long id;
    private String name;
    private String category;
    private String color;
    private String teamType;

    private Long clubId;
    private Long eventId;
    private Long coachId;
}
