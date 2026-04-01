package com.edunova.service;

import com.edunova.dto.ModuleRequest;
import com.edunova.dto.ModuleResponse;
import com.edunova.exception.ResourceNotFoundException;
import com.edunova.model.Course;
import com.edunova.model.Module;
import com.edunova.repository.CourseRepository;
import com.edunova.repository.ModuleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class ModuleService {

    private final ModuleRepository moduleRepository;
    private final CourseRepository courseRepository;

    public ModuleResponse createModule(Long courseId, ModuleRequest request) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", courseId));

        Module module = Module.builder()
                .course(course)
                .title(request.getTitle())
                .description(request.getDescription())
                .orderIndex(request.getOrderIndex())
                .isPublished(true)
                .build();

        return mapToResponse(moduleRepository.save(module));
    }

    public List<ModuleResponse> getModulesByCourseId(Long courseId) {
        return moduleRepository.findByCourseIdOrderByOrderIndexAsc(courseId)
                .stream().map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public ModuleResponse updateModule(Long moduleId, ModuleRequest request) {
        Module module = moduleRepository.findById(moduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Module", "id", moduleId));
        
        module.setTitle(request.getTitle());
        module.setDescription(request.getDescription());
        module.setOrderIndex(request.getOrderIndex());

        return mapToResponse(moduleRepository.save(module));
    }

    public void deleteModule(Long id) {
        if (!moduleRepository.existsById(id)) {
            throw new ResourceNotFoundException("Module", "id", id);
        }
        moduleRepository.deleteById(id);
    }

    private ModuleResponse mapToResponse(Module module) {
        return ModuleResponse.builder()
                .id(module.getId())
                .courseId(module.getCourse().getId())
                .title(module.getTitle())
                .description(module.getDescription())
                .orderIndex(module.getOrderIndex())
                .isPublished(module.getIsPublished())
                .build();
    }
}
