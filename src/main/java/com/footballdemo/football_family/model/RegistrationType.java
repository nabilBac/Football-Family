package com.footballdemo.football_family.model;

public enum RegistrationType {

    /**
     * Inscription INDIVIDUELLE (mode UTF/Tournoi ouvert)
     * - Les joueurs s'inscrivent un par un
     * - L'organisateur forme les équipes APRÈS les inscriptions
     * - Utilisé pour : tournois de quartier, compétitions ouvertes
     */
    INDIVIDUAL("Inscription individuelle", "Les joueurs s'inscrivent individuellement, les équipes sont formées après"),

    /**
     * Inscription par ÉQUIPES (mode Spond/Match classique)
     * - Des équipes pré-existantes sont invitées
     * - Les joueurs de ces équipes confirment leur présence
     * - Utilisé pour : matchs amicaux, championnats, entraînements
     */
    TEAM_BASED("Inscription par équipes", "Des équipes existantes sont invitées à participer");

    private final String displayName;
    private final String description;

    RegistrationType(String displayName, String description) {
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
     * Vérifie si ce type nécessite la formation d'équipes après inscription
     */
    public boolean requiresTeamFormation() {
        return this == INDIVIDUAL;
    }

    /**
     * Vérifie si ce type nécessite des équipes pré-existantes
     */
    public boolean requiresExistingTeams() {
        return this == TEAM_BASED;
    }
}
