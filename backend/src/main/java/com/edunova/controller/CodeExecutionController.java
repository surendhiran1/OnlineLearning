package com.edunova.controller;

import com.edunova.service.CodeExecutionService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/execute")
@RequiredArgsConstructor
public class CodeExecutionController {

    private final CodeExecutionService codeExecutionService;

    @PostMapping
    @PreAuthorize("hasRole('STUDENT') or hasRole('STAFF')")
    public ResponseEntity<ExecutionResponse> executeCode(@RequestBody ExecutionRequest req) {
        long startTime = System.currentTimeMillis();
        CodeExecutionService.ExecutionResult result = codeExecutionService.execute(req.language, req.code, req.input);
        
        ExecutionResponse res = new ExecutionResponse();
        res.setOutput(result.getOutput());
        res.setError(result.getError());
        res.setExecutionTime((System.currentTimeMillis() - startTime) / 1000.0);
        
        return ResponseEntity.ok(res);
    }

    @Data
    public static class ExecutionRequest {
        private String language;
        private String code;
        private String input;
    }

    @Data
    public static class ExecutionResponse {
        private String output;
        private String error;
        private Double executionTime;
    }
}
