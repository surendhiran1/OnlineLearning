package com.edunova.controller;

import com.edunova.dto.AssignmentRequest;
import com.edunova.dto.AssignmentResponse;
import com.edunova.service.AssignmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/courses/{courseId}/assignments")
@RequiredArgsConstructor
public class AssignmentController {

    private final AssignmentService assignmentService;

    @PostMapping
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<AssignmentResponse> createAssignment(
            @PathVariable Long courseId,
            @Valid @RequestBody AssignmentRequest request) {
        return new ResponseEntity<>(assignmentService.createAssignment(courseId, request), HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<AssignmentResponse>> getCourseAssignments(@PathVariable Long courseId) {
        return ResponseEntity.ok(assignmentService.getAssignmentsByCourseId(courseId));
    }
}
