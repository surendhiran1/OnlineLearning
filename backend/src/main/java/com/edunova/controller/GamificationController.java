package com.edunova.controller;

import com.edunova.model.UserBadge;
import com.edunova.repository.UserBadgeRepository;
import com.edunova.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/gamification")
@RequiredArgsConstructor
public class GamificationController {

    private final UserBadgeRepository userBadgeRepository;

    @GetMapping("/badges")
    public ResponseEntity<List<UserBadge>> getMyBadges(@AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(userBadgeRepository.findByUserId(currentUser.getUser().getId()));
    }
}
