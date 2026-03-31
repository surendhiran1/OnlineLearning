package com.edunova.repository;

import com.edunova.model.Course;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CourseRepository extends JpaRepository<Course, Long> {
    Page<Course> findByStatus(Course.Status status, Pageable pageable);
    Page<Course> findByInstructorId(Long instructorId, Pageable pageable);
}
