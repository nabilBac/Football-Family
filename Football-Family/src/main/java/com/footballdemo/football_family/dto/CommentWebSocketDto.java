package com.footballdemo.football_family.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

// Utiliser 'record' pour la simplicité et l'immuabilité (Java 16+)
@JsonInclude(JsonInclude.Include.NON_NULL) // N'inclut pas les champs nuls dans le JSON (important pour 'commentId' ou 'comment')
public record CommentWebSocketDto(
    String action,         // Ex: "CREATED", "UPDATED", "DELETED"
    Long videoId,          // L'ID de la vidéo concernée
    CommentDto comment,    // DTO complet du commentaire (pour CREATED/UPDATED)
    Long commentId         // ID du commentaire (pour DELETED)
) {}