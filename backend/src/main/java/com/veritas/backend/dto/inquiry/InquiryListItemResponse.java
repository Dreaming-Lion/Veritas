package com.veritas.backend.dto.inquiry;

import com.veritas.backend.domain.inquiry.InquiryStatus;

import java.time.OffsetDateTime;

public class InquiryListItemResponse {

    private Long id;
    private String title;
    private InquiryStatus status;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
    private String excerpt;    

    private Long userId;
    private String content;
    private Boolean isPublic;


    public Long getId() {
        return id;
    }

    public InquiryListItemResponse setId(Long id) {
        this.id = id;
        return this;
    }

    public String getTitle() {
        return title;
    }

    public InquiryListItemResponse setTitle(String title) {
        this.title = title;
        return this;
    }

    public InquiryStatus getStatus() {
        return status;
    }

    public InquiryListItemResponse setStatus(InquiryStatus status) {
        this.status = status;
        return this;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public InquiryListItemResponse setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
        return this;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }

    public InquiryListItemResponse setUpdatedAt(OffsetDateTime updatedAt) {
        this.updatedAt = updatedAt;
        return this;
    }

    public String getExcerpt() {
        return excerpt;
    }

    public InquiryListItemResponse setExcerpt(String excerpt) {
        this.excerpt = excerpt;
        return this;
    }

    public Long getUserId() {
        return userId;
    }

    public InquiryListItemResponse setUserId(Long userId) {
        this.userId = userId;
        return this;
    }

    public String getContent() {
        return content;
    }

    public InquiryListItemResponse setContent(String content) {
        this.content = content;
        return this;
    }

    public Boolean getIsPublic() {
        return isPublic;
    }

    public InquiryListItemResponse setIsPublic(Boolean isPublic) {
        this.isPublic = isPublic;
        return this;
    }
}
