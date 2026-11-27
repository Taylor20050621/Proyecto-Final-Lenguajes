package com.playtesting.platform.dto;

import com.playtesting.platform.entity.Role;
import java.time.OffsetDateTime;
import java.util.List;

public record UserProfileDto(
        String username,
        String email,
        Role role,
        Integer points,
        long feedbacksSubmitted,
        List<UserActivityDto> activity,
        long gamesPublished,
        long evaluationsReceived,
        java.math.BigDecimal averageRating,
        List<String> platformsTested) {

    public record UserActivityDto(
            Long id,
            String title,
            String type,
            Long gameId,
            String gameTitle,
            String platform,
            String evaluatedVersion,
            OffsetDateTime submittedAt,
            Integer pointsEarned,
            boolean hasCoverImage) {

        public UserActivityDto(Long id, String title, String type) {
            this(id, title, type, null, null, null, null, null, null, false);
        }
    }
}
