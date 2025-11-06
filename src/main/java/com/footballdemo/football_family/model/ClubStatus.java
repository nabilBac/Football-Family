package com.footballdemo.football_family.model;

/**
 * Représente les différents statuts de vérification d'un Club.
 * Ceci remplace le simple champ 'boolean verified' pour une meilleure
 * extensibilité.
 */
public enum ClubStatus {
    /** Le club a été enregistré et attend qu'un SUPER_ADMIN le valide. */
    PENDING,

    /** Le club a été vérifié par un SUPER_ADMIN et est pleinement opérationnel. */
    VERIFIED,

    /** Le club a été rejeté (ex: SIRET invalide, documents manquants). */
    REJECTED
}
