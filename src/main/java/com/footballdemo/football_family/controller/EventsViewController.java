package com.footballdemo.football_family.controller;

import com.footballdemo.football_family.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class EventsViewController {

    @Autowired
    private UserService userService;

    @GetMapping("/events")
    public String eventsPage(Authentication authentication, Model model) {

        // Vérifier si l'utilisateur a le rôle COACH ou CLUB_ADMIN
        boolean hasRole = false;
        Long currentUserId = null;

        if (authentication != null && authentication.isAuthenticated() &&
                !authentication.getName().equals("anonymousUser")) {

            hasRole = authentication.getAuthorities().stream()
                    .anyMatch(auth -> auth.getAuthority().equals("ROLE_COACH") ||
                            auth.getAuthority().equals("ROLE_CLUB_ADMIN") ||
                            auth.getAuthority().equals("ROLE_SUPER_ADMIN"));

            // Récupérer l'ID utilisateur
            currentUserId = userService.getUserByUsername(authentication.getName())
                    .map(user -> user.getId())
                    .orElse(null);
        }

        model.addAttribute("hasRole", hasRole);
        model.addAttribute("currentUserId", currentUserId);

        return "events"; // Retourne events.html
    }
}