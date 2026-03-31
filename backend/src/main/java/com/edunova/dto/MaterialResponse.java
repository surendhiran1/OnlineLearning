package com.edunova.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MaterialResponse {
    private Long id;
    private Long moduleId;
    private String title;
    private String type;
    private String content;
    private String url;
    private Integer orderIndex;
    private Integer duration;
    private String filePath;
    private Long fileSize;
}
