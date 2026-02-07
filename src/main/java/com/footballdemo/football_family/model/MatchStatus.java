package com.footballdemo.football_family.model;

public enum MatchStatus {
    DRAFT,              // 📝 Match en création
    SCHEDULED,          // 📅 Match programmé
    IN_PROGRESS,        // 🔴 Match en cours
    COMPLETED,          // ✅ Match terminé (remplace FINISHED)
    CANCELLED,          // ❌ Match annulé
    
    // ===================================
    // ⚠️ ANCIENS STATUTS (DEPRECATED)
    // ===================================
    @Deprecated
    FINISHED,           // → Remplacé par COMPLETED
    
    @Deprecated
    LIVE                // → Remplacé par IN_PROGRESS
}