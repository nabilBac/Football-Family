package com.footballdemo.football_family.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

@Configuration
@EnableAsync  // ✅ Active l'exécution asynchrone
public class AsyncConfig {
    
    @Bean(name = "taskExecutor")  // ✅ Nom requis par Spring
    public Executor taskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(2);      // 2 threads minimum
        executor.setMaxPoolSize(5);       // 5 threads maximum
        executor.setQueueCapacity(100);   // Queue de 100 tâches
        executor.setThreadNamePrefix("async-");  // Préfixe pour debug
        executor.initialize();
        return executor;
    }
}