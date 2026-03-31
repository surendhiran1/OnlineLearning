package com.edunova.repository;

import com.edunova.model.ChatGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ChatGroupRepository extends JpaRepository<ChatGroup, Long> {
    
    @Query("SELECT DISTINCT g FROM ChatGroup g JOIN g.members m WHERE m.id = :userId")
    List<ChatGroup> findByUserId(@Param("userId") Long userId);
}
