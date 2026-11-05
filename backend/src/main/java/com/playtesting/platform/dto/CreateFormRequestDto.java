package com.playtesting.platform.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record CreateFormRequestDto(
        @NotBlank String title,
        String description,
        @NotEmpty @Valid List<QuestionRequestDto> questions) {
}
