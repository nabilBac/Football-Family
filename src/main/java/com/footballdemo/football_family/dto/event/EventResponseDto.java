package com.footballdemo.football_family.dto.event;

import java.time.LocalDate;
import lombok.Data;

@Data
public class EventResponseDto {

    private Long id;

    private String name;
    private String description;

    private String type;
    private String registrationType;

    private LocalDate date;

    private String location;
    private String address;
    private String city;
    private String zipCode;

    // Club simplifié
    private Long clubId;
    private String clubName;

    // Organisateur simplifié
    private Long organizerId;
    private String organizerUsername;
}
