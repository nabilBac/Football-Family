package com.footballdemo.football_family.model;

import java.util.EnumSet;
import java.util.Set;

public enum UserRole {

    USER("Utilisateur", "Compte utilisateur basique"),
    PLAYER("Joueur", "Peut participer aux événements"),
    COACH("Entraîneur", "Peut gérer des équipes et créer des événements"),
    CLUB_ADMIN("Admin Club", "Administrateur d'un club"),
    ORGANIZER("Organisateur", "Peut gérer des événements publics"),
    SUPER_ADMIN("Super Admin", "Administrateur global de la plateforme");

    private final String displayName;
    private final String description;

    UserRole(String displayName, String description) {
        this.displayName = displayName;
        this.description = description;
    }

    public String getDisplayName() { return displayName; }
    public String getDescription() { return description; }

    // ===== Permissions =====

    // 🔒 Création d’événements CLUB_EVENT
    private static final Set<UserRole> CLUB_EVENT_CREATORS =
         EnumSet.of(COACH, CLUB_ADMIN, SUPER_ADMIN);



    private static final Set<UserRole> TEAM_MANAGERS =
            EnumSet.of(COACH, CLUB_ADMIN, SUPER_ADMIN);

    private static final Set<UserRole> REGISTRATION_VALIDATORS =
          EnumSet.of(COACH, CLUB_ADMIN, SUPER_ADMIN);



    private static final Set<UserRole> ADMIN_PANEL_ACCESS =
            EnumSet.of(CLUB_ADMIN, SUPER_ADMIN);

    public boolean canCreateClubEvent() { return CLUB_EVENT_CREATORS.contains(this); }

    public boolean canManageTeam() { return TEAM_MANAGERS.contains(this); }

    public boolean canValidateRegistration() { return REGISTRATION_VALIDATORS.contains(this); }

    public boolean canAccessAdminPanel() { return ADMIN_PANEL_ACCESS.contains(this); }
}
