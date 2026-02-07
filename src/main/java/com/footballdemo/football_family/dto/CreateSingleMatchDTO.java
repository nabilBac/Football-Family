package com.footballdemo.football_family.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import com.footballdemo.football_family.model.EventType;
import com.footballdemo.football_family.model.EventVisibility;
import com.footballdemo.football_family.model.FieldType;
import com.footballdemo.football_family.model.MatchCompetitionLevel;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * DTO pour la création d'un match unique (médiatisation)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateSingleMatchDTO {

    // ============================================================
    // 📝 INFORMATIONS GÉNÉRALES
    // ============================================================

    @NotBlank(message = "Le nom du match est obligatoire")
    @Size(min = 3, max = 150, message = "Le nom doit contenir entre 3 et 150 caractères")
    private String name;

    @Size(max = 500, message = "La description ne peut pas dépasser 500 caractères")
    private String description;

  @NotBlank(message = "La catégorie est obligatoire")
@Pattern(
    regexp = "^(U11|U13|U15|U17|U19|Seniors|Veterans)$",
    message = "Catégorie invalide"
)
private String category;

// 🆕 NIVEAU DE COMPÉTITION
@NotNull(message = "Le niveau de compétition est obligatoire")
private MatchCompetitionLevel competitionLevel;

// 🆕 TYPE DE TERRAIN
@NotNull(message = "Le type de terrain est obligatoire")
private FieldType fieldType;

    // ============================================================
    // ⚽ ÉQUIPES
    // ============================================================

    /**
     * Équipe locale (de la base de données)
     */
    @NotNull(message = "L'équipe locale est obligatoire")
    private Long homeTeamId;

    /**
     * Équipe adverse - SOIT un ID (si dans la base), SOIT des infos externes
     */
    private Long awayTeamId;  // Null si équipe externe

    /**
     * Si awayTeamId == null, ces champs sont obligatoires
     */
    private String awayTeamName;
    private String awayTeamCity;
    private String awayTeamLogoUrl;  // Optionnel

    // ============================================================
    // 📅 DATE ET HORAIRES
    // ============================================================

    @NotNull(message = "La date du match est obligatoire")
    @FutureOrPresent(message = "La date ne peut pas être dans le passé")
    private LocalDate date;

    @NotNull(message = "L'heure de début est obligatoire")
    private LocalDateTime startTime;

    private LocalDateTime endTime;  // Optionnel (calculé automatiquement si null)

    // ============================================================
    // 📍 LOCALISATION
    // ============================================================

    @NotBlank(message = "Le lieu est obligatoire")
    @Size(min = 3, max = 200)
    private String location;

    @Size(max = 200)
    private String address;

    @NotBlank(message = "La ville est obligatoire")
    private String city;

    @Pattern(regexp = "^[0-9]{5}$", message = "Code postal invalide")
    private String zipCode;

    private String field;  // Numéro du terrain (ex: "Terrain 1")

    // ============================================================
    // 🔒 ORGANISATION
    // ============================================================

    @NotNull(message = "Le type d'événement est obligatoire")
    private EventType type;  // CLUB_EVENT ou OPEN_EVENT

    @NotNull(message = "La visibilité est obligatoire")
    private EventVisibility visibility;

    /**
     * Pour CLUB_EVENT uniquement
     */
    private Long clubId;

    // ============================================================
    // 🎥 MÉDIAS
    // ============================================================

    private String imageUrl;
    
    private Boolean liveEnabled;  // Si le live est activé
}