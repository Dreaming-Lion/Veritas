package com.veritas.backend.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class UserResponse {
    private Long id;
    private String nickname;
    private String email;
    private LocalDateTime createdAt;
}
