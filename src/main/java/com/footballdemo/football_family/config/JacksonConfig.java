package com.footballdemo.football_family.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.fasterxml.jackson.databind.SerializationFeature;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

/**
 * Configuration Jackson pour gérer la sérialisation des dates Java 8+
 * Résout l'erreur : "Java 8 date/time type LocalDateTime not supported by
 * default"
 */
@Configuration
public class JacksonConfig {

    @Bean
    @Primary
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();

        // ✅ Enregistrer le module pour les types Date/Time Java 8
        mapper.registerModule(new JavaTimeModule());

        // ✅ Désactiver la conversion des dates en timestamps (millisecondes)
        // Les dates seront au format ISO-8601 : "2025-11-15T14:30:00"
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

        System.out.println("✅ ObjectMapper configuré avec support Java 8 Date/Time");

        return mapper;
    }
}