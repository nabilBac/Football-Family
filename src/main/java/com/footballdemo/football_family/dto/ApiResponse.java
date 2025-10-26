package com.footballdemo.football_family.dto;


/**
 * Classe générique pour un retour JSON standardisé pour le front.
 * @param <T> type des données retournées (peut être null)
 */
public record ApiResponse<T>(boolean success, String message, T data) {}
