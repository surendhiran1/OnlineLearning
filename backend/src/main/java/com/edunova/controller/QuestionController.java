package com.edunova.controller;

import com.edunova.dto.QuestionRequest;
import com.edunova.dto.QuestionResponse;
import com.edunova.service.QuestionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/quizzes/{quizId}/questions")
@RequiredArgsConstructor
public class QuestionController {

    private final QuestionService questionService;

    @PostMapping
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<QuestionResponse> addQuestion(
            @PathVariable Long quizId,
            @Valid @RequestBody QuestionRequest request) {
        return new ResponseEntity<>(questionService.addQuestion(quizId, request), HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<QuestionResponse>> getQuizQuestions(@PathVariable Long quizId) {
        return ResponseEntity.ok(questionService.getQuestionsByQuizId(quizId));
    }
}
