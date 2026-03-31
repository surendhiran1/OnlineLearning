package com.edunova.controller;

import com.edunova.document.Submission;
import com.edunova.repository.SubmissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
public class ReportController {

    private final SubmissionRepository submissionRepository;
    private final com.edunova.repository.AssignmentRepository assignmentRepository;
    private final com.edunova.repository.QuizRepository quizRepository;

    @GetMapping("/submissions")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<List<Submission>> getAllSubmissions() {
        return ResponseEntity.ok(submissionRepository.findAll());
    }

    @GetMapping("/assignments")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<List<com.edunova.model.Assignment>> getAllAssignments() {
        return ResponseEntity.ok(assignmentRepository.findAll());
    }

    @GetMapping("/quizzes")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<List<com.edunova.model.Quiz>> getAllQuizzes() {
        return ResponseEntity.ok(quizRepository.findAll());
    }
}
