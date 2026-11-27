package com.playtesting.platform.controller;

import com.playtesting.platform.dto.GameRequestDto;
import com.playtesting.platform.dto.GameResponseDto;
import com.playtesting.platform.dto.GameStatusRequestDto;
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
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.util.StringUtils;

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
            @RequestPart(value = "coverImage", required = false) MultipartFile coverImage,
            Authentication authentication) {
        return ResponseEntity.status(201)
                .body(gameService.create(request, file, coverImage, authentication.getName()));
    }

    @GetMapping
    public java.util.List<GameResponseDto> findAll(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String platform,
            @RequestParam(required = false) String status,
            Authentication authentication) {
        String username = authentication != null && authentication.isAuthenticated()
                && !"anonymousUser".equals(authentication.getName())
                        ? authentication.getName()
                        : null;
        return gameService.findAll(search, platform, status, username);
    }

    @PutMapping(value = {"/{id}/update-file", "/{id}/version"}, consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public GameResponseDto updateFile(
            @PathVariable Long id,
            @RequestParam String version,
            @RequestParam(value = "releaseNotes", required = false) String releaseNotes,
            @RequestPart("file") MultipartFile file,
            @RequestPart(value = "coverImage", required = false) MultipartFile coverImage,
            Authentication authentication) {
        return gameService.updateFile(id, version, releaseNotes, file, coverImage, authentication.getName());
    }

    @PatchMapping("/{id}/status")
    public GameResponseDto updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody GameStatusRequestDto request,
            Authentication authentication) {
        return gameService.updateStatus(id, request.status(), request.officialUrl(), authentication.getName());
    }

    @GetMapping("/{id}")
    public GameResponseDto findById(@PathVariable Long id) {
        return gameService.findById(id);
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> download(
            @PathVariable Long id,
            Authentication authentication) {
        Game game = gameService.findDownloadableEntity(id, authentication);
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

    @GetMapping("/{id}/cover")
    public ResponseEntity<Resource> cover(@PathVariable Long id) {
        Game game = gameService.findEntityById(id);
        if (!StringUtils.hasText(game.getCoverImagePath())) {
            return ResponseEntity.notFound().build();
        }
        Resource resource = fileStorageService.loadAsResource(game.getCoverImagePath());
        return ResponseEntity.ok()
                .contentType(fileStorageService.getCoverImageMediaType(game.getCoverImagePath()))
                .body(resource);
    }
}
