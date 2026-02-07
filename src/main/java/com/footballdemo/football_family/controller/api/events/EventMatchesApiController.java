package com.footballdemo.football_family.controller.api.events;

import com.footballdemo.football_family.dto.ApiResponse;
import com.footballdemo.football_family.dto.MatchDTO;
import com.footballdemo.football_family.model.Event;
import com.footballdemo.football_family.model.User;
import com.footballdemo.football_family.service.EventAccessService;
import com.footballdemo.football_family.service.EventService;
import com.footballdemo.football_family.service.MatchService;
import com.footballdemo.football_family.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/events")
public class EventMatchesApiController {

    private final EventService eventService;
    private final UserService userService;
    private final MatchService matchService;
    private final EventAccessService eventAccessService; // 🔥 Injection du service

@GetMapping("/{eventId}/matches")
public ResponseEntity<?> getMatches(
        @PathVariable Long eventId,
        Principal principal
) {
    User user = null;
    if (principal != null) {
        user = userService
                .getUserByUsername(principal.getName())
                .orElse(null);
    }

    Event event = eventService.getEventById(eventId);
    eventAccessService.assertCanView(event, user);

    List<MatchDTO> matches = matchService.getMatchesByEvent(eventId)
            .stream()
            .map(MatchDTO::from)
            .toList();

    return ResponseEntity.ok(
            new ApiResponse<>(true, "Matchs récupérés", matches)
    );
}





}
