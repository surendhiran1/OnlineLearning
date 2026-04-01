package com.edunova.service;

import com.edunova.dto.CourseRequest;
import com.edunova.dto.CourseResponse;
import com.edunova.exception.ResourceNotFoundException;
import com.edunova.model.Course;
import com.edunova.model.User;
import com.edunova.repository.CourseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class CourseService {

    private final CourseRepository courseRepository;

    public CourseResponse createCourse(CourseRequest request, User instructor) {
        Course course = Course.builder()
                .title(request.getTitle())
                .subtitle(request.getSubtitle())
                .description(request.getDescription())
                .thumbnailUrl(request.getThumbnailUrl())
                .syllabus(request.getSyllabus())
                .learningObjectives(request.getLearningObjectives())
                .category(request.getCategory())
                .estimatedDuration(request.getEstimatedDuration())
                .instructor(instructor)
                .status(Course.Status.PUBLISHED)
                .enrollmentType(Course.EnrollmentType.OPEN)
                .build();
        
        return mapToResponse(courseRepository.save(course));
    }

    public Page<CourseResponse> getAllPublishedCourses(Pageable pageable) {
        return courseRepository.findByStatus(Course.Status.PUBLISHED, pageable)
                .map(this::mapToResponse);
    }

    public CourseResponse getCourseById(Long id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", id));
        return mapToResponse(course);
    }

    public CourseResponse updateCourse(Long id, CourseRequest request) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", id));
        
        course.setTitle(request.getTitle());
        course.setSubtitle(request.getSubtitle());
        course.setDescription(request.getDescription());
        course.setThumbnailUrl(request.getThumbnailUrl());
        course.setSyllabus(request.getSyllabus());
        course.setLearningObjectives(request.getLearningObjectives());
        course.setCategory(request.getCategory());
        course.setEstimatedDuration(request.getEstimatedDuration());

        return mapToResponse(courseRepository.save(course));
    }

    public void deleteCourse(Long id) {
        if (!courseRepository.existsById(id)) {
            throw new ResourceNotFoundException("Course", "id", id);
        }
        courseRepository.deleteById(id);
    }

    private CourseResponse mapToResponse(Course course) {
        return CourseResponse.builder()
                .id(course.getId())
                .instructorId(course.getInstructor().getId())
                .title(course.getTitle())
                .subtitle(course.getSubtitle())
                .description(course.getDescription())
                .thumbnailUrl(course.getThumbnailUrl())
                .syllabus(course.getSyllabus())
                .learningObjectives(course.getLearningObjectives())
                .status(course.getStatus().name())
                .category(course.getCategory())
                .estimatedDuration(course.getEstimatedDuration())
                .build();
    }
}
