package com.footballdemo.football_family.dto;

import com.footballdemo.football_family.model.EventRegistration;
import lombok.*;

import java.time.LocalDate;


@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventRegistrationDTO {

    private Long id;

    private Long eventId;
    private String eventName;

    // ========== INDIVIDUAL ==========
    private Long playerId;
    private String playerUsername;

    // ========== CLUB_ONLY (inscription par club) ==========
    private Long teamId;
    private String teamName;
    private String clubName;  // ✅ NOUVEAU

    // ========== Status ==========
    private String status;

    // ========== Payment ==========
private String paymentStatus;


    // ========== Date ==========
    private LocalDate registrationDate;  // ✅ APRÈS ✅ NOUVEAU

    // ========== UTF Temporary Teams ==========
    private Long assignedTeamId;
    private String assignedTeamName;

    public static EventRegistrationDTO from(EventRegistration reg) {
        return EventRegistrationDTO.builder()
                .id(reg.getId())
                .eventId(reg.getEvent().getId())
                .eventName(reg.getEvent().getName())

                // ⭐ INDIVIDUAL
                .playerId(reg.getPlayer() != null ? reg.getPlayer().getId() : null)
                .playerUsername(reg.getPlayer() != null ? reg.getPlayer().getUsername() : null)

                // ⭐ CLUB_ONLY (team registration)
                .teamId(reg.getTeam() != null ? reg.getTeam().getId() : null)
                .teamName(reg.getTeam() != null ? reg.getTeam().getName() : null)
                .clubName(reg.getTeam() != null && reg.getTeam().getClub() != null 
                        ? reg.getTeam().getClub().getName() 
                        : null)  // ✅ NOUVEAU

                .status(reg.getStatus() != null ? reg.getStatus().name() : null)
                .paymentStatus(reg.getPaymentStatus())


                // ✅ NOUVEAU - Date d'inscription
               // ✅ NOUVEAU - Date d'inscription
.registrationDate(reg.getCreatedAt() != null 
        ? reg.getCreatedAt().toLocalDate() 
        : reg.getRegistrationDate())

                // ⭐ UTF temporary teams (assigned by organizer)
                .assignedTeamId(reg.getAssignedTeam() != null ? reg.getAssignedTeam().getId() : null)
                .assignedTeamName(reg.getAssignedTeam() != null ? reg.getAssignedTeam().getName() : null)

                .build();
    }
}