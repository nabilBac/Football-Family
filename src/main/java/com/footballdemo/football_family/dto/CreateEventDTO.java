package com.footballdemo.football_family.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO pour la création d'un événement.
 * Supporte les 2 modes :
 * - INDIVIDUAL (UTF) : Tournoi avec inscriptions individuelles
 * - TEAM_BASED (Spond) : Match entre équipes existantes
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateEventDTO {

    // ═══════════════════════════════════════════════════════════
    // INFORMATIONS DE BASE (Obligatoires)
    // ═══════════════════════════════════════════════════════════

    @NotBlank(message = "Le nom de l'événement est obligatoire")
    @Size(min = 3, max = 150, message = "Le nom doit contenir entre 3 et 150 caractères")
    private String name;

    @Size(max = 2000, message = "La description ne peut pas dépasser 2000 caractères")
    private String description;

    @NotBlank(message = "Le type d'événement est obligatoire")
    private String type; // EventType en String (MATCH, TOURNOI, ENTRAINEMENT, etc.)

    @NotBlank(message = "Le type d'inscription est obligatoire")
    private String registrationType; // RegistrationType (INDIVIDUAL ou TEAM_BASED)

    @NotNull(message = "La date de l'événement est obligatoire")
    @Future(message = "La date doit être dans le futur")
    @DateTimeFormat(pattern = "yyyy-MM-dd")
    private LocalDate date;

    @DateTimeFormat(pattern = "yyyy-MM-dd'T'HH:mm")
    private LocalDateTime startTime;

    @DateTimeFormat(pattern = "yyyy-MM-dd'T'HH:mm")
    private LocalDateTime endTime;

    @NotBlank(message = "Le lieu est obligatoire")
    @Size(max = 255, message = "Le lieu ne peut pas dépasser 255 caractères")
    private String location;

    @Size(max = 255)
    private String address;

    @Size(max = 100)
    private String city;

    @Pattern(regexp = "\\d{5}", message = "Le code postal doit contenir 5 chiffres")
    private String zipCode;

    // ═══════════════════════════════════════════════════════════
    // CONFIGURATION DE L'ÉVÉNEMENT
    // ═══════════════════════════════════════════════════════════

    @NotBlank(message = "La visibilité est obligatoire")
    private String visibility; // Visibility (PUBLIC, CLUB, PRIVATE)

    private Long clubId; // Optionnel (NULL pour événements publics)

    @Min(value = 2, message = "Il faut au moins 2 participants")
    @Max(value = 500, message = "Maximum 500 participants")
    private Integer maxParticipants;

    // ═══════════════════════════════════════════════════════════
    // SPÉCIFIQUE AU MODE INDIVIDUAL (UTF)
    // ═══════════════════════════════════════════════════════════

    @Min(value = 2, message = "Il faut au moins 2 équipes")
    @Max(value = 32, message = "Maximum 32 équipes")
    private Integer numberOfTeams; // Nombre d'équipes à former

    @Min(value = 5, message = "Minimum 5 joueurs par équipe")
    @Max(value = 11, message = "Maximum 11 joueurs par équipe")
    private Integer teamSize; // 5v5, 7v7, 11v11

    // ═══════════════════════════════════════════════════════════
    // SPÉCIFIQUE AU MODE TEAM_BASED (Spond)
    // ═══════════════════════════════════════════════════════════

    @Size(max = 10, message = "Maximum 10 équipes invitées")
    private List<Long> invitedTeamIds; // IDs des équipes invitées

    // ═══════════════════════════════════════════════════════════
    // OPTIONS AVANCÉES
    // ═══════════════════════════════════════════════════════════

    private Boolean requiresPayment = false;

    @DecimalMin(value = "0.0", message = "Le montant ne peut pas être négatif")
    private Double registrationFee;

    private Boolean autoConfirmRegistrations = false; // Valider automatiquement les inscriptions

    // ═══════════════════════════════════════════════════════════
    // VALIDATION PERSONNALISÉE
    // ═══════════════════════════════════════════════════════════

    /**
     * Vérifie que les champs spécifiques UTF sont présents en mode INDIVIDUAL
     */
    public boolean isValidForIndividualMode() {
        if ("INDIVIDUAL".equals(registrationType)) {
            return numberOfTeams != null &&
                    teamSize != null &&
                    numberOfTeams >= 2 &&
                    teamSize >= 5;
        }
        return true;
    }

    /**
     * Vérifie que les équipes invitées sont présentes en mode TEAM_BASED
     */
    public boolean isValidForTeamBasedMode() {
        if ("TEAM_BASED".equals(registrationType)) {
            return invitedTeamIds != null &&
                    !invitedTeamIds.isEmpty() &&
                    invitedTeamIds.size() >= 2;
        }
        return true;
    }

    /**
     * Calcule la capacité totale en fonction du mode
     */
    public Integer calculateMaxParticipants() {
        if ("INDIVIDUAL".equals(registrationType) && numberOfTeams != null && teamSize != null) {
            return numberOfTeams * teamSize;
        }
        return maxParticipants;
    }
}
