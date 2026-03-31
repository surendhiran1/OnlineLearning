package com.edunova.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class QuizResponse {
    private Long id;
    private Long courseId;
    private String title;
    private String description;
    private Integer timeLimit;
    private Double passingScore;
    private Integer attemptsAllowed;
    private Boolean shuffleQuestions;
    private String showAnswers;
    private LocalDateTime releaseDate;
    private LocalDateTime deadline;
}
