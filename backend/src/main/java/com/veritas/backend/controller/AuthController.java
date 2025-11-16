package com.veritas.backend.controller;

import com.veritas.backend.domain.auth.UserPrincipal;
import com.veritas.backend.dto.auth.LoginRequest;
import com.veritas.backend.dto.auth.SignupRequest;
import com.veritas.backend.dto.auth.TokenResponse;
import com.veritas.backend.dto.auth.UserResponse;
import com.veritas.backend.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/signup")
    @ResponseStatus(HttpStatus.CREATED)
    public void signup(@RequestBody SignupRequest request) {
        authService.signup(request);
    }

    @PostMapping("/login")
    public TokenResponse login(@RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @GetMapping("/me")
    public UserResponse me(@AuthenticationPrincipal UserPrincipal principal) {
        return authService.getMe(principal.getId());
    }
}
