package com.edunova.controller;

import com.edunova.dto.SubmissionResponse;
import com.edunova.security.UserPrincipal;
import com.edunova.service.SubmissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import java.util.List;
import java.io.IOException;

@RestController
@RequestMapping("/api/v1/assignments/{assignmentId}/submissions")
@RequiredArgsConstructor
public class AssignmentSubmissionController {
    
    private final SubmissionService submissionService;
    private final com.edunova.service.FileStorageService fileStorageService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<SubmissionResponse> submitAssignment(
            @PathVariable Long assignmentId,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return new ResponseEntity<>(submissionService.submitAssignment(currentUser.getUser(), assignmentId, file), HttpStatus.CREATED);
    }

    @GetMapping
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<List<SubmissionResponse>> getSubmissions(@PathVariable Long assignmentId) {
        return ResponseEntity.ok(submissionService.getSubmissionsByAssignmentId(assignmentId));
    }

    @GetMapping("/me")
    public ResponseEntity<SubmissionResponse> getMySubmission(
            @PathVariable Long assignmentId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(submissionService.getStudentSubmission(currentUser.getUser().getId(), assignmentId));
    }

    @PutMapping("/{submissionId}/grade")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<SubmissionResponse> gradeSubmission(
            @PathVariable Long assignmentId,
            @PathVariable String submissionId,
            @RequestBody GradeRequest request) {
        return ResponseEntity.ok(submissionService.gradeSubmission(submissionId, request.xpAwarded(), request.feedback()));
    }

    public record GradeRequest(Integer xpAwarded, String feedback) {}

    @GetMapping("/download/{fileName:.+}")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<org.springframework.core.io.Resource> downloadFile(
            @PathVariable String fileName, 
            @RequestParam(value = "orig", required = false) String originalName,
            jakarta.servlet.http.HttpServletRequest request) {
        
        org.springframework.core.io.Resource resource = fileStorageService.loadFileAsResource(fileName);
        String contentType = null;
        try {
            contentType = request.getServletContext().getMimeType(resource.getFile().getAbsolutePath());
        } catch (IOException ex) {
            contentType = "application/octet-stream";
        }

        if(contentType == null) {
            contentType = "application/octet-stream";
        }

        String finalFileName = (originalName != null && !originalName.isEmpty()) ? originalName : resource.getFilename();

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + finalFileName + "\"")
                .body(resource);
    }
}
