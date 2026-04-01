package com.edunova.service;

import com.edunova.model.UserBadge;
import com.edunova.repository.BadgeRepository;
import com.edunova.repository.UserBadgeRepository;
import com.edunova.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class GamificationService {

    private final UserRepository userRepository;
    private final UserBadgeRepository userBadgeRepository;
    private final BadgeRepository badgeRepository;
    private final NotificationService notificationService;

    public void awardXp(Long userId, Integer xpAmount, String reason) {
        userRepository.findById(userId).ifPresent(user -> {
            user.setTotalXp(user.getTotalXp() + xpAmount);
            
            int expectedLevel = calculateLevel(user.getTotalXp());
            if (expectedLevel > user.getCurrentLevel()) {
                user.setCurrentLevel(expectedLevel);
                notificationService.sendNotification(user.getId(), "LEVEL_UP", "Level Up!", "You reached level " + expectedLevel, null);
            }
            
            userRepository.save(user);
        });
    }

    public void evaluateBadge(Long userId, Long badgeId) {
        if (!userBadgeRepository.existsByUserIdAndBadgeId(userId, badgeId)) {
            userRepository.findById(userId).ifPresent(user -> {
                badgeRepository.findById(badgeId).ifPresent(badge -> {
                    UserBadge userBadge = UserBadge.builder().user(user).badge(badge).build();
                    userBadgeRepository.save(userBadge);
                    
                    awardXp(userId, badge.getXpReward(), "Earned badge: " + badge.getName());
                    notificationService.sendNotification(userId, "BADGE_EARNED", "New Badge!", "You earned " + badge.getName(), null);
                });
            });
        }
    }

    private int calculateLevel(int xp) {
        if (xp < 100) return 1;
        if (xp < 300) return 2;
        if (xp < 600) return 3;
        if (xp < 1000) return 4;
        return 5 + (xp - 1000) / 500;
    }
}
