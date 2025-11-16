package com.veritas.backend.dto.bookmark;

import java.util.List;

public class BookmarkListResponse {

    private long count;
    private List<BookmarkArticleDto> articles;

    public BookmarkListResponse(long count, List<BookmarkArticleDto> articles) {
        this.count = count;
        this.articles = articles;
    }

    public long getCount() {
        return count;
    }

    public List<BookmarkArticleDto> getArticles() {
        return articles;
    }

    public static class BookmarkArticleDto {
        private Long id;         
        private String title;    
        private String content;  
        private String summary;  
        private String date;    
        private String link;    

        public BookmarkArticleDto() {}

        public BookmarkArticleDto(Long id,
                                  String title,
                                  String content,
                                  String summary,
                                  String date,
                                  String link) {
            this.id = id;
            this.title = title;
            this.content = content;
            this.summary = summary;
            this.date = date;
            this.link = link;
        }

        public Long getId() {
            return id;
        }

        public String getTitle() {
            return title;
        }

        public String getContent() {
            return content;
        }

        public String getSummary() {
            return summary;
        }

        public String getDate() {
            return date;
        }

        public String getLink() {
            return link;
        }
    }
}
