package com.playtesting.platform.dto;

import java.math.BigDecimal;

public record AnswerRequestDto(
        Long questionId,
        String answerText,
        BigDecimal numericValue) {
}
