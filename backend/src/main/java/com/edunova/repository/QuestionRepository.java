package com.edunova.repository;

import com.edunova.model.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestionRepository extends JpaRepository<Question, Long> {
    List<Question> findByQuiz_IdOrderByOrderIndexAsc(Long quizId);
    boolean existsByQuiz_IdAndType(Long quizId, com.edunova.model.Question.Type type);
}
