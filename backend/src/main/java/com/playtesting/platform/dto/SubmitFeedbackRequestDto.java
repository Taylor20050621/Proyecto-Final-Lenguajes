package com.playtesting.platform.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record SubmitFeedbackRequestDto(
        @NotNull Long formId,
        @NotEmpty @Valid List<AnswerRequestDto> answers) {
}
