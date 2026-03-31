package com.edunova.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;

@Entity
@Table(name = "enrollments", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "course_id"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Enrollment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @Column(name = "enrolled_at", updatable = false)
    private LocalDateTime enrolledAt;

    @Column(name = "progress_percentage")
    @Builder.Default
    private Double progressPercentage = 0.0;

    @Column(name = "last_accessed")
    private LocalDateTime lastAccessed;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "certificate_url", columnDefinition = "TEXT")
    private String certificateUrl;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Status status = Status.ACTIVE;

    @PrePersist
    protected void onCreate() {
        enrolledAt = LocalDateTime.now();
    }
    
    public enum Status {
        ACTIVE, DROPPED, COMPLETED
    }
}
