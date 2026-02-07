package com.footballdemo.football_family.model;

public enum EventStatus {
    // ===================================
    // 🆕 NOUVEAUX STATUTS (WORKFLOW PRO)
    // ===================================
    DRAFT,                  // 📝 En création (brouillon)
    PUBLISHED,              // 📢 Publié (inscriptions ouvertes)
    REGISTRATION_CLOSED,    // 🔒 Inscriptions fermées (en préparation)
    ONGOING,                // 🔴 Tournoi en cours (remplace LIVE et RUNNING)
    COMPLETED,              // ✅ Tournoi terminé (remplace FINISHED)
    CANCELED, 
    ARCHIVED,              // ❌ Annulé
    
    // ===================================
    // ⚠️ ANCIENS STATUTS (DEPRECATED - À SUPPRIMER PLUS TARD)
    // ===================================
    @Deprecated
    UPCOMING,   // → Remplacé par PUBLISHED
    
    @Deprecated
    RUNNING,    // → Remplacé par ONGOING
    
    @Deprecated
    LIVE,       // → Remplacé par ONGOING
    
    @Deprecated
    FINISHED    // → Remplacé par COMPLETED
}