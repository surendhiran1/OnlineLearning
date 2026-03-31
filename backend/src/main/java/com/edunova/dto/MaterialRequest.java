package com.edunova.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class MaterialRequest {
    @NotBlank
    private String title;

    @NotBlank
    private String type;

    private String content;
    private String url;
    
    @NotNull
    private Integer orderIndex;
    
    private Integer duration;
}
