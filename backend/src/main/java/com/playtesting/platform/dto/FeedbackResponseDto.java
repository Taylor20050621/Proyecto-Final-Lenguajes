package com.playtesting.platform.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

public record FeedbackResponseDto(
        Long id,
        Long formId,
        String testerUsername,
        OffsetDateTime submittedAt,
        List<SubmittedAnswerDto> answers) {

    public record SubmittedAnswerDto(
            Long questionId,
            String questionText,
            String answerText,
            BigDecimal numericValue) {
    }
}
