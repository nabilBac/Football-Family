package com.footballdemo.football_family.model;

import java.util.Set;

public enum RegistrationStatus {
    
    PENDING,
    ACCEPTED,
    REJECTED,
    CANCELLED;
    
    /**
     * Vérifie si une transition d'état est autorisée.
     * 
     * @param from État actuel
     * @param to État cible
     * @return true si la transition est autorisée
     */
    public static boolean canTransition(RegistrationStatus from, RegistrationStatus to) {
        if (from == to) return true; // Idempotent
        
        return switch (from) {
            case PENDING -> Set.of(ACCEPTED, REJECTED, CANCELLED).contains(to);
            case ACCEPTED -> to == CANCELLED; // Peut annuler après acceptation
            case REJECTED -> false; // État final (sauf si on autorise réinscription)
            case CANCELLED -> false; // État final
        };
    }
    
    /**
     * Vérifie si c'est un état final (aucune transition possible).
     */
    public boolean isFinal() {
        return this == REJECTED || this == CANCELLED;
    }
    
    /**
     * Vérifie si l'inscription est "active" (participe au tournoi).
     */
    public boolean isActive() {
        return this == ACCEPTED;
    }
    
    /**
     * Vérifie si l'inscription compte dans les quotas.
     */
    public boolean countsTowardQuota() {
        return this == PENDING || this == ACCEPTED;
    }
}