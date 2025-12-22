package com.footballdemo.football_family.controller.api.events;

import com.footballdemo.football_family.dto.ApiResponse;
import com.footballdemo.football_family.dto.EventDTO;
import com.footballdemo.football_family.dto.CreateEventDTO;
import com.footballdemo.football_family.model.Event;
import com.footballdemo.football_family.model.User;
import com.footballdemo.football_family.service.EventService;
import com.footballdemo.football_family.service.UserService;

import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/events/admin")
@RequiredArgsConstructor
public class EventAdminApiController {

    private final EventService eventService;
    private final UserService userService;

    private User getUser(Principal principal) {
        return userService.getUserByUsername(principal.getName())
                .orElseThrow();
    }

    // 1️⃣ Liste des événements admin
  @GetMapping("/all")
public ApiResponse<List<EventDTO>> getAllAdminEvents(Principal principal) {

    User admin = getUser(principal);

    // 🔥 compatible avec ton EventService
    List<Event> events = eventService
            .getAllEvents(PageRequest.of(0, 999))
            .getContent();

  List<EventDTO> dtos = events.stream()
    .map(e -> EventDTO.from(
            e,
            admin.getId(),
            eventService.countAcceptedParticipants(e.getId()),
            null,   // teamsRegisteredByMyClub
            null    // 🆕 pendingTeamsByMyClub
    ))
    .toList();


    return new ApiResponse<>(true, "Liste chargée", dtos);
}


    // 2️⃣ Création d’un nouvel événement
    @PostMapping("/create")
    public ApiResponse<EventDTO> createAdminEvent(
            @RequestBody CreateEventDTO dto,
            Principal principal) {

        User organizer = getUser(principal);

        Event created = eventService.createEvent(dto, organizer);

  return new ApiResponse<>(
    true,
    "Événement créé",
    EventDTO.from(
        created,
        organizer.getId(),
        0,      // acceptedParticipants
        null,   // teamsRegisteredByMyClub
        null    // 🆕 pendingTeamsByMyClub
    )
);

    }
}
