package com.footballdemo.football_family.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.lang.NonNull;


import java.nio.file.Paths;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Value("${videos.upload.dir}")
    private String uploadDir;

   @Override
public void addResourceHandlers(@NonNull ResourceHandlerRegistry registry) {
    // Chemin absolu du dossier de vidéos
    String uploadPath = Paths.get(uploadDir).toAbsolutePath().toString();

     System.out.println("Upload path: " + uploadPath);

    // Expose le dossier /videos/** publiquement
    registry.addResourceHandler("/videos/**")
            .addResourceLocations("file:" + uploadPath + "/");
           
}


}