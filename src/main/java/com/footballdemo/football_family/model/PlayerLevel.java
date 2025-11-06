package com.footballdemo.football_family.model;

public enum PlayerLevel {

    BEGINNER("Débutant", "Joueur occasionnel, peu d'expérience"),
    INTERMEDIATE("Intermédiaire", "Joueur régulier avec expérience"),
    ADVANCED("Avancé", "Joueur expérimenté avec bon niveau technique"),
    EXPERT("Expert", "Joueur de très haut niveau, expérience en compétition");

    private final String displayName;
    private final String description;

    PlayerLevel(String displayName, String description) {
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
     * Retourne un score numérique pour l'équilibrage (1-4)
     */
    public int getSkillScore() {
        return switch (this) {
            case BEGINNER -> 1;
            case INTERMEDIATE -> 2;
            case ADVANCED -> 3;
            case EXPERT -> 4;
        };
    }
}
