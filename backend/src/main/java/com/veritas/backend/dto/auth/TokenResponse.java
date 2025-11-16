package com.veritas.backend.dto.auth;

public class TokenResponse {
    private String accessToken;
    private String tokenType = "bearer";

    public TokenResponse(String accessToken) {
        this.accessToken = accessToken;
    }

    public String getAccessToken() { return accessToken; }
    public String getTokenType() { return tokenType; }
}
