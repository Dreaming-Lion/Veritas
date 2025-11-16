package com.veritas.backend.dto.inquiry;

import java.util.List;

public class InquiryListResponse {

    private long count;
    private List<InquiryListItemResponse> items;

    public InquiryListResponse(long count, List<InquiryListItemResponse> items) {
        this.count = count;
        this.items = items;
    }

    public long getCount() {
        return count;
    }

    public List<InquiryListItemResponse> getItems() {
        return items;
    }
}
