package com.footballdemo.football_family.controller;

// 🎯 NOUVEAUX IMPORTS NÉCESSAIRES
import com.footballdemo.football_family.dto.VideoDto;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import java.security.Principal; 
import com.footballdemo.football_family.service.VideoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import java.util.List;
import java.util.Collections; // Pour List.of()

@Controller
public class HomeController {

    @Autowired
    private VideoService videoService;

    // 🚨 MÉTHODE CORRIGÉE
    @GetMapping("/")
    public String home(Principal principal, Model model) {
        // 1. Définir la variable pour stocker le résultat (maintenant List<VideoDto>)
        List<VideoDto> videos; 
        
        try {
            // Définition de la pagination par défaut
            var pageable = PageRequest.of(0, 20, Sort.by("dateUpload").descending());
            // Détermination du nom d'utilisateur (pour calculer les likes)
            String username = (principal != null) ? principal.getName() : "anonymousUser";

            // 2. 🎯 APPEL DE LA NOUVELLE MÉTHODE avec pagination et username
           videos = videoService.getFeedVideosForUser(pageable, username);

            
        } catch (Exception e) {
            System.err.println("Erreur lors de la récupération des vidéos pour la page d'accueil : " + e.getMessage());
            videos = Collections.emptyList(); // Utiliser List.of() ou Collections.emptyList()
            e.printStackTrace(); 
        }

        model.addAttribute("videos", videos);
        // Si vous utilisez Thymeleaf, assurez-vous que 'index.html' est prêt à gérer List<VideoDto>
        return "index";
    }

}