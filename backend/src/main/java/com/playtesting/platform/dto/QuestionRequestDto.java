package com.playtesting.platform.dto;

import com.playtesting.platform.entity.QuestionType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record QuestionRequestDto(
        @NotBlank(message = "El texto de la pregunta es obligatorio.")
        String questionText,
        @NotNull(message = "Selecciona un tipo de pregunta válido.")
        QuestionType questionType,
        boolean required) {
}
