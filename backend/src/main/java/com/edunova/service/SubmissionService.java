package com.edunova.service;

import com.edunova.document.Submission;
import com.edunova.dto.QuizSubmissionRequest;
import com.edunova.dto.SubmissionResponse;
import com.edunova.exception.ResourceNotFoundException;
import com.edunova.model.Assignment;
import com.edunova.model.Question;
import com.edunova.model.Quiz;
import com.edunova.model.User;
import com.edunova.repository.AssignmentRepository;
import com.edunova.repository.QuestionRepository;
import com.edunova.repository.QuizRepository;
import com.edunova.repository.SubmissionRepository;
import com.edunova.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@Service
@RequiredArgsConstructor
public class SubmissionService {

    private final SubmissionRepository submissionRepository;
    private final QuizRepository quizRepository;
    private final QuestionRepository questionRepository;
    private final AssignmentRepository assignmentRepository;
    private final GamificationService gamificationService;
    private final FileStorageService fileStorageService;
    private final NotificationService notificationService;
    private final UserRepository userRepository;

    public SubmissionResponse submitQuiz(User user, Long quizId, QuizSubmissionRequest request) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz", "id", quizId));

        List<Submission> pastSubmissions = submissionRepository.findByUserIdAndQuizId(user.getId(), quizId);
        if (pastSubmissions.size() >= quiz.getAttemptsAllowed()) {
            throw new IllegalArgumentException("Maximum attempts reached for this quiz.");
        }

        List<Question> questions = questionRepository.findByQuizIdOrderByOrderIndexAsc(quizId);
        double totalPoints = 0;
        double gainedPoints = 0;

        for (Question q : questions) {
            totalPoints += q.getPoints();
            String studentAns = findStudentAnswer(q.getId(), request.getAnswers());
            if (studentAns != null && studentAns.trim().equalsIgnoreCase(q.getCorrectAnswer().trim())) {
                gainedPoints += q.getPoints();
            }
        }

        double score = totalPoints > 0 ? (gainedPoints / totalPoints) * 100.0 : 0.0;
        double passingGrade = quiz.getPassingScore() != null ? quiz.getPassingScore() : 70.0;
        double grade = (score >= passingGrade) ? score : 0.0;
        
        Submission submission = Submission.builder()
                .userId(user.getId())
                .quizId(quizId)
                .answers(request.getAnswers())
                .score(score)
                .grade(grade)
                .startedAt(request.getStartedAt())
                .submittedAt(new Date())
                .timeSpent(request.getTimeSpent())
                .attempts(pastSubmissions.size() + 1)
                .build();

        submission = submissionRepository.save(submission);

        if (grade > 0) {
            int xp = (int) gainedPoints * 10;
            gamificationService.awardXp(user.getId(), xp, "Passed quiz: " + quiz.getTitle());
        }

        return SubmissionResponse.builder()
                .id(submission.getId())
                .userId(submission.getUserId())
                .quizId(submission.getQuizId())
                .answers(submission.getAnswers())
                .score(submission.getScore())
                .grade(submission.getGrade())
                .submittedAt(submission.getSubmittedAt())
                .attempts(submission.getAttempts())
                .build();
    }

    public SubmissionResponse submitAssignment(User user, Long assignmentId, MultipartFile file) {
        String fileName = fileStorageService.storeFile(file);
        
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("originalFileName", file.getOriginalFilename());
        metadata.put("contentType", file.getContentType());
        metadata.put("size", file.getSize());

        java.util.Map<String, Object> submissionMetadata = new java.util.HashMap<>();
        submissionMetadata.put("fileName", fileName);
        submissionMetadata.put("originalFileName", file.getOriginalFilename());
        submissionMetadata.put("contentType", file.getContentType());

        Submission submission = Submission.builder()
                .userId(user.getId())
                .assignmentId(assignmentId)
                .submittedAt(new java.util.Date())
                .status("PENDING")
                .feedback("New submission")
                .metadata(submissionMetadata)
                .build();

        submission = submissionRepository.save(submission);
        
        // Award XP to student
        gamificationService.awardXp(user.getId(), 50, "Submitted assignment ID: " + assignmentId);
        
        // Notify Instructor
        Assignment assignment = assignmentRepository.findById(assignmentId).orElse(null);
        if (assignment != null && assignment.getCourse() != null && assignment.getCourse().getInstructor() != null) {
            java.util.Map<String, Object> notifMetadata = new java.util.HashMap<>();
            notifMetadata.put("assignmentId", assignmentId);
            notifMetadata.put("studentName", user.getFullName());
            
            notificationService.sendNotification(
                assignment.getCourse().getInstructor().getId(),
                "NEW_SUBMISSION",
                "New Assignment Submission",
                user.getFullName() + " has submitted the assignment: " + assignment.getTitle(),
                notifMetadata
            );
        }
        
        return SubmissionResponse.builder()
                .id(submission.getId())
                .status(submission.getStatus())
                .submittedAt(submission.getSubmittedAt())
                .xpAwarded(50)
                .build();
    }

    public List<SubmissionResponse> getSubmissionsByAssignmentId(Long assignmentId) {
        return submissionRepository.findByAssignmentId(assignmentId).stream()
                .map(this::mapToSubmissionResponse)
                .collect(java.util.stream.Collectors.toList());
    }

    public SubmissionResponse gradeSubmission(String submissionId, Integer xpAwarded, String feedback) {
        Submission submission = submissionRepository.findById(submissionId).orElseThrow(() -> new RuntimeException("Submission not found"));
        submission.setStatus("GRADED");
        submission.setFeedback(feedback);
        submission.setScore(xpAwarded.doubleValue());
        
        // Let's also grant XP to the underlying user logic implicitly by passing through gamification or directly updating total_xp. 
        // We will just save the submission for now as the core grading mechanic.
        submissionRepository.save(submission);
        
        return mapToSubmissionResponse(submission);
    }

    public SubmissionResponse getStudentSubmission(Long userId, Long assignmentId) {
        return submissionRepository.findByUserIdAndAssignmentId(userId, assignmentId)
                .stream().findFirst()
                .map(this::mapToSubmissionResponse)
                .orElse(null);
    }

    private SubmissionResponse mapToSubmissionResponse(Submission s) {
        String name = "Unknown Student";
        if (s.getUserId() != null) {
            name = userRepository.findById(s.getUserId()).map(User::getFullName).orElse("Unknown Student");
        }
        
        return SubmissionResponse.builder()
                .id(s.getId())
                .userId(s.getUserId())
                .fullName(name)
                .assignmentId(s.getAssignmentId())
                .status(s.getStatus())
                .submittedAt(s.getSubmittedAt())
                .feedback(s.getFeedback())
                .metadata(s.getMetadata())
                .score(s.getScore())
                .build();
    }

    private String findStudentAnswer(Long questionId, List<Object> answers) {
        if (answers == null) return null;
        for (Object obj : answers) {
            if (obj instanceof java.util.Map) {
                java.util.Map<?, ?> map = (java.util.Map<?, ?>) obj;
                Object qId = map.get("questionId");
                if (qId != null && qId.toString().equals(questionId.toString())) {
                    Object ans = map.get("answer");
                    return ans != null ? ans.toString() : null;
                }
            }
        }
        return null;
    }
}
