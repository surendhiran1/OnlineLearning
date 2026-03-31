package com.edunova.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class QuestionResponse {
    private Long id;
    private Long quizId;
    private String type;
    private String text;
    private String options;
    private String correctAnswer;
    private String explanation;
    private Integer points;
    private Integer orderIndex;
}
