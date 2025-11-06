package com.footballdemo.football_family;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean; // ⬅️ AJOUT
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@SpringBootApplication
@EnableCaching
public class FootballFamilyApplication {

	public static void main(String[] args) {
		SpringApplication.run(FootballFamilyApplication.class, args);
	}

	@Bean
	public CommandLineRunner passwordEncoderRunner(BCryptPasswordEncoder encoder) {
		return args -> {
			String password = "admin123";
			String hashedPassword = encoder.encode(password);

			System.out.println("----------------------------------------------");
			System.out.println("✅ HASH BCrypt à utiliser pour SUPER_ADMIN : ");
			System.out.println("   " + hashedPassword); // ⬅️ COPIEZ CETTE CHAÎNE!
			System.out.println("   (Mot de passe clair : " + password + ")");
			System.out.println("----------------------------------------------");
		};
	}

}
