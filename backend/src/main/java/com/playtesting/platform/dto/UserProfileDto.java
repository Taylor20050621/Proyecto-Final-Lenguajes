package com.playtesting.platform.dto;

import com.playtesting.platform.entity.Role;
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
        java.math.BigDecimal averageRating) {

    public record UserActivityDto(Long id, String title, String type) {
    }
}
