package com.veritas.backend.controller;

import com.veritas.backend.dto.auth.LoginRequest;
import com.veritas.backend.dto.auth.SignupRequest;
import com.veritas.backend.dto.auth.TokenResponse;
import com.veritas.backend.dto.auth.UserResponse;
import com.veritas.backend.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService; 

    @PostMapping("/signup")
    public ResponseEntity<UserResponse> signup(@Valid @RequestBody SignupRequest request) {
        UserResponse user = authService.signup(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(user);
    }

    @PostMapping("/login")
    public ResponseEntity<TokenResponse> login(@Valid @RequestBody LoginRequest request) {
        TokenResponse token = authService.login(request);
        return ResponseEntity.ok(token);
    }
}
