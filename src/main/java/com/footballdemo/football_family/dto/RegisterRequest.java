package com.footballdemo.football_family.dto;

import lombok.Data;
import com.footballdemo.football_family.model.RegistrationProfileType;


@Data
public class RegisterRequest {

    private String username;
    private String email;
    private String password;

    private RegistrationProfileType typeInscription;

    private String siret;
    private String organizationName;
}
