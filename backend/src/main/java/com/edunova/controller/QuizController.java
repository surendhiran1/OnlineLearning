package com.edunova.controller;

import com.edunova.dto.QuizRequest;
import com.edunova.dto.QuizResponse;
import com.edunova.service.QuizService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/courses/{courseId}/quizzes")
@RequiredArgsConstructor
public class QuizController {

    private final QuizService quizService;

    @PostMapping
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<QuizResponse> createQuiz(
            @PathVariable Long courseId,
            @Valid @RequestBody QuizRequest request) {
        return new ResponseEntity<>(quizService.createQuiz(courseId, request), HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<QuizResponse>> getCourseQuizzes(@PathVariable Long courseId) {
        return ResponseEntity.ok(quizService.getQuizzesByCourseId(courseId));
    }

    @GetMapping("/{quizId}")
    public ResponseEntity<QuizResponse> getQuiz(@PathVariable Long courseId, @PathVariable Long quizId) {
        return ResponseEntity.ok(quizService.getQuizById(quizId));
    }
}
