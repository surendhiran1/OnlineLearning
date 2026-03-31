package com.edunova.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ModuleRequest {
    @NotBlank
    private String title;
    
    private String description;
    
    @NotNull
    private Integer orderIndex;
}
