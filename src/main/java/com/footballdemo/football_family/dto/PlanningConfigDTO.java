package com.footballdemo.football_family.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

@JsonIgnoreProperties(ignoreUnknown = true)
@Data
public class PlanningConfigDTO {
    private String dateDebut;               // "2026-03-01"
    private Integer nombreJours;            // 1, 2 ou 3 jours
    
    // 🆕 4 CHAMPS POUR LE MODE 1 JOUR
    private String morningStart;            // "09:00"
    private String morningEnd;              // "12:45"
    private String afternoonStart;          // "14:00"
    private String afternoonEnd;            // "18:30"
    
    // ⚠️ GARDE AUSSI CES DEUX (pour compatibilité 2/3 jours)
    private String startTime;               // Utilisé pour jours 2/3
    private String endTime;                 // Utilisé pour jours 2/3
    
    private Integer matchDurationMinutes;
    private Integer breakDurationMinutes;
    private Integer numberOfFields;
    private String phase;                   // "POULES" | "FINALES" | "ALL"
    private Boolean overwrite;
    private Integer restBetweenRoundsMinutes;
    private Boolean includeConsolante;
}