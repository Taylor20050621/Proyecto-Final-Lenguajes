package com.playtesting.platform.dto;

import com.playtesting.platform.entity.GameStatus;
import java.time.OffsetDateTime;

public record UserNotificationDto(
        Long gameId,
        String gameTitle,
        String version,
        GameStatus status,
        OffsetDateTime updatedAt) {
}
