package com.footballdemo.football_family.controller;

// 🎯 NOUVEAUX IMPORTS NÉCESSAIRES
import com.footballdemo.football_family.dto.VideoDto;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import java.security.Principal; 
import com.footballdemo.football_family.service.VideoService;

import jakarta.servlet.http.HttpServletRequest;

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
 public String home(Principal principal, Model model, HttpServletRequest request) { // 👈 AJOUT DE HttpServletRequest
 
        // 🚀 NOUVELLE LOGIQUE POUR LE RAFRAÎCHISSEMENT DES ÉVÉNEMENTS APRÈS LE LOGIN
        Boolean justLoggedIn = (Boolean) request.getSession().getAttribute("justLoggedIn");
        
        if (Boolean.TRUE.equals(justLoggedIn)) {
            // Passe le flag au modèle (pour lecture par le JavaScript/Thymeleaf)
            model.addAttribute("justLoggedIn", true);
            
            // 💡 Nettoie le flag immédiatement pour qu'il ne s'applique qu'une seule fois
            request.getSession().removeAttribute("justLoggedIn"); 
        }
        // FIN DE LA NOUVELLE LOGIQUE
        
// DÉBUT DE LA LOGIQUE EXISTANTE (VIDÉOS)
 List<VideoDto> videos; 
 
 try {
 var pageable = PageRequest.of(0, 20, Sort.by("dateUpload").descending());
 String username = (principal != null) ? principal.getName() : "anonymousUser";

videos = videoService.getFeedVideosForUser(pageable, username);

} catch (Exception e) {
 System.err.println("Erreur lors de la récupération des vidéos pour la page d'accueil : " + e.getMessage());
videos = Collections.emptyList(); 
 e.printStackTrace(); 
 }

 model.addAttribute("videos", videos);
 
 return "index";
 }

}