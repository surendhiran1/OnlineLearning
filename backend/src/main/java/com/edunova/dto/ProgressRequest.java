package com.edunova.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ProgressRequest {
    @NotNull
    private Boolean isCompleted;
    private Integer timeSpent;
    private Double lastPosition;
}
