package com.footballdemo.football_family.dto;

import com.footballdemo.football_family.model.RegistrationStatus;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventRegistrationDTO {

    private Long id;
    private Long playerId;
    private String playerUsername;
    private Long eventId;
    private String eventName;
    private RegistrationStatus status;

    // 🆕 NOUVEAUX CHAMPS UTF
    private Long assignedTeamId; // Équipe assignée (mode UTF)
    private String assignedTeamName; // Nom de l'équipe assignée
    private String level; // Niveau du joueur (BEGINNER, INTERMEDIATE, etc.)

    public static EventRegistrationDTO from(com.footballdemo.football_family.model.EventRegistration reg) {
        return EventRegistrationDTO.builder()
                .id(reg.getId())
                .playerId(reg.getPlayer().getId())
                .playerUsername(reg.getPlayer().getUsername())
                .eventId(reg.getEvent().getId())
                .eventName(reg.getEvent().getName())
                .status(reg.getStatus())

                // 🆕 NOUVEAUX CHAMPS UTF
                .assignedTeamId(reg.getAssignedTeam() != null ? reg.getAssignedTeam().getId() : null)
                .assignedTeamName(reg.getAssignedTeam() != null ? reg.getAssignedTeam().getName() : null)
                .level(reg.getLevel() != null ? reg.getLevel().name() : null)

                .build();
    }
}
