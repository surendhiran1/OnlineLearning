package com.edunova.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class QuestionRequest {
    @NotBlank
    private String type;
    
    @NotBlank
    private String text;
    
    private String options;
    private String correctAnswer;
    private String explanation;
    
    @NotNull
    private Integer points;
    
    @NotNull
    private Integer orderIndex;
}
