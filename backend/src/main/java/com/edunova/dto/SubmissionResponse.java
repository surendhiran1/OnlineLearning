package com.edunova.dto;

import lombok.Builder;
import lombok.Data;
import java.util.Date;
import java.util.List;

@Data
@Builder
public class SubmissionResponse {
    private String id;
    private Long userId;
    private String fullName;
    private Long quizId;
    private Long assignmentId;
    private List<Object> answers;
    private Double score;
    private Double grade;
    private String feedback;
    private String status;
    private Integer xpAwarded;
    private Date submittedAt;
    private Integer attempts;
    private java.util.Map<String, Object> metadata;
}
