package com.edunova.document;

import lombok.Builder;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.Date;

@Data
@Builder
@Document(collection = "notes")
public class Note {
    @Id
    private String id;
    private Long userId;
    private Long materialId;
    private String content;
    private Long timestamp;
    private Boolean isPublic;
    private Integer upvotes;
    private Date createdAt;
    private Date updatedAt;
}
