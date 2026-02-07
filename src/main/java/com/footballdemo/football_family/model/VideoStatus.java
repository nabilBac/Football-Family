package com.footballdemo.football_family.model;



public enum VideoStatus {
    PROCESSING,   // En cours d'optimisation FFmpeg
    READY,        // Vidéo prête à être lue
    FAILED        // Échec d'optimisation
}
