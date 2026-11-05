package com.playtesting.platform.controller;

import com.playtesting.platform.dto.CreateFormRequestDto;
import com.playtesting.platform.dto.FormResponseDto;
import com.playtesting.platform.service.FormService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/forms")
public class FormController {

    private final FormService formService;

    public FormController(FormService formService) {
        this.formService = formService;
    }

    @PostMapping
    public ResponseEntity<FormResponseDto> create(
            @RequestParam Long gameId,
            @Valid @RequestBody CreateFormRequestDto request,
            Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(formService.create(gameId, request, authentication.getName()));
    }

    @GetMapping("/game/{gameId}")
    public FormResponseDto findActive(@PathVariable Long gameId) {
        return formService.findActiveByGameId(gameId);
    }
}
