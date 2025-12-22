package com.footballdemo.football_family.exception;

public class VideoNotFoundException extends RuntimeException {

    public VideoNotFoundException(String message) {
        super(message);
    }

    public VideoNotFoundException(Long id) {
        super("Vidéo introuvable avec id : " + id);
    }
}
