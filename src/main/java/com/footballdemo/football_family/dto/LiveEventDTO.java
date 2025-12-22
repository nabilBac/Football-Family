package com.footballdemo.football_family.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class LiveEventDTO {
    private Long id;
    private String titre;
    private String streamer;
    private String action; // "STARTED" ou "ENDED"
}
