package com.footballdemo.football_family.exception;

public class UserNotFoundException extends RuntimeException {

    public UserNotFoundException(String message) {
        super(message);
    }

    public UserNotFoundException(Long id) {
        super("Utilisateur introuvable avec id : " + id);
    }

    public UserNotFoundException(String field, String value) {
        super("Utilisateur introuvable (" + field + " = " + value + ")");
    }
}
