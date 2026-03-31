package com.edunova.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CourseResponse {
    private Long id;
    private Long instructorId;
    private String title;
    private String subtitle;
    private String description;
    private String thumbnailUrl;
    private String syllabus;
    private String learningObjectives;
    private String status;
    private String category;
    private Integer estimatedDuration;
}
