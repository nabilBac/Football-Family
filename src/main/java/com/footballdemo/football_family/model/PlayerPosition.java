package com.footballdemo.football_family.model;

public enum PlayerPosition {

    GOALKEEPER("Gardien de but", "GK"),
    DEFENDER("Défenseur", "DEF"),
    MIDFIELDER("Milieu de terrain", "MIL"),
    FORWARD("Attaquant", "ATT"),
    ANY("Aucune préférence", "ANY");

    private final String displayName;
    private final String shortCode;

    PlayerPosition(String displayName, String shortCode) {
        this.displayName = displayName;
        this.shortCode = shortCode;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getShortCode() {
        return shortCode;
    }

    /**
     * Vérifie si c'est une position défensive
     */
    public boolean isDefensive() {
        return this == GOALKEEPER || this == DEFENDER;
    }

    /**
     * Vérifie si c'est une position offensive
     */
    public boolean isOffensive() {
        return this == FORWARD || this == MIDFIELDER;
    }
}
