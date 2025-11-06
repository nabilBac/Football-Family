package com.footballdemo.football_family.config;



import com.footballdemo.football_family.model.RegistrationStatus;
import org.springframework.core.convert.converter.Converter;
import org.springframework.stereotype.Component;

@Component
public class RegistrationStatusConverter implements Converter<String, RegistrationStatus> {
    
    @Override
    public RegistrationStatus convert(String source) {
        try {
            // Essaie d'abord par le nom de l'enum (EN_ATTENTE)
            return RegistrationStatus.valueOf(source.toUpperCase().replace(" ", "_"));
        } catch (IllegalArgumentException e) {
            // Sinon, utilise la méthode fromLabel de l'enum
            return RegistrationStatus.fromLabel(source);
        }
    }
}