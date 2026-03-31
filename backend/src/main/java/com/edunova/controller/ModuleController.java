package com.edunova.controller;

import com.edunova.dto.ModuleRequest;
import com.edunova.dto.ModuleResponse;
import com.edunova.service.ModuleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/courses/{courseId}/modules")
@RequiredArgsConstructor
public class ModuleController {

    private final ModuleService moduleService;

    @PostMapping
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<ModuleResponse> createModule(
            @PathVariable Long courseId,
            @Valid @RequestBody ModuleRequest request) {
        return new ResponseEntity<>(moduleService.createModule(courseId, request), HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<ModuleResponse>> getCourseModules(@PathVariable Long courseId) {
        return ResponseEntity.ok(moduleService.getModulesByCourseId(courseId));
    }

    @PutMapping("/{moduleId}")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<ModuleResponse> updateModule(
            @PathVariable Long courseId,
            @PathVariable Long moduleId,
            @Valid @RequestBody ModuleRequest request) {
        return ResponseEntity.ok(moduleService.updateModule(moduleId, request));
    }

    @DeleteMapping("/{moduleId}")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<Void> deleteModule(
            @PathVariable Long courseId, 
            @PathVariable Long moduleId) {
        moduleService.deleteModule(moduleId);
        return ResponseEntity.noContent().build();
    }
}
