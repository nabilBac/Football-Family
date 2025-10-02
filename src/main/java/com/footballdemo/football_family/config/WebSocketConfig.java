package com.footballdemo.football_family.config;


import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker // Active le traitement des messages STOMP via WebSockets
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // 1. DÉFINIT le préfixe de destination des messages que le serveur enverra
        // Les clients s'abonneront à ce préfixe (/topic/videos/{videoId}/comments)
        config.enableSimpleBroker("/topic"); 
        
        // 2. DÉFINIT le préfixe pour les messages entrants (du client vers le serveur)
        // Les requêtes @MessageMapping iront à /app/**
        config.setApplicationDestinationPrefixes("/app"); 
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // 3. EXPOSE un endpoint pour la connexion WebSocket
        // Les clients se connecteront à ws://localhost:8080/ws
        registry.addEndpoint("/ws").withSockJS();
    }
}