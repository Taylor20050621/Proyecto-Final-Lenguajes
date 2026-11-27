package com.playtesting.platform.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record SubmitFeedbackRequestDto(
        @NotNull(message = "Selecciona un formulario válido.")
        Long formId,
        @NotEmpty(message = "Incluye al menos una respuesta.")
        @Valid List<AnswerRequestDto> answers) {
}
