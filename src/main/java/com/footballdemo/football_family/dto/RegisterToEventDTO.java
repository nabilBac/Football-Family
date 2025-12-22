package com.footballdemo.football_family.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RegisterToEventDTO {

    private Long eventId;        // id de l’événement à rejoindre
    private String notes; 
    private Long playerId; // optionnel, mais future-proof
       // notes facultatives
    
}
