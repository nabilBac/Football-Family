package com.footballdemo.football_family.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import org.springframework.context.annotation.Configuration;

@Configuration
@OpenAPIDefinition(
        info = @Info(
                title = "UTF Football API",
                version = "1.0",
                description = "Documentation officielle de l'API UTF Football"
        ),
        security = @SecurityRequirement(name = "bearerAuth")  // 🔐 Active la sécurité
)
@SecurityScheme(
        name = "bearerAuth",
        type = SecuritySchemeType.HTTP,
        scheme = "bearer",
        bearerFormat = "JWT"   // 🔐 Permet à Swagger d'afficher Authorize
)
public class OpenApiConfig {
}
