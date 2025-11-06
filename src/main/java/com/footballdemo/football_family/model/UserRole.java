package com.footballdemo.football_family.model;

public enum UserRole {
    USER("Utilisateur", "Compte utilisateur basique"),
    PLAYER("Joueur", "Joueur avec suivi de statistiques"),
    COACH("Entraîneur", "Peut gérer une équipe et créer des événements"),
    CLUB_ADMIN("Admin Club", "Administrateur d'un club"),
    ORGANIZER("Organisateur", "Peut créer des tournois inter-quartiers"),
    SUPER_ADMIN("Super Admin", "Administrateur global de la plateforme");

    private final String displayName;
    private final String description;

    UserRole(String displayName, String description) {
        this.displayName = displayName;
        this.description = description;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getDescription() {
        return description;
    }

    // Méthodes utilitaires
    public boolean canCreateEvent() {
        return this == COACH || this == CLUB_ADMIN || this == ORGANIZER || this == SUPER_ADMIN;
    }

    public boolean canManageTeam() {
        return this == COACH || this == CLUB_ADMIN || this == SUPER_ADMIN;
    }

    public boolean canValidateRegistration() {
        return this == CLUB_ADMIN || this == ORGANIZER || this == SUPER_ADMIN;
    }

    public boolean canModerate() {
        return this == SUPER_ADMIN;
    }

    public boolean canAccessAdminPanel() {
        return this == CLUB_ADMIN || this == ORGANIZER || this == SUPER_ADMIN;
    }
}