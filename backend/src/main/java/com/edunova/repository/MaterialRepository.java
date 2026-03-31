package com.edunova.repository;

import com.edunova.model.Material;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MaterialRepository extends JpaRepository<Material, Long> {
    List<Material> findByModuleIdOrderByOrderIndexAsc(Long moduleId);
}
