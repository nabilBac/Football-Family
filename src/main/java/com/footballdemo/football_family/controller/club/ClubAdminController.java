package com.footballdemo.football_family.controller.club;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
@PreAuthorize("hasRole('CLUB_ADMIN')")
public class ClubAdminController {

    @GetMapping("/club/dashboard")
    public String clubDashboard() {
        return "club/dashboard";
    }
}
