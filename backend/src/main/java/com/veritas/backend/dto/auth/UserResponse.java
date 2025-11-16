package com.veritas.backend.dto.auth;

import java.time.LocalDateTime;

public class UserResponse {
    private Long id;
    private String nickname;
    private String email;
    private LocalDateTime createdAt;

    public UserResponse(Long id, String nickname, String email, LocalDateTime createdAt) {
        this.id = id;
        this.nickname = nickname;
        this.email = email;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public String getNickname() { return nickname; }
    public String getEmail() { return email; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
