package com.playtesting.platform.dto;

import java.util.List;

public record FormResponseDto(
        Long id,
        Long gameId,
        String title,
        String description,
        List<QuestionResponseDto> questions) {
}
