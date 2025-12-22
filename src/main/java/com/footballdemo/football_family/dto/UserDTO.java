package com.footballdemo.football_family.dto;



public record UserDTO(
        Long id,
        String username,
        String email,
        String avatarUrl,
        String highestRole,
        Boolean verified,   // 🟢 AVANT
        Long clubId         // 🟢 APRÈS
) {}


