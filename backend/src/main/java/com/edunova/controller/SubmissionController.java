package com.edunova.controller;

import com.edunova.dto.QuizSubmissionRequest;
import com.edunova.dto.SubmissionResponse;
import com.edunova.security.UserPrincipal;
import com.edunova.service.SubmissionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/quizzes/{quizId}/submissions")
@RequiredArgsConstructor
public class SubmissionController {

    private final SubmissionService submissionService;

    @PostMapping
    public ResponseEntity<SubmissionResponse> submitQuiz(
            @PathVariable Long quizId,
            @Valid @RequestBody QuizSubmissionRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return new ResponseEntity<>(submissionService.submitQuiz(currentUser.getUser(), quizId, request), HttpStatus.CREATED);
    }
}
