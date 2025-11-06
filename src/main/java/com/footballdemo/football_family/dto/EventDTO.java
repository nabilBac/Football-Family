package com.footballdemo.football_family.dto;

import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventDTO {

    private Long id;

    @NotBlank(message = "Le nom de l'événement est obligatoire")
    @Size(min = 3, max = 100, message = "Le nom doit contenir entre 3 et 100 caractères")
    private String name;

    // 🔹 String pour DTO mais venant de EventType
    @NotBlank(message = "Le type d'événement est obligatoire")
    private String type;

    @NotBlank(message = "Le lieu est obligatoire")
    @Size(min = 3, max = 200, message = "Le lieu doit contenir entre 3 et 200 caractères")
    private String location;

    @NotNull(message = "La date est obligatoire")
    private LocalDate date;

    // 🔹 Ajout de visibility
    private String visibility;

    private List<MatchDTO> matches;
    private List<EventRegistrationDTO> registrations;
    private String currentRegistrationStatus;
    private Long organizerId;
    private String organizerUsername;
    private Integer maxParticipants;
    private String status;

    // 🆕 NOUVEAUX CHAMPS UTF
    private String description;
    private String registrationType; // "INDIVIDUAL" (UTF) ou "TEAM_BASED" (Spond)
    private Integer numberOfTeams;
    private Integer teamSize;
    private Boolean teamsFormed;
    private Integer confirmedParticipants;

    // 🔹 Convertir Event → EventDTO
    public static EventDTO from(com.footballdemo.football_family.model.Event event, Long currentUserId) {
        if (event == null)
            return null;

        List<EventRegistrationDTO> regs = event.getRegistrations() != null
                ? event.getRegistrations().stream().map(EventRegistrationDTO::from).toList()
                : List.of();

        String myStatus = null;
        if (currentUserId != null && event.getRegistrations() != null) {
            myStatus = event.getRegistrations().stream()
                    .filter(reg -> reg.getPlayer() != null && reg.getPlayer().getId().equals(currentUserId))
                    .findFirst()
                    .map(reg -> reg.getStatus().name())
                    .orElse(null);
        }

        return EventDTO.builder()
                .id(event.getId())
                .name(event.getName())
                .type(event.getType() != null ? event.getType().name() : null) // ✅ EventType
                .visibility(event.getVisibility() != null ? event.getVisibility().name() : null) // ✅ Visibility
                .date(event.getDate())
                .location(event.getLocation())
                .organizerId(event.getOrganizer() != null ? event.getOrganizer().getId() : null)
                .organizerUsername(event.getOrganizer() != null ? event.getOrganizer().getUsername() : null)
                .maxParticipants(event.getMaxParticipants())
                .status(event.getStatus() != null ? event.getStatus().name() : null) // ✅ EventStatus
                .matches(event.getMatches() != null
                        ? event.getMatches().stream().map(MatchDTO::from).toList()
                        : List.of())
                .registrations(regs)
                .currentRegistrationStatus(myStatus)

                // 🆕 NOUVEAUX CHAMPS UTF
                .description(event.getDescription())
                .registrationType(event.getRegistrationType() != null ? event.getRegistrationType().name() : null)
                .numberOfTeams(event.getNumberOfTeams())
                .teamSize(event.getTeamSize())
                .teamsFormed(event.getTeamsFormed())
                .confirmedParticipants(event.getConfirmedParticipantsCount())

                .build();
    }

    public static EventDTO from(com.footballdemo.football_family.model.Event event) {
        return from(event, null);
    }
}
