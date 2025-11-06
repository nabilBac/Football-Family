package com.footballdemo.football_family.dto;

// Vous pouvez choisir d'utiliser Lombok si vous l'avez, ou des getters/setters manuels.
// Ici, je suppose que vous avez Lombok ou que vous l'ajouterez manuellement.

// Si vous n'utilisez pas Lombok, vous devez ajouter les getters/setters et le constructeur manuellement.
/*
public class JwtResponse {
    private String token;
    private String type = "Bearer";
    private String username;

    public JwtResponse(String accessToken, String username) {
        this.token = accessToken;
        this.username = username;
    }
    // + Getters et Setters pour token, type, username
}
*/

// Utilisation de Lombok pour la concision (si vous l'avez)
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class JwtResponse {
    private String token;
    private String type = "Bearer";
    private String username;

    public JwtResponse(String accessToken, String username) {
        this.token = accessToken;
        this.username = username;
    }
}
