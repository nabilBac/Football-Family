package com.footballdemo.football_family.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.lang.NonNull;
import org.springframework.web.socket.config.annotation.*;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(@NonNull MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic");
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(@NonNull StompEndpointRegistry registry) {

        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")          // Autorise toutes les origines
                .setAllowedOrigins("*")                 // Nécessaire pour SockJS
                .withSockJS()
                .setSessionCookieNeeded(false)          // ❗ Évite les 404 iframe.html
                .setWebSocketEnabled(true)              // Active WebSocket natif si dispo
                .setSuppressCors(true);                 // ❗ Empêche origin-check
    }
}
