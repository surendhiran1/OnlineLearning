package com.edunova.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.List;
import java.util.Date;

@Data
public class QuizSubmissionRequest {
    @NotNull
    private List<Object> answers;
    private Date startedAt;
    private Date submittedAt;
    private Integer timeSpent;
}
