package com.edunova.repository;

import com.edunova.document.MaterialProgress;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MaterialProgressRepository extends MongoRepository<MaterialProgress, String> {
    Optional<MaterialProgress> findByUserIdAndMaterialId(Long userId, Long materialId);
    List<MaterialProgress> findByUserId(Long userId);
}
