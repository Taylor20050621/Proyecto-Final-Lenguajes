package com.playtesting.platform.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.util.List;

public record CreateFormRequestDto(
        @NotBlank(message = "El título del formulario es obligatorio.")
        @Size(max = 150, message = "El título del formulario no puede superar los 150 caracteres.")
        String title,
        String description,
        @NotEmpty(message = "Agrega al menos una pregunta.")
        @Valid List<QuestionRequestDto> questions) {
}
