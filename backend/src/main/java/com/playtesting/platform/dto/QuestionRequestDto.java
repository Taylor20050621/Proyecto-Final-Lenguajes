package com.playtesting.platform.dto;

import com.playtesting.platform.entity.QuestionType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record QuestionRequestDto(
        @NotBlank String questionText,
        @NotNull QuestionType questionType,
        boolean required) {
}
