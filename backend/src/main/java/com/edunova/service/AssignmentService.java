package com.edunova.service;

import com.edunova.dto.AssignmentRequest;
import com.edunova.dto.AssignmentResponse;
import com.edunova.exception.ResourceNotFoundException;
import com.edunova.model.Assignment;
import com.edunova.model.Course;
import com.edunova.repository.AssignmentRepository;
import com.edunova.repository.CourseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AssignmentService {

    private final AssignmentRepository assignmentRepository;
    private final CourseRepository courseRepository;

    public AssignmentResponse createAssignment(Long courseId, AssignmentRequest request) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", courseId));

        Assignment assignment = Assignment.builder()
                .course(course)
                .title(request.getTitle())
                .description(request.getDescription())
                .points(request.getPoints())
                .dueDate(request.getDueDate())
                .submissionType(Assignment.SubmissionType.valueOf(request.getSubmissionType().toUpperCase()))
                .rubric(request.getRubric())
                .plagiarismCheck(request.getPlagiarismCheck())
                .build();

        return mapToResponse(assignmentRepository.save(assignment));
    }

    public List<AssignmentResponse> getAssignmentsByCourseId(Long courseId) {
        return assignmentRepository.findByCourseId(courseId)
                .stream().map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private AssignmentResponse mapToResponse(Assignment a) {
        return AssignmentResponse.builder()
                .id(a.getId())
                .courseId(a.getCourse().getId())
                .title(a.getTitle())
                .description(a.getDescription())
                .points(a.getPoints())
                .dueDate(a.getDueDate())
                .submissionType(a.getSubmissionType().name())
                .rubric(a.getRubric())
                .plagiarismCheck(a.getPlagiarismCheck())
                .build();
    }
}
