package com.playtesting.platform.controller;

import com.playtesting.platform.dto.GameRequestDto;
import com.playtesting.platform.dto.GameResponseDto;
import com.playtesting.platform.entity.Game;
import com.playtesting.platform.service.FileStorageService;
import com.playtesting.platform.service.GameService;
import jakarta.validation.Valid;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/games")
public class GameController {

    private final GameService gameService;
    private final FileStorageService fileStorageService;

    public GameController(GameService gameService, FileStorageService fileStorageService) {
        this.gameService = gameService;
        this.fileStorageService = fileStorageService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<GameResponseDto> create(
            @Valid @RequestPart("game") GameRequestDto request,
            @RequestPart("file") MultipartFile file,
            Authentication authentication) {
        return ResponseEntity.status(201)
                .body(gameService.create(request, file, authentication.getName()));
    }

    @GetMapping
    public java.util.List<GameResponseDto> findAll(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String platform) {
        return gameService.findAll(search, platform);
    }

    @PutMapping(value = "/{id}/update-file", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public GameResponseDto updateFile(
            @PathVariable Long id,
            @RequestParam String version,
            @RequestPart("file") MultipartFile file,
            Authentication authentication) {
        return gameService.updateFile(id, version, file, authentication.getName());
    }

    @GetMapping("/{id}")
    public GameResponseDto findById(@PathVariable Long id) {
        return gameService.findById(id);
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> download(@PathVariable Long id) {
        Game game = gameService.findEntityById(id);
        Resource resource = fileStorageService.loadAsResource(game.getFilePathOrUrl());
        String filename = fileStorageService.getDownloadFilename(
                game.getTitle(), game.getFilePathOrUrl());
        return ResponseEntity.ok()
                .contentType(fileStorageService.getMediaType(game.getFilePathOrUrl()))
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + filename + "\"")
                .body(resource);
    }
}
