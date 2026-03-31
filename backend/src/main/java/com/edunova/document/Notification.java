package com.edunova.document;

import lombok.Builder;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.Date;
import java.util.Map;

@Data
@Builder
@Document(collection = "notifications")
public class Notification {
    @Id
    private String id;
    private Long userId;
    private String type;
    private String title;
    private String content;
    private Map<String, Object> data;
    private Boolean isRead;
    private Date createdAt;
    private Date expiresAt;
}
