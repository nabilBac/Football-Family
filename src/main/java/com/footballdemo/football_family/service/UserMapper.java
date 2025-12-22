package com.footballdemo.football_family.service;

import com.footballdemo.football_family.dto.UserDTO;
import com.footballdemo.football_family.model.User;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    public UserDTO toDTO(User user) {
        if (user == null) return null;

        Long clubId = null;

        if (user.getClubUsers() != null && !user.getClubUsers().isEmpty()) {
            clubId = user.getClubUsers()
                    .stream()
                    .findFirst()
                    .map(cu -> cu.getClub().getId())
                    .orElse(null);
        }

        return new UserDTO(
                user.getId(),
                safe(user.getUsername()),
                safe(user.getEmail()),
                user.getAvatarUrl(),
                user.getHighestRole(),
                Boolean.TRUE.equals(user.getVerified()),
                clubId   // ✅ LA VRAIE SOURCE
        );
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }
}
