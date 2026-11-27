package com.playtesting.platform.dto;

import com.playtesting.platform.entity.QuestionType;
import java.math.BigDecimal;
import java.util.List;

public record FeedbackSummaryDto(
        long totalResponses,
        BigDecimal averageLikertScore,
        long likertAnswerCount,
        BigDecimal averagePlayTime,
        List<QuestionSummaryDto> questionSummaries) {

    public FeedbackSummaryDto(
            long totalResponses,
            BigDecimal averageLikertScore,
            BigDecimal averagePlayTime,
            List<QuestionSummaryDto> questionSummaries) {
        this(totalResponses, averageLikertScore, 0, averagePlayTime, questionSummaries);
    }

    public record QuestionSummaryDto(
            Long questionId,
            String questionText,
            QuestionType questionType,
            BigDecimal average,
            List<String> comments) {
    }
}
