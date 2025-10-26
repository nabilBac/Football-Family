package com.footballdemo.football_family.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record VideoStatsUpdateDto(
    Long videoId,
    // Le nouveau compte total de likes (pour TOUS les utilisateurs)
    Long newLikesCount, 
    // <--- 🚨 AJOUT CRITIQUE (Pour la mise à jour de l'icône)
    Boolean isLiked, 
    // Optionnel, pour grouper les mises à jour si nécessaire
    Long newCommentsCount,
    String lastActionBy 
    
) {}
