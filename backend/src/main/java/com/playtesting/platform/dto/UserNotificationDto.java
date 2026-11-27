package com.playtesting.platform.dto;

import com.playtesting.platform.entity.GameStatus;
import java.time.OffsetDateTime;

public record UserNotificationDto(
        Long gameId,
        String gameTitle,
        String version,
        GameStatus status,
        OffsetDateTime updatedAt,
        String releaseNotes) {

    public UserNotificationDto(
            Long gameId,
            String gameTitle,
            String version,
            GameStatus status,
            OffsetDateTime updatedAt) {
        this(gameId, gameTitle, version, status, updatedAt, null);
    }
}
