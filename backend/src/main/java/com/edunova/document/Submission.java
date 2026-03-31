package com.edunova.document;

import lombok.Builder;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.Date;
import java.util.List;
import java.util.Map;

@Data
@Builder
@Document(collection = "submissions")
public class Submission {
    @Id
    private String id;
    private Long userId;
    private Long quizId;
    private Long assignmentId;
    private List<Object> answers;
    private Double score;
    private Double grade;
    private String feedback;
    private Date startedAt;
    private Date submittedAt;
    private Integer timeSpent;
    private Integer attempts;
    private String ipAddress;
    private String status;
    private Map<String, Object> metadata;
}
