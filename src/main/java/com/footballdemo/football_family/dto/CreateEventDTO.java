package com.footballdemo.football_family.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import com.footballdemo.football_family.model.EventType;
import com.footballdemo.football_family.model.RegistrationType;
import com.footballdemo.football_family.model.EventVisibility;
import com.footballdemo.football_family.validation.ValidEventDates;
import com.footballdemo.football_family.validation.ValidEventQuotas;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * DTO pour la création d'un événement.
 * ✅ VERSION SÉCURISÉE avec validations complètes
 * 
 * Supporte les 2 modes :
 * - INDIVIDUAL (UTF) : Tournoi avec inscriptions individuelles
 * - TEAM_BASED (Spond) : Match entre équipes existantes
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ValidEventDates(message = "Les dates de l'événement sont invalides")
@ValidEventQuotas(message = "Le quota par club ne peut pas dépasser le nombre total d'équipes")
public class CreateEventDTO {

    // ============================================================
    // 📝 INFORMATIONS GÉNÉRALES
    // ============================================================

    @NotBlank(message = "Le nom de l'événement est obligatoire")
    @Size(min = 3, max = 100, message = "Le nom doit contenir entre 3 et 100 caractères")
    @Pattern(
        regexp = "^[a-zA-Z0-9àâäéèêëïîôùûüç\\s\\-'\"()]+$",
        message = "Le nom contient des caractères non autorisés"
    )
    private String name;

    // ✅ CATÉGORIE AJOUTÉE ICI
    @NotBlank(message = "La catégorie est obligatoire")
    @Pattern(
        regexp = "^(U11|U13|U15|U17|U19|Seniors|Veterans)$",
        message = "Catégorie invalide. Valeurs acceptées : U11, U13, U15, U17, U19, Seniors, Veterans"
    )
    private String category;

    @Size(max = 500, message = "La description ne peut pas dépasser 500 caractères")
    private String description;

    @NotNull(message = "Le type d'événement est obligatoire")
    private EventType type;

    @NotNull(message = "Le type d'inscription est obligatoire")
    private RegistrationType registrationType;

    // ============================================================
    // 📅 DATES ET HORAIRES
    // ============================================================

    @NotNull(message = "La date de l'événement est obligatoire")
    @FutureOrPresent(message = "La date ne peut pas être dans le passé")
    private LocalDate date;

    // Validation custom via @ValidEventDates au niveau classe
    private LocalDateTime startTime;
    
    private LocalDateTime endTime;

    // ============================================================
    // 📍 LOCALISATION
    // ============================================================

    @NotBlank(message = "Le lieu (location) est obligatoire")
    @Size(min = 3, max = 200, message = "Le lieu doit contenir entre 3 et 200 caractères")
    private String location;

    @Size(max = 200, message = "L'adresse ne peut pas dépasser 200 caractères")
    private String address;

    @NotBlank(message = "La ville est obligatoire")
    @Size(min = 2, max = 100, message = "La ville doit contenir entre 2 et 100 caractères")
    @Pattern(
        regexp = "^[a-zA-ZàâäéèêëïîôùûüçÀÂÄÉÈÊËÏÎÔÙÛÜÇ\\s\\-']+$",
        message = "La ville contient des caractères non autorisés"
    )
    private String city;

    @Pattern(
        regexp = "^[0-9]{5}$",
        message = "Le code postal doit contenir exactement 5 chiffres"
    )
    private String zipCode;

    // ============================================================
    // 🔒 VISIBILITÉ ET ORGANISATION
    // ============================================================

    @NotNull(message = "La visibilité de l'événement est obligatoire")
    private EventVisibility visibility;

    // ClubId obligatoire pour CLUB_ONLY, validé dans le service
    private Long clubId;

    // ============================================================
    // 👥 CAPACITÉS ET QUOTAS
    // ============================================================

    @NotNull(message = "Le nombre maximum de participants est obligatoire")
    @Min(value = 4, message = "Le nombre minimum de participants est de 4")
    @Max(value = 64, message = "Le nombre maximum de participants est de 64")
    private Integer maxParticipants;

    /**
     * 🔢 Quota max d'équipes par club (events fermés / tournois club)
     * Validation : 1 ≤ maxTeamsPerClub ≤ min(32, maxParticipants)
     */
    @Min(value = 1, message = "Le nombre max d'équipes par club doit être au moins 1")
    @Max(value = 32, message = "Le nombre max d'équipes par club ne peut pas dépasser 32")
    private Integer maxTeamsPerClub;

    // ============================================================
    // ⚙️ CONFIGURATION ÉQUIPES (pour mode INDIVIDUAL)
    // ============================================================

    @Min(value = 2, message = "Le nombre d'équipes doit être au moins 2")
    @Max(value = 64, message = "Le nombre d'équipes ne peut pas dépasser 64")
    private Integer numberOfTeams;

    @Min(value = 5, message = "La taille d'équipe doit être au moins 5")
    @Max(value = 11, message = "La taille d'équipe ne peut pas dépasser 11")
    private Integer teamSize;

    // ============================================================
    // 🖼️ MÉDIA
    // ============================================================

    @Size(max = 500, message = "L'URL de l'image ne peut pas dépasser 500 caractères")
    @Pattern(
        regexp = "^(https?://.*\\.(jpg|jpeg|png|gif|webp))?$",
        message = "L'URL de l'image doit être valide (jpg, jpeg, png, gif, webp)"
    )
    private String imageUrl;
}




