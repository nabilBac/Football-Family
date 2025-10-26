package com.footballdemo.football_family;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.scheduling.annotation.EnableScheduling;
import java.util.Arrays;
import java.io.File;

import jakarta.annotation.PostConstruct;

@SpringBootApplication
@EnableScheduling 
@EnableCaching
public class FootballFamilyApplication {

	public static void main(String[] args) {
		SpringApplication.run(FootballFamilyApplication.class, args);
	}

	  @PostConstruct
    public void checkUploadDir() {
        String uploadDir = System.getProperty("user.dir") + "/uploads/videos";
        File folder = new File(uploadDir);
        System.out.println("📂 Chemin complet des vidéos : " + uploadDir);
        if (folder.exists()) {
            System.out.println("✅ Le dossier existe.");
            System.out.println("Contenu : " + Arrays.toString(folder.listFiles()));
        } else {
            System.out.println("❌ Le dossier n'existe pas !");
        }
    }

}
