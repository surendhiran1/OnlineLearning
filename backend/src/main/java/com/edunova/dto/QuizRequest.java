package com.edunova.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class QuizRequest {
    @NotBlank
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
