package com.playtesting.platform.service;

import com.playtesting.platform.dto.GameRequestDto;
import com.playtesting.platform.dto.GameResponseDto;
import com.playtesting.platform.entity.Game;
import com.playtesting.platform.entity.GameStatus;
import com.playtesting.platform.entity.Role;
import com.playtesting.platform.entity.User;
import com.playtesting.platform.repository.GameRepository;
import com.playtesting.platform.repository.ResponseRepository;
import com.playtesting.platform.repository.UserRepository;
import java.util.List;
import java.util.Locale;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import org.springframework.util.StringUtils;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.security.core.Authentication;

@Service
public class GameService {

    private final GameRepository gameRepository;
    private final UserRepository userRepository;
    private final ResponseRepository responseRepository;
    private final FileStorageService fileStorageService;

    public GameService(
            GameRepository gameRepository,
            UserRepository userRepository,
            ResponseRepository responseRepository,
            FileStorageService fileStorageService) {
        this.gameRepository = gameRepository;
        this.userRepository = userRepository;
        this.responseRepository = responseRepository;
        this.fileStorageService = fileStorageService;
    }

    @Transactional
    public GameResponseDto create(GameRequestDto request, MultipartFile file, String username) {
        return create(request, file, null, username);
    }

    @Transactional
    public GameResponseDto create(
            GameRequestDto request, MultipartFile file, MultipartFile coverImage, String username) {
        User creator = userRepository.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "No se encontró el usuario."));
        if (creator.getRole() != Role.CREATOR) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Solo los creadores pueden publicar juegos.");
        }

        Game game = new Game();
        game.setCreator(creator);
        game.setTitle(request.title().trim());
        game.setDescription(request.description());
        game.setGenre(request.genre());
        game.setVersion("1.0");
        game.setVersionUpdatedAt(OffsetDateTime.now(ZoneOffset.UTC));
        game.setReleaseNotes(normalizeReleaseNotes(request.releaseNotes()));
        game.setPlatform(request.platform());
        game.setFilePathOrUrl(fileStorageService.store(file));
        game.setCoverImagePath(fileStorageService.storeCoverImage(coverImage));
        return toResponse(gameRepository.save(game));
    }

    @Transactional(readOnly = true)
    public List<GameResponseDto> findAll(String search, String platform, String status) {
        return findAll(search, platform, status, null);
    }

    @Transactional(readOnly = true)
    public List<GameResponseDto> findAll(String search, String platform, String status, String username) {
        Long testerId = StringUtils.hasText(username)
                ? userRepository.findByUsernameIgnoreCase(username)
                        .filter(user -> user.getRole() == Role.TESTER)
                        .map(User::getId)
                        .orElse(null)
                : null;
        return gameRepository.findAllByOrderByCreatedAtDesc().stream()
                .filter(game -> matchesSearch(game, search))
                .filter(game -> matchesPlatform(game, platform))
                .filter(game -> matchesStatus(game, status))
                .map(game -> toResponse(
                        game,
                        testerId != null && responseRepository.existsByTesterIdAndFormGameIdAndEvaluatedVersion(
                                testerId, game.getId(), game.getVersion())))
                .toList();
    }

    @Transactional
    public GameResponseDto updateFile(Long id, String version, MultipartFile file, String username) {
        return updateFile(id, version, null, file, username);
    }

    @Transactional
    public GameResponseDto updateFile(
            Long id, String version, String releaseNotes, MultipartFile file, String username) {
        return updateFile(id, version, releaseNotes, file, null, username);
    }

    @Transactional
    public GameResponseDto updateFile(
            Long id,
            String version,
            String releaseNotes,
            MultipartFile file,
            MultipartFile coverImage,
            String username) {
        Game game = findEntityById(id);
        verifyOwnership(game, username);
        if (!StringUtils.hasText(version) || version.trim().length() > 20) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "La versión es obligatoria y no puede superar los 20 caracteres.");
        }
        if (!version.trim().matches("(?i)v?\\d+(\\.\\d+){1,2}")) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Ingresa una versión válida, por ejemplo 1.0 o v1.2.");
        }

        game.setVersion(version.trim());
        game.setVersionUpdatedAt(OffsetDateTime.now(ZoneOffset.UTC));
        if (releaseNotes != null) {
            game.setReleaseNotes(normalizeReleaseNotes(releaseNotes));
        }
        game.setFilePathOrUrl(fileStorageService.store(file));
        if (coverImage != null && !coverImage.isEmpty()) {
            game.setCoverImagePath(fileStorageService.storeCoverImage(coverImage));
        }
        return toResponse(gameRepository.save(game));
    }

    @Transactional
    public GameResponseDto updateStatus(Long id, GameStatus status, String username) {
        return updateStatus(id, status, null, username);
    }

    @Transactional
    public GameResponseDto updateStatus(Long id, GameStatus status, String officialUrl, String username) {
        Game game = findEntityById(id);
        verifyOwnership(game, username);
        game.setStatus(status);
        if (officialUrl != null) {
            game.setOfficialUrl(normalizeOfficialUrl(officialUrl));
        }
        return toResponse(gameRepository.save(game));
    }

    @Transactional(readOnly = true)
    public GameResponseDto findById(Long id) {
        return toResponse(gameRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No se encontró el juego solicitado.")));
    }

    @Transactional(readOnly = true)
    public Game findEntityById(Long id) {
        return gameRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No se encontró el juego solicitado."));
    }

    @Transactional(readOnly = true)
    public Game findDownloadableEntity(Long id, Authentication authentication) {
        Game game = findEntityById(id);
        if (game.getStatus() == GameStatus.EN_PLAYTESTING) {
            return game;
        }
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "Solo el creador puede descargar un juego pausado o finalizado.");
        }
        verifyOwnership(game, authentication.getName());
        return game;
    }

    private GameResponseDto toResponse(Game game) {
        return toResponse(game, false);
    }

    private GameResponseDto toResponse(Game game, boolean alreadyEvaluatedCurrentVersion) {
        return new GameResponseDto(
                game.getId(),
                game.getTitle(),
                game.getDescription(),
                game.getGenre(),
                game.getVersion(),
                game.getPlatform(),
                game.getStatus(),
                game.getFilePathOrUrl(),
                StringUtils.hasText(game.getCoverImagePath()),
                game.getReleaseNotes(),
                game.getOfficialUrl(),
                game.getCreator().getUsername(),
                game.getCreatedAt(),
                alreadyEvaluatedCurrentVersion,
                fileStorageService.getFileExtension(game.getFilePathOrUrl()),
                fileStorageService.getFormattedFileSize(game.getFilePathOrUrl()));
    }

    private String normalizeReleaseNotes(String releaseNotes) {
        return StringUtils.hasText(releaseNotes) ? releaseNotes.trim() : null;
    }

    private String normalizeOfficialUrl(String officialUrl) {
        if (!StringUtils.hasText(officialUrl)) {
            return null;
        }
        String normalized = officialUrl.trim();
        try {
            java.net.URI uri = java.net.URI.create(normalized);
            String scheme = uri.getScheme();
            if (!uri.isAbsolute()
                    || uri.getHost() == null
                    || !("http".equalsIgnoreCase(scheme) || "https".equalsIgnoreCase(scheme))) {
                throw new IllegalArgumentException("La URL debe comenzar con http:// o https:// y ser válida.");
            }
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Ingresa un enlace válido que comience con http:// o https://.", exception);
        }
        if (normalized.length() > 500) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "El enlace no puede superar los 500 caracteres.");
        }
        return normalized;
    }

    private boolean matchesSearch(Game game, String search) {
        if (!StringUtils.hasText(search)) {
            return true;
        }
        String normalized = search.trim().toLowerCase(Locale.ROOT);
        return (game.getTitle() != null && game.getTitle().toLowerCase(Locale.ROOT).contains(normalized))
                || (game.getDescription() != null
                        && game.getDescription().toLowerCase(Locale.ROOT).contains(normalized));
    }

    private boolean matchesPlatform(Game game, String platform) {
        if (!StringUtils.hasText(platform)) {
            return true;
        }
        String selectedPlatform = platform.trim();
        return game.getPlatform().name().equalsIgnoreCase(selectedPlatform)
                || ("WEB".equalsIgnoreCase(selectedPlatform) && game.getPlatform().name().equals("WEBGL"));
    }

    private boolean matchesStatus(Game game, String status) {
        return !StringUtils.hasText(status)
                || game.getStatus().name().equalsIgnoreCase(status.trim());
    }

    private void verifyOwnership(Game game, String username) {
        if (game.getCreator().getRole() != Role.CREATOR
                || !game.getCreator().getUsername().equalsIgnoreCase(username)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Solo el creador del juego puede actualizarlo.");
        }
    }
}
