package com.edunova.service;

import com.edunova.dto.QuizRequest;
import com.edunova.dto.QuizResponse;
import com.edunova.exception.ResourceNotFoundException;
import com.edunova.model.Course;
import com.edunova.model.Quiz;
import com.edunova.repository.CourseRepository;
import com.edunova.repository.QuizRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class QuizService {

    private final QuizRepository quizRepository;
    private final CourseRepository courseRepository;

    public QuizResponse createQuiz(Long courseId, QuizRequest request) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", courseId));

        Quiz quiz = Quiz.builder()
                .course(course)
                .title(request.getTitle())
                .description(request.getDescription())
                .timeLimit(request.getTimeLimit())
                .passingScore(request.getPassingScore())
                .attemptsAllowed(request.getAttemptsAllowed() != null ? request.getAttemptsAllowed() : 1)
                .shuffleQuestions(request.getShuffleQuestions() != null ? request.getShuffleQuestions() : false)
                .showAnswers(Quiz.ShowAnswers.valueOf(request.getShowAnswers() != null ? request.getShowAnswers().toUpperCase() : "MANUAL"))
                .releaseDate(request.getReleaseDate())
                .deadline(request.getDeadline())
                .build();

        return mapToResponse(quizRepository.save(quiz));
    }

    public List<QuizResponse> getQuizzesByCourseId(Long courseId) {
        return quizRepository.findByCourseId(courseId)
                .stream().map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public QuizResponse getQuizById(Long id) {
        return mapToResponse(quizRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz", "id", id)));
    }

    private QuizResponse mapToResponse(Quiz quiz) {
        return QuizResponse.builder()
                .id(quiz.getId())
                .courseId(quiz.getCourse().getId())
                .title(quiz.getTitle())
                .description(quiz.getDescription())
                .timeLimit(quiz.getTimeLimit())
                .passingScore(quiz.getPassingScore())
                .attemptsAllowed(quiz.getAttemptsAllowed())
                .shuffleQuestions(quiz.getShuffleQuestions())
                .showAnswers(quiz.getShowAnswers().name())
                .releaseDate(quiz.getReleaseDate())
                .deadline(quiz.getDeadline())
                .build();
    }
}
