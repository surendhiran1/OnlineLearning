package com.edunova.service;

import com.edunova.dto.MaterialRequest;
import com.edunova.dto.MaterialResponse;
import com.edunova.exception.ResourceNotFoundException;
import com.edunova.model.Material;
import com.edunova.model.Module;
import com.edunova.repository.MaterialRepository;
import com.edunova.repository.ModuleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MaterialService {

    private final MaterialRepository materialRepository;
    private final ModuleRepository moduleRepository;
    private final FileStorageService fileStorageService;

    public MaterialResponse createMaterialWithFile(Long moduleId, String title, org.springframework.web.multipart.MultipartFile file) {
        Module module = moduleRepository.findById(moduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Module", "id", moduleId));

        String fileName = fileStorageService.storeFile(file);
        
        Material material = Material.builder()
                .module(module)
                .title(title)
                .type(Material.Type.FILE)
                .filePath(fileName)
                .fileSize(file.getSize())
                .orderIndex(1) // Default to 1, can be adjusted
                .build();

        return mapToResponse(materialRepository.save(material));
    }

    public MaterialResponse createMaterial(Long moduleId, MaterialRequest request) {
        Module module = moduleRepository.findById(moduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Module", "id", moduleId));

        Material material = Material.builder()
                .module(module)
                .title(request.getTitle())
                .type(Material.Type.valueOf(request.getType().toUpperCase()))
                .content(request.getContent())
                .url(request.getUrl())
                .orderIndex(request.getOrderIndex())
                .duration(request.getDuration())
                .build();

        return mapToResponse(materialRepository.save(material));
    }

    public List<MaterialResponse> getMaterialsByModuleId(Long moduleId) {
        return materialRepository.findByModuleIdOrderByOrderIndexAsc(moduleId)
                .stream().map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public void deleteMaterial(Long id) {
        if (!materialRepository.existsById(id)) {
            throw new ResourceNotFoundException("Material", "id", id);
        }
        materialRepository.deleteById(id);
    }

    private MaterialResponse mapToResponse(Material material) {
        return MaterialResponse.builder()
                .id(material.getId())
                .moduleId(material.getModule().getId())
                .title(material.getTitle())
                .type(material.getType().name())
                .content(material.getContent())
                .url(material.getUrl())
                .orderIndex(material.getOrderIndex())
                .duration(material.getDuration())
                .filePath(material.getFilePath())
                .fileSize(material.getFileSize())
                .build();
    }
}
