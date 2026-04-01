package com.edunova.controller;

import com.edunova.model.ChatGroup;
import com.edunova.model.User;
import com.edunova.repository.ChatGroupRepository;
import com.edunova.repository.UserRepository;
import com.edunova.security.UserPrincipal;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.transaction.annotation.Transactional;

@RestController
@RequestMapping("/api/v1/chat/groups")
@RequiredArgsConstructor
@SuppressWarnings("null")
public class ChatGroupController {

    private final ChatGroupRepository chatGroupRepository;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<ChatGroupResponse>> getMyGroups(@AuthenticationPrincipal UserPrincipal currentUser) {
        List<ChatGroup> groups = chatGroupRepository.findByUserId(currentUser.getUser().getId());
        return ResponseEntity.ok(groups.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList()));
    }

    /** Accessible to any authenticated user (student or staff) for group member selection */
    @GetMapping("/users")
    public ResponseEntity<List<UserSummary>> getAllUsersForGroupChat(@AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(
            userRepository.findAll().stream()
                .filter(u -> !u.getId().equals(currentUser.getUser().getId()))
                .map(u -> new UserSummary(u.getId(), u.getFullName(), u.getEmail(),
                        u.getRole() != null ? u.getRole().name() : "STUDENT"))
                .collect(Collectors.toList())
        );
    }

    @PostMapping
    public ResponseEntity<ChatGroupResponse> createGroup(@AuthenticationPrincipal UserPrincipal currentUser, 
                                                       @RequestBody ChatGroupRequest request) {
        User creator = userRepository.findById(currentUser.getUser().getId()).orElseThrow();
        Set<User> members = request.getUserIds().stream()
                .map(id -> userRepository.findById(id).orElseThrow())
                .collect(Collectors.toSet());
        members.add(creator); // Include creator as member

        ChatGroup group = ChatGroup.builder()
                .name(request.getName())
                .creator(creator)
                .members(members)
                .build();

        ChatGroup saved = chatGroupRepository.save(group);
        return ResponseEntity.ok(mapToResponse(saved));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteGroup(@AuthenticationPrincipal UserPrincipal currentUser, @PathVariable Long id) {
        ChatGroup group = chatGroupRepository.findById(id).orElseThrow();
        if (!group.getCreator().getId().equals(currentUser.getUser().getId()) && 
            !currentUser.getUser().getRole().name().equals("STAFF")) {
            return ResponseEntity.status(403).build();
        }
        chatGroupRepository.delete(group);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/members/{userId}")
    @Transactional
    public ResponseEntity<ChatGroupResponse> addMember(@AuthenticationPrincipal UserPrincipal currentUser,
                                                     @PathVariable Long id, @PathVariable Long userId) {
        ChatGroup group = chatGroupRepository.findById(id).orElseThrow();
        User newMember = userRepository.findById(userId).orElseThrow();
        if (group.getMembers() == null) {
            group.setMembers(new java.util.HashSet<>());
        }
        group.getMembers().add(newMember);
        chatGroupRepository.save(group);
        // Reload fresh from DB to ensure members collection is fully populated
        ChatGroup fresh = chatGroupRepository.findById(id).orElseThrow();
        return ResponseEntity.ok(mapToResponse(fresh));
    }

    private ChatGroupResponse mapToResponse(ChatGroup group) {
        ChatGroupResponse response = new ChatGroupResponse();
        response.setId(group.getId());
        response.setName(group.getName());
        response.setCreatorId(group.getCreator().getId());
        response.setCreatedAt(group.getCreatedAt().toString());
        response.setMembers(group.getMembers().stream()
                .map(m -> m.getFullName())
                .collect(Collectors.toSet()));
        response.setMemberIds(group.getMembers().stream()
                .map(User::getId)
                .collect(Collectors.toSet()));
        return response;
    }

    @Data
    public static class ChatGroupRequest {
        private String name;
        private Set<Long> userIds;
    }

    @Data
    public static class ChatGroupResponse {
        private Long id;
        private String name;
        private Long creatorId;
        private String createdAt;
        private Set<String> members;   // display names
        private Set<Long> memberIds;   // IDs for reliable filtering
    }

    @lombok.AllArgsConstructor
    @Data
    public static class UserSummary {
        private Long id;
        private String fullName;
        private String email;
        private String role;
    }
}
