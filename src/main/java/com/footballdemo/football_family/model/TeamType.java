package com.footballdemo.football_family.model;

public enum TeamType {

    /**
     * Équipe PERMANENTE d'un club
     * - Attachée à un club
     * - A un coach fixe
     * - Les joueurs sont membres permanents
     * - Utilisée pour : championnats, matchs récurrents
     */
    PERMANENT("Équipe permanente", "Équipe officielle d'un club avec des membres fixes"),

    /**
     * Équipe TEMPORAIRE créée pour un événement
     * - Créée spécifiquement pour un tournoi/événement
     * - Formée à partir d'inscriptions individuelles
     * - Dissoute après l'événement
     * - Utilisée pour : tournois UTF, compétitions ponctuelles
     */
    TEMPORARY("Équipe temporaire", "Équipe formée pour un événement spécifique, dissoute après");

    private final String displayName;
    private final String description;

    TeamType(String displayName, String description) {
        this.displayName = displayName;
        this.description = description;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getDescription() {
        return description;
    }

    /**
     * Vérifie si l'équipe est permanente (club)
     */
    public boolean isPermanent() {
        return this == PERMANENT;
    }

    /**
     * Vérifie si l'équipe est temporaire (tournoi)
     */
    public boolean isTemporary() {
        return this == TEMPORARY;
    }
}
