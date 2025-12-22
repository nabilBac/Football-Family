package com.footballdemo.football_family.dto;

import lombok.Data;

@Data
public class ClubCreateRequest {
    private String name;
    private String siret;
    private String address;
    private String city;
    private String zipCode;
    private String email;
    private String phone;
    private String description;
}

