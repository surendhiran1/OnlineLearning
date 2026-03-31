package com.edunova.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CourseRequest {
    @NotBlank
    private String title;
    private String subtitle;
    private String description;
    private String thumbnailUrl;
    private String syllabus;
    private String learningObjectives;
    
    @NotBlank
    private String category;
    
    @NotNull
    private Integer estimatedDuration;
}
