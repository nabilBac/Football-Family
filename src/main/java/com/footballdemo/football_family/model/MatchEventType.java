package com.footballdemo.football_family.model;

/**
 * 📊 Types d'événements de match pour le fil d'actualité live
 */
public enum MatchEventType {
    
    // ⚽ Événements de jeu
    GOAL,           // But marqué
    PENALTY,        // Penalty marqué
    OWN_GOAL,       // But contre son camp
    
    // 🟨🟥 Cartons
    YELLOW_CARD,    // Carton jaune
    RED_CARD,       // Carton rouge
    
    // ⏰ Phases du match
    KICK_OFF,       // Coup d'envoi
    HALF_TIME,      // Mi-temps
    SECOND_HALF,    // Début 2e mi-temps
    FULL_TIME,      // Fin du match
    PENALTY_SHOOTOUT, // ✅ NOUVEAU : Tirs au but
    
    // 🔄 Changements
    SUBSTITUTION,   // Remplacement
    
    // 🏆 Résultats
    MATCH_STARTED,  // Match commencé
    MATCH_ENDED,    // Match terminé
    QUALIFICATION,  // Qualification (pour bracket)
    
    // 📝 Autres
    INJURY,         // Blessure
    VAR_DECISION,   // Décision VAR
    CORNER,         // Corner
    FREE_KICK       // Coup franc
}