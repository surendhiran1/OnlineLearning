package com.edunova.repository;

import com.edunova.document.Submission;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SubmissionRepository extends MongoRepository<Submission, String> {
    List<Submission> findByUserIdAndQuizId(Long userId, Long quizId);
    List<Submission> findByUserIdAndAssignmentId(Long userId, Long assignmentId);
    List<Submission> findByAssignmentId(Long assignmentId);
    Optional<Submission> findByUserIdAndQuizIdAndAttempts(Long userId, Long quizId, Integer attempts);
}
