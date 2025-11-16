package com.veritas.backend.dto.bookmark;

import java.util.List;

public class BookmarkListResponse {
    private long count;
    private List<ApiArticleDto> articles;

    public BookmarkListResponse(long count, List<ApiArticleDto> articles) {
        this.count = count;
        this.articles = articles;
    }

    public long getCount() { return count; }
    public List<ApiArticleDto> getArticles() { return articles; }
}
