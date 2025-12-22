package com.footballdemo.football_family.dto;

public record AuthResponse(
        String accessToken,
        String refreshToken,
        UserDTO user) {
}
