package com.edunova.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class AssignmentResponse {
    private Long id;
    private Long courseId;
    private String title;
    private String description;
    private Integer points;
    private LocalDateTime dueDate;
    private String submissionType;
    private String rubric;
    private String testCases;
    private String codeBoilerplate;
    private String language;
    private Boolean plagiarismCheck;
}
