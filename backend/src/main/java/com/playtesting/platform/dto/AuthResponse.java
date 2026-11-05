package com.playtesting.platform.dto;

import com.playtesting.platform.entity.Role;

public record AuthResponse(
        String jwtToken,
        String tokenType,
        String username,
        Role role) {
}
