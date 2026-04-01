package com.edunova.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class AssignmentRequest {
    @NotBlank
    private String title;
    private String description;
    private Integer points;
    private LocalDateTime dueDate;
    
    @NotBlank
    private String submissionType;
    
    private String rubric;
    private String testCases;
    private String codeBoilerplate;
    private String language;
    private Boolean plagiarismCheck;
}
