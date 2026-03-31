package com.edunova.dto;

import lombok.Data;
import java.util.List;

@Data
public class ChatMessageRequest {
    private Long courseId;
    private String streamId;
    private String message;
    private String type;
    private List<String> attachments;
}
