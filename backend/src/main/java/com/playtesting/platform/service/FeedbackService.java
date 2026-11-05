package com.playtesting.platform.service;

import com.playtesting.platform.dto.AnswerRequestDto;
import com.playtesting.platform.dto.FeedbackResponseDto;
import com.playtesting.platform.dto.FeedbackResponseDto.SubmittedAnswerDto;
import com.playtesting.platform.dto.SubmitFeedbackRequestDto;
import com.playtesting.platform.entity.Answer;
import com.playtesting.platform.entity.Form;
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
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
        if (tester.getRole() != Role.TESTER) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only testers can submit feedback");
        }

        Form form = formService.findActiveEntity(request.formId());
        Set<Long> submittedQuestionIds = new HashSet<>();
        for (AnswerRequestDto answerRequest : request.answers()) {
            if (answerRequest.questionId() == null || !submittedQuestionIds.add(answerRequest.questionId())) {
                throw invalidAnswer("Each question must be answered at most once");
            }
            Question question = findQuestion(form, answerRequest.questionId());
            validateAnswer(question, answerRequest);
        }
        for (Question question : form.getQuestions()) {
            if (question.isRequired() && !submittedQuestionIds.contains(question.getId())) {
                throw invalidAnswer("All required questions must be answered");
            }
        }

        Response response = new Response();
        response.setForm(form);
        response.setTester(tester);
        for (AnswerRequestDto answerRequest : request.answers()) {
            Answer answer = new Answer();
            answer.setQuestion(findQuestion(form, answerRequest.questionId()));
            answer.setAnswerText(answerRequest.answerText());
            answer.setNumericValue(answerRequest.numericValue());
            response.addAnswer(answer);
        }
        return toResponse(responseRepository.save(response));
    }

    @Transactional(readOnly = true)
    public List<FeedbackResponseDto> findByGameId(Long gameId, String username) {
        var game = gameRepository.findById(gameId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Game not found"));
        if (!game.getCreator().getUsername().equalsIgnoreCase(username)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the game creator can view feedback");
        }
        List<Response> responses = responseRepository.findAllByFormGameIdOrderBySubmittedAtDesc(gameId);
        if (responses.isEmpty()) {
            return List.of();
        }
        return responses.stream().map(this::toResponse).toList();
    }

    private Question findQuestion(Form form, Long questionId) {
        return form.getQuestions().stream()
                .filter(question -> question.getId().equals(questionId))
                .findFirst()
                .orElseThrow(() -> invalidAnswer("Question does not belong to the form"));
    }

    private void validateAnswer(Question question, AnswerRequestDto answer) {
        String text = answer.answerText();
        BigDecimal numeric = answer.numericValue();
        if (question.getQuestionType() == QuestionType.TEXT && (text == null || text.isBlank() || numeric != null)) {
            throw invalidAnswer("Text questions require answerText only");
        }
        if (question.getQuestionType() == QuestionType.NUMERIC && (numeric == null || text != null)) {
            throw invalidAnswer("Numeric questions require numericValue only");
        }
        if (question.getQuestionType() == QuestionType.LIKERT_1_5
                && (numeric == null
                        || text != null
                        || numeric.stripTrailingZeros().scale() > 0
                        || numeric.compareTo(BigDecimal.ONE) < 0
                        || numeric.compareTo(BigDecimal.valueOf(5)) > 0)) {
            throw invalidAnswer("Likert answers must be whole numbers from 1 to 5");
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
