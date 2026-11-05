package com.playtesting.platform.dto;

import com.playtesting.platform.entity.Platform;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record GameRequestDto(
        @NotBlank @Size(max = 150) String title,
        String description,
        @Size(max = 80) String genre,
        @NotNull Platform platform) {
}
