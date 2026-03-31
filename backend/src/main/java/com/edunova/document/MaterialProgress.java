package com.edunova.document;

import lombok.Builder;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.Date;

@Data
@Builder
@Document(collection = "material_progress")
public class MaterialProgress {
    @Id
    private String id;
    private Long userId;
    private Long materialId;
    private Boolean isCompleted;
    private Double progress;
    private Integer timeSpent;
    private Double lastPosition;
    private Date completedAt;
    private Date updatedAt;
}
