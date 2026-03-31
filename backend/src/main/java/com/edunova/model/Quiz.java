package com.edunova.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;

@Entity
@Table(name = "quizzes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Quiz {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "time_limit")
    private Integer timeLimit;

    @Column(name = "passing_score")
    private Double passingScore;

    @Column(name = "attempts_allowed")
    @Builder.Default
    private Integer attemptsAllowed = 1;

    @Column(name = "shuffle_questions")
    @Builder.Default
    private Boolean shuffleQuestions = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "show_answers")
    @Builder.Default
    private ShowAnswers showAnswers = ShowAnswers.MANUAL;

    @Column(name = "release_date")
    private LocalDateTime releaseDate;

    private LocalDateTime deadline;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
    
    public enum ShowAnswers {
        IMMEDIATE, AFTER_DEADLINE, MANUAL
    }
}
