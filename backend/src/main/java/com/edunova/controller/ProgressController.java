package com.edunova.controller;

import com.edunova.document.MaterialProgress;
import com.edunova.dto.ProgressRequest;
import com.edunova.security.UserPrincipal;
import com.edunova.service.ProgressService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/progress")
@RequiredArgsConstructor
public class ProgressController {

    private final ProgressService progressService;

    @PostMapping("/materials/{materialId}")
    public ResponseEntity<Void> trackProgress(
            @PathVariable Long materialId,
            @Valid @RequestBody ProgressRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        progressService.trackProgress(currentUser.getUser(), materialId, request);
        return ResponseEntity.ok().build();
    }

    @GetMapping
    public ResponseEntity<List<MaterialProgress>> getMyProgress(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(progressService.getUserProgress(currentUser.getUser()));
    }
}
