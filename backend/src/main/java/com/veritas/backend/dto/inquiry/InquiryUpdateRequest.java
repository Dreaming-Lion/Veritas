package com.veritas.backend.dto.inquiry;

import com.veritas.backend.domain.inquiry.InquiryStatus;
import jakarta.annotation.Nullable;
import jakarta.validation.constraints.Size;

public class InquiryUpdateRequest {

    @Nullable
    @Size(min = 1, max = 200, message = "제목은 1~200자여야 합니다.")
    private String title;

    @Nullable
    @Size(min = 1, message = "내용은 1자 이상이어야 합니다.")
    private String content;

    @Nullable
    private Boolean isPublic;

    @Nullable
    private InquiryStatus status; 

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public Boolean getIsPublic() {
        return isPublic;
    }

    public void setIsPublic(Boolean isPublic) {
        this.isPublic = isPublic;
    }

    public InquiryStatus getStatus() {
        return status;
    }

    public void setStatus(InquiryStatus status) {
        this.status = status;
    }
}
