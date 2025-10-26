package com.footballdemo.football_family.dto;

import java.util.List;

/**
 * DTO pour le chargement initial des commentaires, incluant le total.
 */
public record CommentListResponse(
    List<CommentDto> comments, // Les commentaires récents limités (ex: 3)
    long totalCount            // Le nombre total réel (ex: 9)
) {}