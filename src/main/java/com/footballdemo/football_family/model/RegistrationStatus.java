package com.footballdemo.football_family.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum RegistrationStatus {
    EN_ATTENTE("en attente"),
    VALIDE("valide"),
    REFUSE("refusé"),
    ANNULE("annulé");

    private final String label;

    RegistrationStatus(String label) {
        this.label = label;
    }

    @JsonCreator
    public static RegistrationStatus fromLabel(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Status cannot be null or empty");
        }

        String normalizedValue = value.trim();

        // 🔹 Essayer de matcher par le nom de l'enum (EN_ATTENTE, VALIDE, ANNULE)
        try {
            return RegistrationStatus.valueOf(normalizedValue.toUpperCase().replace(" ", "_"));
        } catch (IllegalArgumentException e) {
            // Continue vers la correspondance par label
        }

        // 🔹 Essayer de matcher par le label ("en attente", "valide", "annulé")
        for (RegistrationStatus status : values()) {
            if (status.label.equalsIgnoreCase(normalizedValue)) {
                return status;
            }
        }

        throw new IllegalArgumentException(
                "Unknown status: '" + value + "'. " +
                        "Expected: EN_ATTENTE, VALIDE, ANNULE or 'en attente', 'valide', 'annulé'");
    }

    @JsonValue
    public String getLabel() {
        return label;
    }
}
