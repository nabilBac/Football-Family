package com.footballdemo.football_family.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class FinalResultsDTO {

    private String champion;
    private String finalist;
    private String thirdPlace;
    private String fourthPlace;

    private String consolanteWinner;
    private String consolanteFinalist;
    private String consolanteThird;
    private String consolanteFourth;
}
