package com.veritas.backend.controller;

import com.veritas.backend.domain.auth.UserPrincipal;
import com.veritas.backend.dto.bookmark.BookmarkListResponse;
import com.veritas.backend.exception.ApiException;
import com.veritas.backend.service.BookmarkService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/bookmarks")
@RequiredArgsConstructor
public class BookmarkController {

    private final BookmarkService bookmarkService;

    @GetMapping
    public BookmarkListResponse listBookmarks(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        if (principal == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        return bookmarkService.getBookmarks(principal.getId());
    }

    @PostMapping
    public ResponseEntity<Void> addBookmark(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody Map<String, Object> body
    ) {
        if (principal == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }

        Object raw = body.get("article_id");
        if (raw == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "article_id가 필요합니다.");
        }

        Long articleId;
        if (raw instanceof Number) {
            articleId = ((Number) raw).longValue();
        } else {
            try {
                articleId = Long.parseLong(raw.toString());
            } catch (NumberFormatException e) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "article_id가 올바르지 않습니다.");
            }
        }

        bookmarkService.addBookmark(principal.getId(), articleId);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @DeleteMapping("/{articleId}")
    public ResponseEntity<Void> removeBookmark(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long articleId
    ) {
        if (principal == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }

        bookmarkService.removeBookmark(principal.getId(), articleId);
        return ResponseEntity.noContent().build();
    }
}
