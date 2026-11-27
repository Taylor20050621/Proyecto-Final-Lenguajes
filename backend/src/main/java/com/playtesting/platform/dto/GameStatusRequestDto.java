package com.playtesting.platform.dto;

import com.playtesting.platform.entity.GameStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record GameStatusRequestDto(
        @NotNull(message = "selecciona un estado válido.")
        GameStatus status,
        @Size(max = 500, message = "no puede superar los 500 caracteres.")
        String officialUrl) {

    public GameStatusRequestDto(GameStatus status) {
        this(status, null);
    }
}
