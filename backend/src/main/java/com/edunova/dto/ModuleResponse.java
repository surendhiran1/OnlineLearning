package com.edunova.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ModuleResponse {
    private Long id;
    private Long courseId;
    private String title;
    private String description;
    private Integer orderIndex;
    private Boolean isPublished;
}
