package com.playtesting.platform.dto;

import com.playtesting.platform.entity.Platform;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record GameRequestDto(
        @NotBlank(message = "no puede estar vacío.")
        @Size(min = 2, max = 100, message = "debe tener entre 2 y 100 caracteres.")
        String title,
        @NotBlank(message = "no puede estar vacía.")
        @Size(max = 1000, message = "no puede superar los 1000 caracteres.")
        String description,
        @Size(max = 80, message = "no puede superar los 80 caracteres.")
        String genre,
        @NotNull(message = "selecciona una plataforma válida.")
        Platform platform,
        @Size(max = 1000, message = "no pueden superar los 1000 caracteres.")
        String releaseNotes) {

    public GameRequestDto(String title, String description, String genre, Platform platform) {
        this(title, description, genre, platform, null);
    }
}
