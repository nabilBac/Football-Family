package com.footballdemo.football_family.dto;

import com.footballdemo.football_family.model.EventStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PublicEventDTO {
    
    private Long eventId;
    private String name;
    private String description;
    private LocalDate date;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String location;
    private String organizer;
    private EventStatus status;
    
    private List<MatchDTO> upcomingMatches = new ArrayList<>();
    private List<MatchDTO> recentResults = new ArrayList<>();
}