package com.edunova.controller;

import com.edunova.dto.MaterialRequest;
import com.edunova.dto.MaterialResponse;
import com.edunova.service.MaterialService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/modules/{moduleId}/materials")
@RequiredArgsConstructor
public class MaterialController {
    private final MaterialService materialService;
    private final com.edunova.service.FileStorageService fileStorageService;

    @GetMapping("/download/{fileName:.+}")
    public ResponseEntity<org.springframework.core.io.Resource> downloadMaterialFile(
            @PathVariable Long moduleId,
            @PathVariable String fileName,
            @RequestParam(value = "orig", required = false) String originalName,
            jakarta.servlet.http.HttpServletRequest request) {
        
        org.springframework.core.io.Resource resource = fileStorageService.loadFileAsResource(fileName);
        String contentType = null;
        try {
            contentType = request.getServletContext().getMimeType(resource.getFile().getAbsolutePath());
        } catch (java.io.IOException ex) {
            contentType = "application/octet-stream";
        }

        if(contentType == null) {
            contentType = "application/octet-stream";
        }

        String finalFileName = resource.getFilename();
        if (originalName != null && !originalName.isEmpty()) {
            if (originalName.contains(".")) {
                finalFileName = originalName;
            } else {
                String diskName = resource.getFilename();
                if (diskName != null && diskName.contains(".")) {
                    finalFileName = originalName + diskName.substring(diskName.lastIndexOf("."));
                } else {
                    finalFileName = originalName;
                }
            }
        }

        return ResponseEntity.ok()
                .contentType(org.springframework.http.MediaType.parseMediaType(contentType))
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + finalFileName + "\"")
                .body(resource);
    }

    @PostMapping
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<MaterialResponse> createMaterial(
            @PathVariable Long moduleId,
            @Valid @RequestBody MaterialRequest request) {
        return new ResponseEntity<>(materialService.createMaterial(moduleId, request), HttpStatus.CREATED);
    }

    @PostMapping("/upload")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<MaterialResponse> uploadMaterial(
            @PathVariable Long moduleId,
            @RequestParam("title") String title,
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        return new ResponseEntity<>(materialService.createMaterialWithFile(moduleId, title, file), HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<MaterialResponse>> getModuleMaterials(@PathVariable Long moduleId) {
        return ResponseEntity.ok(materialService.getMaterialsByModuleId(moduleId));
    }

    @DeleteMapping("/{materialId}")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<Void> deleteMaterial(@PathVariable Long materialId) {
        materialService.deleteMaterial(materialId);
        return ResponseEntity.noContent().build();
    }
}
