package com.veritas.backend.dto.inquiry;

import com.veritas.backend.domain.inquiry.InquiryStatus;

import java.time.OffsetDateTime;

public class InquiryItemResponse {

    private Long id;
    private Long userId;
    private String title;
    private String content;
    private InquiryStatus status;
    private Boolean isPublic;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    public Long getId() {
        return id;
    }

    public InquiryItemResponse setId(Long id) {
        this.id = id;
        return this;
    }

    public Long getUserId() {
        return userId;
    }

    public InquiryItemResponse setUserId(Long userId) {
        this.userId = userId;
        return this;
    }

    public String getTitle() {
        return title;
    }

    public InquiryItemResponse setTitle(String title) {
        this.title = title;
        return this;
    }

    public String getContent() {
        return content;
    }

    public InquiryItemResponse setContent(String content) {
        this.content = content;
        return this;
    }

    public InquiryStatus getStatus() {
        return status;
    }

    public InquiryItemResponse setStatus(InquiryStatus status) {
        this.status = status;
        return this;
    }

    public Boolean getIsPublic() {
        return isPublic;
    }

    public InquiryItemResponse setIsPublic(Boolean isPublic) {
        this.isPublic = isPublic;
        return this;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public InquiryItemResponse setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
        return this;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }

    public InquiryItemResponse setUpdatedAt(OffsetDateTime updatedAt) {
        this.updatedAt = updatedAt;
        return this;
    }
}
