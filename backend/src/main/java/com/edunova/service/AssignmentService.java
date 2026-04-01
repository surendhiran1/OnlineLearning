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
@SuppressWarnings("null")
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
                .testCases(request.getTestCases())
                .codeBoilerplate(request.getCodeBoilerplate())
                .language(request.getLanguage())
                .plagiarismCheck(request.getPlagiarismCheck())
                .build();

        return mapToResponse(assignmentRepository.save(assignment));
    }

    public List<AssignmentResponse> getAssignmentsByCourseId(Long courseId) {
        return assignmentRepository.findByCourseId(courseId)
                .stream().map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public AssignmentResponse getAssignmentById(Long id) {
        return assignmentRepository.findById(id)
                .map(this::mapToResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment", "id", id));
    }

    public List<AssignmentResponse> getAllAssignments() {
        return assignmentRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private AssignmentResponse mapToResponse(Assignment a) {
        Long courseId = a.getCourse() != null ? a.getCourse().getId() : null;
        return AssignmentResponse.builder()
                .id(a.getId())
                .courseId(courseId)
                .title(a.getTitle())
                .description(a.getDescription())
                .points(a.getPoints())
                .dueDate(a.getDueDate())
                .submissionType(a.getSubmissionType().name())
                .rubric(a.getRubric())
                .testCases(a.getTestCases())
                .codeBoilerplate(a.getCodeBoilerplate())
                .language(a.getLanguage())
                .plagiarismCheck(a.getPlagiarismCheck())
                .build();
    }
}
