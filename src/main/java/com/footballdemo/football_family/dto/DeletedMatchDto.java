package com.footballdemo.football_family.dto;

import java.time.LocalDateTime;

public record DeletedMatchDto(
    Long id,
    String round,
    String teamA,
    String teamB,
    String eventName,
    LocalDateTime deletedAt
) {}

