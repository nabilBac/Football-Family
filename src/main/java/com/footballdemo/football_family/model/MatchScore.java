package com.footballdemo.football_family.model;

import jakarta.persistence.Embeddable;
import lombok.*;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MatchScore {
    private Integer homeScore;
    private Integer awayScore;
    private Boolean penalties = false;
}
