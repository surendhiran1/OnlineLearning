package com.edunova.controller;

import com.edunova.document.ChatMessage;
import com.edunova.dto.ChatMessageRequest;
import com.edunova.repository.ChatMessageRepository;
import com.edunova.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import com.edunova.service.FileStorageService;
import com.edunova.service.NotificationService;
import com.edunova.repository.ChatGroupRepository;
import java.util.Map;
import java.util.HashMap;
import java.io.IOException;
import org.springframework.http.ResponseEntity;

import java.util.Date;
import java.util.Collections;
import java.util.List;

@RestController
@RequiredArgsConstructor
public class ChatController {

    private final ChatMessageRepository chatMessageRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final FileStorageService fileStorageService;
    private final NotificationService notificationService;
    private final ChatGroupRepository chatGroupRepository;

    @PostMapping("/api/v1/chat/upload")
    public ResponseEntity<Map<String, String>> uploadMedia(
            @RequestParam("file") MultipartFile file) throws IOException {
        String fileName = fileStorageService.storeFile(file);
        
        Map<String, String> response = new HashMap<>();
        response.put("url", fileName);
        response.put("contentType", file.getContentType());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/api/v1/messages/stream/{streamId}")
    public ResponseEntity<List<ChatMessage>> getStreamMessages(@PathVariable String streamId) {
        return ResponseEntity.ok(chatMessageRepository.findByStreamIdOrderByCreatedAtAsc(streamId));
    }

    @MessageMapping("/chat/{streamId}")
    public void processMessage(@DestinationVariable String streamId, 
                             @Payload ChatMessageRequest request,
                             Authentication authentication) {
        
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();

        ChatMessage chatMessage = ChatMessage.builder()
                .courseId(request.getCourseId())
                .streamId(streamId)
                .userId(userPrincipal.getUser().getId())
                .userName(userPrincipal.getUser().getFullName())
                .message(request.getMessage())
                .type(request.getType() != null ? request.getType() : "TEXT")
                .attachments(request.getAttachments())
                .reactions(Collections.emptyList())
                .mentions(Collections.emptyList())
                .createdAt(new Date())
                .build();

        ChatMessage saved = chatMessageRepository.save(chatMessage);
        
        // Notify others in the stream if it's a group
        if (streamId.startsWith("group-")) {
            try {
                Long groupId = Long.parseLong(streamId.substring(6));
                chatGroupRepository.findById(groupId).ifPresent(group -> {
                    group.getMembers().forEach(member -> {
                        if (!member.getId().equals(userPrincipal.getUser().getId())) {
                            Map<String, Object> data = new HashMap<>();
                            data.put("groupId", groupId);
                            notificationService.sendNotification(
                                member.getId(), "CHAT", "New Group Message", 
                                "Message in " + group.getName() + " from " + userPrincipal.getUser().getFullName(),
                                data
                            );
                        }
                    });
                });
            } catch (Exception e) { /* Not a numeric group stream */ }
        }

        messagingTemplate.convertAndSend("/topic/stream/" + streamId, saved);
    }
}
