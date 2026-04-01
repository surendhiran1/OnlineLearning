package com.edunova.controller;

import com.edunova.model.User;
import com.edunova.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@SuppressWarnings("null")
public class UserController {

    private final UserRepository userRepository;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @GetMapping("/all")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<List<UserDto>> getAllUsers() {
        return ResponseEntity.ok(
            userRepository.findAll().stream()
                .map(u -> new UserDto(
                    u.getId(), 
                    u.getFullName(), 
                    u.getEmail(), 
                    u.getTotalXp() != null ? u.getTotalXp() : 0, 
                    u.getCurrentLevel() != null ? u.getCurrentLevel() : 1, 
                    u.getRole() != null ? u.getRole().name() : "STUDENT"
                ))
                .collect(Collectors.toList())
        );
    }

    @GetMapping("/students")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<List<UserDto>> getStudents() {
        return ResponseEntity.ok(
            userRepository.findAll().stream()
                .filter(u -> u.getRole() == User.Role.STUDENT)
                .map(u -> new UserDto(
                    u.getId(), 
                    u.getFullName(), 
                    u.getEmail(), 
                    u.getTotalXp() != null ? u.getTotalXp() : 0, 
                    u.getCurrentLevel() != null ? u.getCurrentLevel() : 1, 
                    "STUDENT"
                ))
                .collect(Collectors.toList())
        );
    }

    @PostMapping("/admin")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<?> createUser(@org.springframework.web.bind.annotation.RequestBody AdminUserRequest req) {
        if (userRepository.existsByEmail(req.email())) return ResponseEntity.badRequest().body("Email exists");
        User user = User.builder()
                .fullName(req.fullName())
                .email(req.email())
                .passwordHash(passwordEncoder.encode(req.password()))
                .role(User.Role.valueOf(req.role()))
                .build();
        userRepository.save(user);
        return ResponseEntity.ok("User created");
    }

    @org.springframework.web.bind.annotation.DeleteMapping("/{id}")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<Void> deleteUser(@org.springframework.web.bind.annotation.PathVariable Long id) {
        userRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    public record AdminUserRequest(String fullName, String email, String password, String role) {}

    @GetMapping("/profile")
    public ResponseEntity<UserDto> getProfile(org.springframework.security.core.Authentication auth) {
        if (auth == null || !auth.isAuthenticated())
            return ResponseEntity.status(401).build();
        return userRepository.findByEmail(auth.getName())
                .map(u -> new UserDto(
                        u.getId(),
                        u.getFullName(),
                        u.getEmail(),
                        u.getTotalXp() != null ? u.getTotalXp() : 0,
                        u.getCurrentLevel() != null ? u.getCurrentLevel() : 1,
                        u.getRole() != null ? u.getRole().name() : "STUDENT"))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    public record UserDto(Long id, String fullName, String email, Integer totalXp, Integer currentLevel, String role) {
    }
}
