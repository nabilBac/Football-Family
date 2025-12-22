package com.footballdemo.football_family.dto;


import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;
import com.footballdemo.football_family.model.ClubType;


@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClubRegistrationDTO {

    @NotBlank
    @Size(max = 100)
    private String name;

    @NotBlank
    @Size(min = 14, max = 14)
    private String siret;

    private String address;
    private String city;
    private String zipCode;

    private String phone;
    private String email;

    private String description;

    @NotNull
    private ClubType type;    // ➜ FOOT, FUTSAL, etc. (si tu as ce type d’énumération)
}
