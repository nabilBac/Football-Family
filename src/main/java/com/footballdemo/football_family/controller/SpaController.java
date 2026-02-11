package com.footballdemo.football_family.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaController {

    /**
     * Routes SPA : toutes les routes SAUF /api/**, /ws/**, /videos/**, /uploads/**
     * retournent index.html pour que le router JS gère la navigation
     */
    @GetMapping(value = {
            "/",
            "/login",
            "/register",
            "/feed",
            "/profile",
            "/upload",
            "/events",
            "/events/**",
            "/clubs",
            "/clubs/**",
            "/hub",
            "/live",
            "/live/**",
            "/tournament/**",
            "/admin/**" ,
             "/club-admin",
        "/club-admin/**"

    })
    public String spaRoutes() {
        return "forward:/index.html";
    }
}