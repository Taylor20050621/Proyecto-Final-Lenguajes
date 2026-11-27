package com.playtesting.platform.dto;

public record LeaderboardEntryDto(
        Long id,
        String username,
        Integer points,
        long evaluationsCount,
        String rank) {
}
