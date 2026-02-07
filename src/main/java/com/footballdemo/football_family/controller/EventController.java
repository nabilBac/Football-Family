package com.footballdemo.football_family.controller;

import com.footballdemo.football_family.service.BracketService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import com.footballdemo.football_family.dto.ApiResponse;


@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class EventController {

    private final BracketService bracketService;

    /**
     * 🔥 Génération du bracket SEMI-DIRIGÉ
     */
   @PostMapping("/{eventId}/bracket/semi-directed")
public ApiResponse<String> generateSemiDirectedBracket(@PathVariable Long eventId) {
    bracketService.generateSemiDirectedBracket(eventId);
    return new ApiResponse<>(true, "Bracket LDC généré", "OK");
}

}
