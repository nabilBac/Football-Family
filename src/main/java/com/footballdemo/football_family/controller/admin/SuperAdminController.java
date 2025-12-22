package com.footballdemo.football_family.controller.admin;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SuperAdminController {

    @GetMapping("/admin/super")
    public String superAdminDashboard() {
        return "admin/super";
    }
}
