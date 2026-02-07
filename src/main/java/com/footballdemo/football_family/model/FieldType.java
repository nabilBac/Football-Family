package com.footballdemo.football_family.model;

/**
 * Types de terrain de football
 */
public enum FieldType {
    NATURAL_GRASS("Herbe naturelle"),
    SYNTHETIC_GRASS("Synthétique"),
    HYBRID("Hybride"),
    INDOOR("Salle (Indoor)"),
    DIRT("Terre battue"),
    STABILIZED("Stabilisé"),
    BEACH("Beach soccer");
    
    private final String label;
    
    FieldType(String label) {
        this.label = label;
    }
    
    public String getLabel() {
        return label;
    }
}