package com.playtesting.platform.service;

import com.playtesting.platform.dto.GameRequestDto;
import com.playtesting.platform.dto.GameResponseDto;
import com.playtesting.platform.entity.Game;
import com.playtesting.platform.entity.Role;
import com.playtesting.platform.entity.User;
import com.playtesting.platform.repository.GameRepository;
import com.playtesting.platform.repository.UserRepository;
import java.util.List;
import java.util.Locale;
import org.springframework.util.StringUtils;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
public class GameService {

    private final GameRepository gameRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;

    public GameService(
            GameRepository gameRepository,
            UserRepository userRepository,
            FileStorageService fileStorageService) {
        this.gameRepository = gameRepository;
        this.userRepository = userRepository;
        this.fileStorageService = fileStorageService;
    }

    @Transactional
    public GameResponseDto create(GameRequestDto request, MultipartFile file, String username) {
        User creator = userRepository.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
        if (creator.getRole() != Role.CREATOR) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only creators can publish games");
        }

        Game game = new Game();
        game.setCreator(creator);
        game.setTitle(request.title().trim());
        game.setDescription(request.description());
        game.setGenre(request.genre());
        game.setVersion("1.0");
        game.setPlatform(request.platform());
        game.setFilePathOrUrl(fileStorageService.store(file));
        return toResponse(gameRepository.save(game));
    }

    @Transactional(readOnly = true)
    public List<GameResponseDto> findAll(String search, String platform) {
        return gameRepository.findAllByOrderByCreatedAtDesc().stream()
                .filter(game -> matchesSearch(game, search))
                .filter(game -> matchesPlatform(game, platform))
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public GameResponseDto updateFile(Long id, String version, MultipartFile file, String username) {
        Game game = findEntityById(id);
        verifyOwnership(game, username);
        if (!StringUtils.hasText(version) || version.trim().length() > 20) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Version is required and must have at most 20 characters");
        }
        game.setVersion(version.trim());
        game.setFilePathOrUrl(fileStorageService.store(file));
        return toResponse(gameRepository.save(game));
    }

    @Transactional(readOnly = true)
    public GameResponseDto findById(Long id) {
        return toResponse(gameRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Game not found")));
    }

    @Transactional(readOnly = true)
    public Game findEntityById(Long id) {
        return gameRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Game not found"));
    }

    private GameResponseDto toResponse(Game game) {
        return new GameResponseDto(
                game.getId(),
                game.getTitle(),
                game.getDescription(),
                game.getGenre(),
                game.getVersion(),
                game.getPlatform(),
                game.getFilePathOrUrl(),
                game.getCreator().getUsername(),
                game.getCreatedAt());
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
        return !StringUtils.hasText(platform)
                || game.getPlatform().name().equalsIgnoreCase(platform.trim());
    }

    private void verifyOwnership(Game game, String username) {
        if (game.getCreator().getRole() != Role.CREATOR
                || !game.getCreator().getUsername().equalsIgnoreCase(username)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the game creator can update this game");
        }
    }
}
