package com.veritas.backend.dto.auth;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class SignupRequest {

    private String name;
    private String email;
    private String password;

    @JsonProperty("passwordConfirm")
    private String passwordConfirm;
}
