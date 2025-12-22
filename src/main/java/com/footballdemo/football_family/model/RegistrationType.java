package com.footballdemo.football_family.model;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(
    description = "Types d'inscription possibles pour un événement",
    enumAsRef = true
)
public enum RegistrationType {

    @Schema(description = "Inscription individuelle (joueurs seuls — format UTF)")
    INDIVIDUAL,

    @Schema(description = "Match entre équipes (format équipe-contre-équipe)")
    TEAM,

    @Schema(description = "Inscription réservée aux clubs uniquement")
    CLUB_ONLY
}
