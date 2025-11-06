package com.footballdemo.football_family.exception;



public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) {
        super(message);
    }
    
    public ResourceNotFoundException(String resource, Long id) {
        super(String.format("%s introuvable avec l'ID: %d", resource, id));
    }
}