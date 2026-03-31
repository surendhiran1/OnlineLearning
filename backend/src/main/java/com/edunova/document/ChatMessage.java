package com.edunova.document;

import lombok.Builder;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.Date;
import java.util.List;

@Data
@Builder
@Document(collection = "chat_messages")
public class ChatMessage {
    @Id
    private String id;
    private Long courseId;
    private String streamId;
    private Long userId;
    private String userName;
    private String message;
    private String type;
    private List<String> attachments;
    private List<Object> reactions;
    private List<Long> mentions;
    private Date createdAt;
}
