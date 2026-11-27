package com.playtesting.platform.service;

import com.playtesting.platform.dto.AnswerRequestDto;
import com.playtesting.platform.dto.FeedbackResponseDto;
import com.playtesting.platform.dto.FeedbackResponseDto.SubmittedAnswerDto;
import com.playtesting.platform.dto.FeedbackSummaryDto;
import com.playtesting.platform.dto.FeedbackSummaryDto.QuestionSummaryDto;
import com.playtesting.platform.dto.SubmitFeedbackRequestDto;
import com.playtesting.platform.entity.Answer;
import com.playtesting.platform.entity.Form;
import com.playtesting.platform.entity.GameStatus;
import com.playtesting.platform.entity.Question;
import com.playtesting.platform.entity.QuestionType;
import com.playtesting.platform.entity.Response;
import com.playtesting.platform.entity.Role;
import com.playtesting.platform.entity.User;
import com.playtesting.platform.repository.ResponseRepository;
import com.playtesting.platform.repository.GameRepository;
import com.playtesting.platform.repository.UserRepository;
import java.math.BigDecimal;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class FeedbackService {

    private final FormService formService;
    private final ResponseRepository responseRepository;
    private final UserRepository userRepository;
    private final GameRepository gameRepository;

    public FeedbackService(
            FormService formService,
            ResponseRepository responseRepository,
            UserRepository userRepository,
            GameRepository gameRepository) {
        this.formService = formService;
        this.responseRepository = responseRepository;
        this.userRepository = userRepository;
        this.gameRepository = gameRepository;
    }

    @Transactional
    public FeedbackResponseDto submit(SubmitFeedbackRequestDto request, String username) {
        User tester = userRepository.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "No se encontró el usuario."));
        if (tester.getRole() != Role.TESTER) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Solo los testers pueden enviar evaluaciones.");
        }
        userRepository.findByIdForUpdate(tester.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "No se encontró el usuario."));

        Form form = formService.findActiveEntity(request.formId());
        if (form.getGame().getStatus() != GameStatus.EN_PLAYTESTING) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Este juego no está recibiendo evaluaciones en este momento.");
        }
        String evaluatedVersion = form.getGame().getVersion();
        if (responseRepository.existsByTesterIdAndFormGameIdAndEvaluatedVersion(
                tester.getId(), form.getGame().getId(), evaluatedVersion)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Ya evaluaste la versión " + evaluatedVersion
                            + " de este prototipo. Podrás volver a evaluarlo cuando el creador publique una nueva versión.");
        }
        Set<Long> submittedQuestionIds = new HashSet<>();
        for (AnswerRequestDto answerRequest : request.answers()) {
            if (answerRequest.questionId() == null || !submittedQuestionIds.add(answerRequest.questionId())) {
                throw invalidAnswer("Cada pregunta puede responderse una sola vez.");
            }
            Question question = findQuestion(form, answerRequest.questionId());
            validateAnswer(question, answerRequest);
        }
        for (Question question : form.getQuestions()) {
            if (question.isRequired() && !submittedQuestionIds.contains(question.getId())) {
                throw invalidAnswer("Debes responder todas las preguntas obligatorias.");
            }
        }

        Response response = new Response();
        response.setForm(form);
        response.setTester(tester);
        response.setEvaluatedVersion(evaluatedVersion);
        for (AnswerRequestDto answerRequest : request.answers()) {
            Answer answer = new Answer();
            answer.setQuestion(findQuestion(form, answerRequest.questionId()));
            answer.setAnswerText(answerRequest.answerText());
            answer.setNumericValue(answerRequest.numericValue());
            response.addAnswer(answer);
        }
        FeedbackResponseDto feedback = toResponse(responseRepository.save(response));
        tester.addPoints(50);
        userRepository.save(tester);
        return feedback;
    }

    @Transactional(readOnly = true)
    public List<FeedbackResponseDto> findByGameId(Long gameId, String username) {
        verifyGameOwner(gameId, username);
        List<Response> responses = responseRepository.findAllByFormGameIdOrderBySubmittedAtDesc(gameId);
        if (responses.isEmpty()) {
            return List.of();
        }
        return responses.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public FeedbackSummaryDto summarizeByGameId(Long gameId, String username) {
        verifyGameOwner(gameId, username);
        List<Response> responses = responseRepository.findAllByFormGameIdOrderBySubmittedAtDesc(gameId);
        Map<Long, QuestionAccumulator> accumulators = new LinkedHashMap<>();
        BigDecimal likertTotal = BigDecimal.ZERO;
        long likertCount = 0;
        BigDecimal numericTotal = BigDecimal.ZERO;
        long numericCount = 0;

        for (Response response : responses) {
            for (Answer answer : response.getAnswers()) {
                Question question = answer.getQuestion();
                QuestionAccumulator accumulator = accumulators.computeIfAbsent(
                        question.getId(), ignored -> new QuestionAccumulator(question));
                if (question.getQuestionType() == QuestionType.TEXT) {
                    if (answer.getAnswerText() != null && !answer.getAnswerText().isBlank()) {
                        accumulator.comments.add(answer.getAnswerText());
                    }
                } else if (answer.getNumericValue() != null) {
                    accumulator.total = accumulator.total.add(answer.getNumericValue());
                    accumulator.count++;
                    if (question.getQuestionType() == QuestionType.LIKERT_1_5) {
                        likertTotal = likertTotal.add(answer.getNumericValue());
                        likertCount++;
                    } else if (question.getQuestionType() == QuestionType.NUMERIC) {
                        numericTotal = numericTotal.add(answer.getNumericValue());
                        numericCount++;
                    }
                }
            }
        }

        List<QuestionSummaryDto> questionSummaries = accumulators.values().stream()
                .map(QuestionAccumulator::toSummary)
                .toList();
        return new FeedbackSummaryDto(
                responses.size(),
                average(likertTotal, likertCount),
                likertCount,
                average(numericTotal, numericCount),
                questionSummaries);
    }

    private void verifyGameOwner(Long gameId, String username) {
        var game = gameRepository.findById(gameId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No se encontró el juego solicitado."));
        if (!game.getCreator().getUsername().equalsIgnoreCase(username)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Solo el creador del juego puede consultar estas evaluaciones.");
        }
    }

    private BigDecimal average(BigDecimal total, long count) {
        return count == 0 ? null : total.divide(BigDecimal.valueOf(count), 2, java.math.RoundingMode.HALF_UP);
    }

    private static final class QuestionAccumulator {
        private final Question question;
        private final List<String> comments = new ArrayList<>();
        private BigDecimal total = BigDecimal.ZERO;
        private long count;

        private QuestionAccumulator(Question question) {
            this.question = question;
        }

        private QuestionSummaryDto toSummary() {
            BigDecimal average = count == 0
                    ? null
                    : total.divide(BigDecimal.valueOf(count), 2, java.math.RoundingMode.HALF_UP);
            return new QuestionSummaryDto(
                    question.getId(),
                    question.getQuestionText(),
                    question.getQuestionType(),
                    average,
                    List.copyOf(comments));
        }
    }

    private Question findQuestion(Form form, Long questionId) {
        return form.getQuestions().stream()
                .filter(question -> question.getId().equals(questionId))
                .findFirst()
                .orElseThrow(() -> invalidAnswer("La pregunta indicada no pertenece a este formulario."));
    }

    private void validateAnswer(Question question, AnswerRequestDto answer) {
        String text = answer.answerText();
        BigDecimal numeric = answer.numericValue();
        if (question.getQuestionType() == QuestionType.TEXT && (text == null || text.isBlank() || numeric != null)) {
            throw invalidAnswer("La pregunta de texto requiere únicamente una respuesta escrita.");
        }
        if (question.getQuestionType() == QuestionType.NUMERIC && (numeric == null || text != null)) {
            throw invalidAnswer("La pregunta numérica requiere únicamente un valor numérico.");
        }
        if (question.getQuestionType() == QuestionType.LIKERT_1_5
                && (numeric == null
                        || text != null
                        || numeric.stripTrailingZeros().scale() > 0
                        || numeric.compareTo(BigDecimal.ONE) < 0
                        || numeric.compareTo(BigDecimal.valueOf(5)) > 0)) {
            throw invalidAnswer("La calificación debe ser un número entero entre 1 y 5.");
        }
    }

    private ResponseStatusException invalidAnswer(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }

    private FeedbackResponseDto toResponse(Response response) {
        List<SubmittedAnswerDto> answers = response.getAnswers().stream()
                .map(answer -> new SubmittedAnswerDto(
                        answer.getQuestion().getId(),
                        answer.getQuestion().getQuestionText(),
                        answer.getAnswerText(),
                        answer.getNumericValue()))
                .toList();
        return new FeedbackResponseDto(
                response.getId(),
                response.getForm().getId(),
                response.getTester().getUsername(),
                response.getSubmittedAt(),
                answers);
    }
}
