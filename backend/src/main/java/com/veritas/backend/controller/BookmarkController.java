package com.veritas.backend.controller;

import com.veritas.backend.domain.auth.UserPrincipal;
import com.veritas.backend.dto.bookmark.*;
import com.veritas.backend.service.BookmarkService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/bookmarks")
public class BookmarkController {

    private final BookmarkService service;

    public BookmarkController(BookmarkService service) {
        this.service = service;
    }

    // GET /api/bookmarks?limit=&offset=
    @GetMapping("")
    public BookmarkListResponse listBookmarks(
        @RequestParam(defaultValue = "20") int limit,
        @RequestParam(defaultValue = "0") int offset,
        @AuthenticationPrincipal UserPrincipal user
    ) {
        return service.listBookmarks(user.getId(), limit, offset);
    }

    // GET /api/bookmarks/{articleId}/exists
    @GetMapping("/{articleId}/exists")
    public BookmarkExistsResponse exists(
        @PathVariable Long articleId,
        @AuthenticationPrincipal UserPrincipal user
    ) {
        return service.exists(user.getId(), articleId);
    }

    // POST /api/bookmarks
    @PostMapping("")
    public void addBookmark(
        @RequestBody BookmarkCreateRequest req,
        @AuthenticationPrincipal UserPrincipal user
    ) {
        service.addBookmark(user.getId(), req);
    }

    // DELETE /api/bookmarks/{articleId}
    @DeleteMapping("/{articleId}")
    public void removeBookmark(
        @PathVariable Long articleId,
        @AuthenticationPrincipal UserPrincipal user
    ) {
        service.removeBookmark(user.getId(), articleId);
    }
}
