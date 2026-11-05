package com.playtesting.platform.dto;

import com.playtesting.platform.entity.QuestionType;

public record QuestionResponseDto(
        Long id,
        String questionText,
        QuestionType questionType,
        boolean required) {
}
