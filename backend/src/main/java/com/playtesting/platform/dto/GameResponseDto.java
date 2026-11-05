package com.playtesting.platform.dto;

import com.playtesting.platform.entity.Platform;
import java.time.OffsetDateTime;

public record GameResponseDto(
        Long id,
        String title,
        String description,
        String genre,
        Platform platform,
        String filePathOrUrl,
        String creatorUsername,
        OffsetDateTime createdAt) {
}
