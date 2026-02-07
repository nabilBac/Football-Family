package com.footballdemo.football_family.model;

/**
 * Niveaux de compétition en football amateur
 */
public enum MatchCompetitionLevel {
    // Championnats nationaux
    NATIONAL_1("National 1"),
    NATIONAL_2("National 2"),
    NATIONAL_3("National 3"),
    
    // Championnats régionaux
    REGIONAL_1("Régional 1"),
    REGIONAL_2("Régional 2"),
    REGIONAL_3("Régional 3"),
    
    // Championnats départementaux
    DEPARTEMENTAL_1("Départemental 1"),
    DEPARTEMENTAL_2("Départemental 2"),
    DEPARTEMENTAL_3("Départemental 3"),
    
    // District
    DISTRICT_1("District 1"),
    DISTRICT_2("District 2"),
    
    // Autres
    AMICAL("Match amical"),
    COUPE_DE_FRANCE("Coupe de France"),
    COUPE_REGIONALE("Coupe Régionale"),
    COUPE_DEPARTEMENTALE("Coupe Départementale"),
    FUTSAL("Futsal"),
    VETERANS("Vétérans"),
    LOISIR("Loisir");
    
    private final String label;
    
    MatchCompetitionLevel(String label) {
        this.label = label;
    }
    
    public String getLabel() {
        return label;
    }
}