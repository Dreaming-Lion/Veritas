package com.veritas.backend.service;

import com.veritas.backend.domain.auth.UserPrincipal;
import com.veritas.backend.domain.inquiry.InquiryStatus;
import com.veritas.backend.dto.inquiry.*;
import com.veritas.backend.entity.Inquiry;
import com.veritas.backend.entity.User;
import com.veritas.backend.exception.ApiException;
import com.veritas.backend.repository.InquiryRepository;
import com.veritas.backend.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class InquiryService {

    private final InquiryRepository inquiryRepository;
    private final UserRepository userRepository;

    public InquiryService(InquiryRepository inquiryRepository, UserRepository userRepository) {
        this.inquiryRepository = inquiryRepository;
        this.userRepository = userRepository;
    }

    private User findUserOrThrow(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "사용자를 찾을 수 없습니다."));
    }

    private Inquiry findInquiryOrThrow(Long id) {
        return inquiryRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Not found"));
    }

    private void checkOwnerOrThrow(Inquiry inquiry, Long userId) {
        if (!inquiry.getUser().getId().equals(userId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Forbidden");
        }
    }

    // POST /api/inquiries
    @Transactional
    public InquiryItemResponse createInquiry(UserPrincipal principal, InquiryCreateRequest req) {
        if (req.getTitle() == null || req.getTitle().trim().isEmpty()
                || req.getContent() == null || req.getContent().trim().isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "제목과 내용을 모두 입력해주세요.");
        }

        User user = findUserOrThrow(principal.getId());

        Inquiry inquiry = new Inquiry();
        inquiry.setUser(user);
        inquiry.setTitle(req.getTitle().trim());
        inquiry.setContent(req.getContent().trim());
        inquiry.setPublicVisible(Boolean.TRUE.equals(req.getIsPublic()));
        inquiry.setStatus(InquiryStatus.PENDING);

        Inquiry saved = inquiryRepository.save(inquiry);

        return toItemDto(saved);
    }

    // GET /api/inquiries
    @Transactional(readOnly = true)
    public InquiryListResponse listInquiries(UserPrincipal principal, boolean mine, boolean brief, int limit, int offset) {
        if (!mine) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only mine is allowed");
        }

        User user = findUserOrThrow(principal.getId());

        long total = inquiryRepository.countByUser(user);

        int page = offset / limit;
        var pageable = PageRequest.of(page, limit);

        List<Inquiry> inquiries = inquiryRepository.findByUserOrderByCreatedAtDesc(user, pageable);

        List<InquiryListItemResponse> items = inquiries.stream()
                .map(inq -> toListItemDto(inq, brief))
                .toList();

        return new InquiryListResponse(total, items);
    }

    // GET /api/inquiries/{id}
    @Transactional(readOnly = true)
    public InquiryItemResponse getInquiry(Long id, UserPrincipal principal) {
        Inquiry inquiry = findInquiryOrThrow(id);
        checkOwnerOrThrow(inquiry, principal.getId());
        return toItemDto(inquiry);
    }

    // PATCH /api/inquiries/{id}
    @Transactional
    public InquiryItemResponse updateInquiry(Long id, UserPrincipal principal, InquiryUpdateRequest req) {
        Inquiry inquiry = findInquiryOrThrow(id);
        checkOwnerOrThrow(inquiry, principal.getId());

        boolean changed = false;

        if (req.getTitle() != null) {
            inquiry.setTitle(req.getTitle().trim());
            changed = true;
        }
        if (req.getContent() != null) {
            inquiry.setContent(req.getContent().trim());
            changed = true;
        }
        if (req.getIsPublic() != null) {
            inquiry.setPublicVisible(Boolean.TRUE.equals(req.getIsPublic()));
            changed = true;
        }
        if (req.getStatus() != null) {
            inquiry.setStatus(req.getStatus());
            changed = true;
        }

        if (!changed) {
            return toItemDto(inquiry);
        }

        Inquiry saved = inquiryRepository.save(inquiry);
        return toItemDto(saved);
    }

    // DELETE /api/inquiries/{id}
    @Transactional
    public void deleteInquiry(Long id, UserPrincipal principal) {
        Inquiry inquiry = findInquiryOrThrow(id);
        checkOwnerOrThrow(inquiry, principal.getId());
        inquiryRepository.delete(inquiry);
    }

    private String buildExcerpt(String content) {
        if (content == null) return null;
        String trimmed = content.trim()
                .replace("\r\n", " ")
                .replace("\n", " ");

        if (trimmed.length() > 80) {
            return trimmed.substring(0, 80) + "…";
        }
        return trimmed;
    }

    private InquiryListItemResponse toListItemDto(Inquiry inquiry, boolean brief) {
        InquiryListItemResponse dto = new InquiryListItemResponse()
                .setId(inquiry.getId())
                .setTitle(inquiry.getTitle())
                .setStatus(inquiry.getStatus())
                .setCreatedAt(inquiry.getCreatedAt())
                .setUpdatedAt(inquiry.getUpdatedAt());

        if (brief) {
            dto.setExcerpt(buildExcerpt(inquiry.getContent()));
        } else {
            dto
                    .setUserId(inquiry.getUser().getId())
                    .setContent(inquiry.getContent())
                    .setIsPublic(inquiry.isPublicVisible());
        }
        return dto;
    }

    private InquiryItemResponse toItemDto(Inquiry inquiry) {
        return new InquiryItemResponse()
                .setId(inquiry.getId())
                .setUserId(inquiry.getUser().getId())
                .setTitle(inquiry.getTitle())
                .setContent(inquiry.getContent())
                .setStatus(inquiry.getStatus())
                .setIsPublic(inquiry.isPublicVisible())
                .setCreatedAt(inquiry.getCreatedAt())
                .setUpdatedAt(inquiry.getUpdatedAt());
    }
}
