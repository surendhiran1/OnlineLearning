package com.edunova.controller;

import com.edunova.dto.AuthResponse;
import com.edunova.dto.LoginRequest;
import com.edunova.dto.RefreshTokenRequest;
import com.edunova.dto.RegisterRequest;
import com.edunova.model.User;
import com.edunova.repository.UserRepository;
import com.edunova.security.JwtTokenProvider;
import com.edunova.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getEmail(),
                        loginRequest.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);

        String jwt = tokenProvider.generateToken(authentication);
        String refreshToken = tokenProvider.generateRefreshToken(authentication);

        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();

        return ResponseEntity.ok(AuthResponse.builder()
                .accessToken(jwt)
                .refreshToken(refreshToken)
                .userId(userPrincipal.getUser().getId())
                .email(userPrincipal.getUsername())
                .fullName(userPrincipal.getUser().getFullName())
                .role(userPrincipal.getUser().getRole().name())
                .build());
    }

    @PostMapping("/register")
    @SuppressWarnings("null")
    public ResponseEntity<?> registerUser(@Valid @RequestBody RegisterRequest registerRequest) {
        if(userRepository.existsByEmail(registerRequest.getEmail())) {
            return new ResponseEntity<>("Email is already taken!", HttpStatus.BAD_REQUEST);
        }

        User user = User.builder()
                .fullName(registerRequest.getFullName())
                .email(registerRequest.getEmail())
                .passwordHash(passwordEncoder.encode(registerRequest.getPassword()))
                .role(User.Role.valueOf(registerRequest.getRole().toUpperCase()))
                .build();

        userRepository.save(user);

        return new ResponseEntity<>("User registered successfully", HttpStatus.CREATED);
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<?> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        String requestRefreshToken = request.getRefreshToken();

        if (tokenProvider.validateToken(requestRefreshToken)) {
            String email = tokenProvider.getUserUsernameFromJWT(requestRefreshToken);
            User user = userRepository.findByEmail(email).orElse(null);
            
            if (user != null) {
                String newAccessToken = tokenProvider.generateTokenFromUsername(email, 900000L); // 15 mins
                String newRefreshToken = tokenProvider.generateTokenFromUsername(email, 604800000L); // 7 days

                return ResponseEntity.ok(AuthResponse.builder()
                        .accessToken(newAccessToken)
                        .refreshToken(newRefreshToken)
                        .userId(user.getId())
                        .email(user.getEmail())
                        .fullName(user.getFullName())
                        .role(user.getRole().name())
                        .build());
            }
        }
        
        return new ResponseEntity<>("Invalid refresh token", HttpStatus.BAD_REQUEST);
    }
}
