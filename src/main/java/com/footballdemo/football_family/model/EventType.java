package com.footballdemo.football_family.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum EventType {

    MATCH("Match", "MATCH"),
    TOURNOI("Tournoi", "TOURNAMENT"),
    TOURNOI_FUTSAL("Tournoi Futsal", "FUTSAL_TOURNAMENT"),
    ENTRAINEMENT("Entrainement", "TRAINING"),
    COMPETITION("Competition", "COMPETITION");

    private final String[] labels; // plusieurs labels possibles

    EventType(String... labels) {
        this.labels = labels;
    }

    @JsonValue
    public String getLabel() {
        return labels[0]; // renvoie toujours le premier label
    }

    @JsonCreator
    public static EventType fromLabel(String value) {
        if (value == null || value.isBlank())
            throw new IllegalArgumentException("EventType cannot be null or empty");

        for (EventType type : values()) {
            for (String label : type.labels) {
                if (label.equalsIgnoreCase(value.trim())) {
                    return type;
                }
            }
        }

        throw new IllegalArgumentException("Unknown EventType: " + value);
    }
}
