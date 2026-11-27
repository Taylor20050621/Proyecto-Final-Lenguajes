package com.playtesting.platform.service;

import com.playtesting.platform.dto.UserProfileDto;
import com.playtesting.platform.dto.UserNotificationDto;
import com.playtesting.platform.dto.LeaderboardEntryDto;
import com.playtesting.platform.entity.Role;
import com.playtesting.platform.entity.QuestionType;
import com.playtesting.platform.entity.Platform;
import com.playtesting.platform.entity.User;
import com.playtesting.platform.repository.GameRepository;
import com.playtesting.platform.repository.ResponseRepository;
import com.playtesting.platform.repository.UserRepository;
import java.util.List;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.Map;
import java.math.BigDecimal;
import java.math.RoundingMode;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final ResponseRepository responseRepository;
    private final GameRepository gameRepository;

    public UserService(
            UserRepository userRepository,
            ResponseRepository responseRepository,
            GameRepository gameRepository) {
        this.userRepository = userRepository;
        this.responseRepository = responseRepository;
        this.gameRepository = gameRepository;
    }

    @Transactional(readOnly = true)
    public UserProfileDto getProfile(String username) {
        User user = userRepository.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "No se encontró el usuario."));
        long feedbackCount = responseRepository.countByTesterId(user.getId());
        List<UserProfileDto.UserActivityDto> activity = user.getRole() == Role.CREATOR
                ? gameRepository.findAllByCreatorIdOrderByCreatedAtDesc(user.getId()).stream()
                        .map(game -> new UserProfileDto.UserActivityDto(
                                game.getId(),
                                game.getTitle(),
                                "GAME",
                                game.getId(),
                                game.getTitle(),
                                game.getPlatform().name(),
                                game.getVersion(),
                                null,
                                null,
                                game.getCoverImagePath() != null && !game.getCoverImagePath().isBlank()))
                        .toList()
                : responseRepository.findAllByTesterIdOrderBySubmittedAtDesc(user.getId()).stream()
                        .map(response -> {
                            var game = response.getForm().getGame();
                            return new UserProfileDto.UserActivityDto(
                                    response.getId(),
                                    response.getForm().getTitle(),
                                    "FEEDBACK",
                                    game.getId(),
                                    game.getTitle(),
                                    game.getPlatform().name(),
                                    response.getEvaluatedVersion(),
                                    response.getSubmittedAt(),
                                    50,
                                    game.getCoverImagePath() != null && !game.getCoverImagePath().isBlank());
                        })
                        .toList();
        List<String> platformsTested = user.getRole() == Role.TESTER
                ? responseRepository.findAllByTesterIdOrderBySubmittedAtDesc(user.getId()).stream()
                        .map(response -> response.getForm().getGame().getPlatform() == Platform.WEBGL
                                ? Platform.WEB.name()
                                : response.getForm().getGame().getPlatform().name())
                        .distinct()
                        .toList()
                : List.of();
        long gamesPublished = 0;
        long evaluationsReceived = 0;
        BigDecimal averageRating = null;
        if (user.getRole() == Role.CREATOR) {
            gamesPublished = gameRepository.findAllByCreatorIdOrderByCreatedAtDesc(user.getId()).size();
            List<com.playtesting.platform.entity.Response> responses =
                    responseRepository.findAllByFormGameCreatorId(user.getId());
            evaluationsReceived = responses.size();
            BigDecimal totalRating = BigDecimal.ZERO;
            long ratingCount = 0;
            for (var response : responses) {
                for (var answer : response.getAnswers()) {
                    if (answer.getQuestion().getQuestionType() == QuestionType.LIKERT_1_5
                            && answer.getNumericValue() != null) {
                        totalRating = totalRating.add(answer.getNumericValue());
                        ratingCount++;
                    }
                }
            }
            if (ratingCount > 0) {
                averageRating = totalRating.divide(
                        BigDecimal.valueOf(ratingCount), 2, RoundingMode.HALF_UP);
            }
        }
        return new UserProfileDto(
                user.getUsername(), user.getEmail(), user.getRole(), user.getPoints(), feedbackCount, activity,
                gamesPublished, evaluationsReceived, averageRating, platformsTested);
    }

    @Transactional(readOnly = true)
    public List<LeaderboardEntryDto> getLeaderboard() {
        return userRepository.findTop10ByRoleOrderByPointsDescIdAsc(Role.TESTER).stream()
                .map(user -> new LeaderboardEntryDto(
                        user.getId(),
                        user.getUsername(),
                        user.getPoints(),
                        responseRepository.countByTesterId(user.getId()),
                        rankFor(user.getPoints())))
                .toList();
    }

    private String rankFor(Integer points) {
        int score = points == null ? 0 : points;
        if (score >= 300) {
            return "Leyenda Indie";
        }
        if (score >= 100) {
            return "Tester Frecuente";
        }
        return "Novato";
    }

    @Transactional(readOnly = true)
    public List<UserNotificationDto> getNotifications(String username) {
        User user = userRepository.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "No se encontró el usuario."));
        if (user.getRole() != Role.TESTER) {
            return List.of();
        }
        Map<Long, UserNotificationDto> notifications = new LinkedHashMap<>();
        responseRepository.findAllByTesterIdOrderBySubmittedAtDesc(user.getId()).forEach(response -> {
            var game = response.getForm().getGame();
            if (game.getStatus() == com.playtesting.platform.entity.GameStatus.EN_PLAYTESTING
                    && !"1.0".equals(game.getVersion())
                    && game.getVersionUpdatedAt() != null
                    && game.getVersionUpdatedAt().isAfter(response.getSubmittedAt())) {
                notifications.putIfAbsent(
                        game.getId(),
                        new UserNotificationDto(
                                game.getId(),
                                game.getTitle(),
                                game.getVersion(),
                                game.getStatus(),
                                game.getVersionUpdatedAt(),
                                game.getReleaseNotes()));
            }
        });
        return new ArrayList<>(notifications.values());
    }
}
