package com.footballdemo.football_family.dto;

import com.footballdemo.football_family.model.ClubType;
import jakarta.validation.constraints.*;
import lombok.*;
import org.springframework.web.multipart.MultipartFile;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClubRegistrationDTO {

    @NotBlank(message = "Le nom du club est obligatoire")
    @Size(min = 3, max = 100, message = "Le nom doit contenir entre 3 et 100 caractères")
    private String name;

    @NotBlank(message = "Le numéro SIRET est obligatoire")
    @Pattern(regexp = "\\d{14}", message = "Le SIRET doit contenir exactement 14 chiffres")
    private String siret;

    @NotBlank(message = "L'adresse est obligatoire")
    @Size(max = 200)
    private String address;

    @NotBlank(message = "La ville est obligatoire")
    @Size(max = 100)
    private String city;

    @NotBlank(message = "Le code postal est obligatoire")
    @Pattern(regexp = "\\d{5}", message = "Le code postal doit contenir 5 chiffres")
    private String zipCode;

    @NotBlank(message = "Le téléphone est obligatoire")
    @Pattern(regexp = "0\\d{9}", message = "Le téléphone doit être au format 0XXXXXXXXX")
    private String phone;

    @NotBlank(message = "L'email est obligatoire")
    @Email(message = "Format d'email invalide")
    private String email;

    @NotNull(message = "Le type de club est obligatoire")
    private ClubType type;

    @Size(max = 1000, message = "La description ne peut pas dépasser 1000 caractères")
    private String description;

    // Documents (optionnels pour la création, requis pour vérification)
    private MultipartFile kbisDocument;
    private MultipartFile insuranceDocument;
    private MultipartFile logoFile;
}
