package com.footballdemo.football_family.dto;

import com.footballdemo.football_family.model.Club;
import com.footballdemo.football_family.model.ClubStatus;
import com.footballdemo.football_family.model.ClubType;
import lombok.*;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClubDTO {

    private Long id;
    private String name;
    private String siret;
    private String address;
    private String city;
    private String zipCode;
    private String phone;
    private String email;
    private ClubType type;
    private ClubStatus status;
    private String typeDisplayName;
    private String description;
    private String logo;
    private LocalDate createdAt;
    private LocalDate verifiedAt;
    private int memberCount;
    private int teamCount;

    public static ClubDTO from(Club club) {
        if (club == null)
            return null;

        return ClubDTO.builder()
                .id(club.getId())
                .name(club.getName())
                .siret(club.getSiret())
                .address(club.getAddress())
                .city(club.getCity())
                .zipCode(club.getZipCode())
                .phone(club.getPhone())
                .email(club.getEmail())
                .type(club.getType())
                .typeDisplayName(club.getType() != null ? club.getType().getDisplayName() : null)
                .description(club.getDescription())
                .logo(club.getLogo())
                .status(club.getStatus())
                .createdAt(club.getCreatedAt())
                .verifiedAt(club.getVerifiedAt())
                .memberCount(club.getMembers() != null ? club.getMembers().size() : 0)
                .teamCount(club.getTeams() != null ? club.getTeams().size() : 0)
                .build();
    }
}
