package com.playtesting.platform.controller;

import com.playtesting.platform.dto.FeedbackResponseDto;
import com.playtesting.platform.dto.FeedbackSummaryDto;
import com.playtesting.platform.dto.SubmitFeedbackRequestDto;
import com.playtesting.platform.service.FeedbackService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/feedback")
public class FeedbackController {

    private final FeedbackService feedbackService;

    public FeedbackController(FeedbackService feedbackService) {
        this.feedbackService = feedbackService;
    }

    @PostMapping
    public ResponseEntity<FeedbackResponseDto> submit(
            @Valid @RequestBody SubmitFeedbackRequestDto request,
            Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(feedbackService.submit(request, authentication.getName()));
    }

    @GetMapping("/game/{gameId}")
    public List<FeedbackResponseDto> findByGame(
            @PathVariable Long gameId,
            Authentication authentication) {
        return feedbackService.findByGameId(gameId, authentication.getName());
    }

    @GetMapping("/game/{gameId}/summary")
    public FeedbackSummaryDto summarizeByGame(
            @PathVariable Long gameId,
            Authentication authentication) {
        return feedbackService.summarizeByGameId(gameId, authentication.getName());
    }
}
