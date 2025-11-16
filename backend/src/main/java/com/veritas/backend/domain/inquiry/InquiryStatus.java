package com.veritas.backend.domain.inquiry;

public enum InquiryStatus {
    PENDING,
    ANSWERED,
    CLOSED;

    public static InquiryStatus fromString(String value) {
        if (value == null) return PENDING;
        return switch (value.toLowerCase()) {
            case "answered" -> ANSWERED;
            case "closed" -> CLOSED;
            default -> PENDING;
        };
    }
}
