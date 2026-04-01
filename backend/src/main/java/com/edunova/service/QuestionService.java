package com.edunova.service;

import com.edunova.dto.QuestionRequest;
import com.edunova.dto.QuestionResponse;
import com.edunova.exception.ResourceNotFoundException;
import com.edunova.model.Question;
import com.edunova.model.Quiz;
import com.edunova.repository.QuestionRepository;
import com.edunova.repository.QuizRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class QuestionService {

    private final QuestionRepository questionRepository;
    private final QuizRepository quizRepository;

    public QuestionResponse addQuestion(Long quizId, QuestionRequest request) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz", "id", quizId));

        Question question = Question.builder()
                .quiz(quiz)
                .type(Question.Type.valueOf(request.getType().toUpperCase()))
                .text(request.getText())
                .options(request.getOptions())
                .correctAnswer(request.getCorrectAnswer())
                .explanation(request.getExplanation())
                .testCases(request.getTestCases())
                .codeBoilerplate(request.getCodeBoilerplate())
                .points(request.getPoints())
                .orderIndex(request.getOrderIndex())
                .build();

        return mapToResponse(questionRepository.save(question));
    }

    public List<QuestionResponse> getQuestionsByQuizId(Long quizId) {
        return questionRepository.findByQuiz_IdOrderByOrderIndexAsc(quizId)
                .stream().map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public boolean hasCodingQuestions(Long quizId) {
        return questionRepository.existsByQuiz_IdAndType(quizId, Question.Type.CODE);
    }

    private QuestionResponse mapToResponse(Question q) {
        return QuestionResponse.builder()
                .id(q.getId())
                .quizId(q.getQuiz().getId())
                .type(q.getType().name())
                .text(q.getText())
                .options(q.getOptions())
                .correctAnswer(q.getCorrectAnswer())
                .explanation(q.getExplanation())
                .testCases(q.getTestCases())
                .codeBoilerplate(q.getCodeBoilerplate())
                .points(q.getPoints())
                .orderIndex(q.getOrderIndex())
                .build();
    }
}
