package com.playtesting.platform.dto;

import com.playtesting.platform.entity.GameStatus;
import jakarta.validation.constraints.NotNull;

public record GameStatusRequestDto(@NotNull GameStatus status) {
}
