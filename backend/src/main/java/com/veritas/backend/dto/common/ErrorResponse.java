package com.veritas.backend.dto.common;

public class ErrorResponse {
    private String detail;

    public ErrorResponse(String detail) {
        this.detail = detail;
    }

    public String getDetail() { return detail; }
}
