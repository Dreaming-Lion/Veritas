package com.veritas.backend.controller;

import com.veritas.backend.domain.auth.UserPrincipal;
import com.veritas.backend.dto.inquiry.*;
import com.veritas.backend.service.InquiryService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/inquiries")
public class InquiryController {

    private final InquiryService inquiryService;

    public InquiryController(InquiryService inquiryService) {
        this.inquiryService = inquiryService;
    }

    // POST /api/inquiries
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public InquiryItemResponse create(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody InquiryCreateRequest request
    ) {
        if (principal == null) {
            throw new com.veritas.backend.exception.ApiException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        return inquiryService.createInquiry(principal, request);
    }

    // GET /api/inquiries
    @GetMapping
    public InquiryListResponse list(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(name = "mine", defaultValue = "true") boolean mine,
            @RequestParam(name = "brief", defaultValue = "true") boolean brief,
            @RequestParam(name = "limit", defaultValue = "10") int limit,
            @RequestParam(name = "offset", defaultValue = "0") int offset
    ) {
        return inquiryService.listInquiries(principal, mine, brief, limit, offset);
    }

    // GET /api/inquiries/{id}
    @GetMapping("/{id}")
    public InquiryItemResponse getOne(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return inquiryService.getInquiry(id, principal);
    }

    // PATCH /api/inquiries/{id}
    @PatchMapping("/{id}")
    public InquiryItemResponse update(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody InquiryUpdateRequest request
    ) {
        return inquiryService.updateInquiry(id, principal, request);
    }

    // DELETE /api/inquiries/{id}
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        inquiryService.deleteInquiry(id, principal);
    }
}
