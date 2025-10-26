package com.footballdemo.football_family.controller;

public class UserNotFoundException extends RuntimeException {
    public UserNotFoundException(Long id) {
        super("Utilisateur cible non trouvé avec l'ID: " + id);
    }
}
