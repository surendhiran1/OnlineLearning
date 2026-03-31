package com.edunova.service;

import com.edunova.document.MaterialProgress;
import com.edunova.dto.ProgressRequest;
import com.edunova.model.User;
import com.edunova.repository.MaterialProgressRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProgressService {

    private final MaterialProgressRepository progressRepository;

    public void trackProgress(User user, Long materialId, ProgressRequest request) {
        MaterialProgress progress = progressRepository.findByUserIdAndMaterialId(user.getId(), materialId)
                .orElse(MaterialProgress.builder()
                        .userId(user.getId())
                        .materialId(materialId)
                        .timeSpent(0)
                        .build());

        progress.setIsCompleted(request.getIsCompleted());
        progress.setLastPosition(request.getLastPosition());
        progress.setTimeSpent(progress.getTimeSpent() + (request.getTimeSpent() != null ? request.getTimeSpent() : 0));
        progress.setUpdatedAt(new Date());

        if (Boolean.TRUE.equals(request.getIsCompleted()) && progress.getCompletedAt() == null) {
            progress.setCompletedAt(new Date());
            progress.setProgress(100.0);
        } else if (!Boolean.TRUE.equals(request.getIsCompleted())) {
            progress.setProgress(50.0);
        }

        progressRepository.save(progress);
    }

    public List<MaterialProgress> getUserProgress(User user) {
        return progressRepository.findByUserId(user.getId());
    }
}
