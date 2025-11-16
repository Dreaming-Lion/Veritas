package com.veritas.backend.dto.bookmark;

public class BookmarkExistsResponse {
    private boolean saved;

    public BookmarkExistsResponse(boolean saved) {
        this.saved = saved;
    }

    public boolean isSaved() { return saved; }
}
