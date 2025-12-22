package com.footballdemo.football_family.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.footballdemo.football_family.model.FormationMode;


import java.util.List;
import java.util.Map;

/**
 * DTO pour la formation des équipes après les inscriptions (mode UTF).
 * Permet une formation MANUELLE ou AUTOMATIQUE.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FormTeamsDTO {

    @NotNull
    private Long eventId;

    @NotNull
    private FormationMode mode;   // AUTO ou MANUAL (enum UTF)

    // Pour formation manuelle
    private Map<String, List<Long>> manualTeamAssignments;

    // Options visuelles/facultatives
    private List<String> teamNames;
    private List<String> teamColors;

    private Boolean notifyPlayers = true;
    private Boolean lockTeams = false;
}
