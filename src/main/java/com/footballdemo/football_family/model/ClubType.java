package com.footballdemo.football_family.model;

public enum ClubType {
    AMATEUR("Club Amateur", "Club de football amateur enregistré"),
    URBAIN("Football Urbain", "Association de football urbain/de quartier"),
    FUTSAL("Club Futsal", "Club spécialisé en futsal"),
    LOISIR("Club Loisir", "Association de football loisir");

    private final String displayName;
    private final String description;

    ClubType(String displayName, String description) {
        this.displayName = displayName;
        this.description = description;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getDescription() {
        return description;
    }
}