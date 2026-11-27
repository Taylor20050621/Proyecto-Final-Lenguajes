package com.playtesting.platform.service;

import com.playtesting.platform.dto.CreateFormRequestDto;
import com.playtesting.platform.dto.FormResponseDto;
import com.playtesting.platform.dto.QuestionResponseDto;
import com.playtesting.platform.entity.Form;
import com.playtesting.platform.entity.Game;
import com.playtesting.platform.entity.Question;
import com.playtesting.platform.repository.FormRepository;
import com.playtesting.platform.repository.GameRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class FormService {

    private final FormRepository formRepository;
    private final GameRepository gameRepository;

    public FormService(FormRepository formRepository, GameRepository gameRepository) {
        this.formRepository = formRepository;
        this.gameRepository = gameRepository;
    }

    @Transactional
    public FormResponseDto create(Long gameId, CreateFormRequestDto request, String username) {
        Game game = findGame(gameId);
        if (!game.getCreator().getUsername().equalsIgnoreCase(username)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Solo el creador del juego puede crear formularios.");
        }

        Form form = new Form();
        form.setGame(game);
        form.setTitle(request.title().trim());
        form.setDescription(request.description());
        request.questions().forEach(questionRequest -> {
            Question question = new Question();
            question.setQuestionText(questionRequest.questionText().trim());
            question.setQuestionType(questionRequest.questionType());
            question.setRequired(questionRequest.required());
            form.addQuestion(question);
        });
        return toResponse(formRepository.save(form));
    }

    @Transactional(readOnly = true)
    public FormResponseDto findActiveByGameId(Long gameId) {
        return toResponse(formRepository.findByGameIdAndActiveTrue(gameId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No se encontró un formulario activo.")));
    }

    @Transactional(readOnly = true)
    public Form findActiveEntity(Long formId) {
        return formRepository.findById(formId)
                .filter(Form::isActive)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No se encontró un formulario activo."));
    }

    private Game findGame(Long gameId) {
        return gameRepository.findById(gameId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No se encontró el juego solicitado."));
    }

    private FormResponseDto toResponse(Form form) {
        List<QuestionResponseDto> questions = form.getQuestions().stream()
                .map(question -> new QuestionResponseDto(
                        question.getId(),
                        question.getQuestionText(),
                        question.getQuestionType(),
                        question.isRequired()))
                .toList();
        return new FormResponseDto(
                form.getId(),
                form.getGame().getId(),
                form.getTitle(),
                form.getDescription(),
                questions);
    }
}
