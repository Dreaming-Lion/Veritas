package com.veritas.backend.dto.bookmark;

public class ApiArticleDto {
    private Long id;
    private String title;
    private String content;
    private String summary;
    private String date;
    private String link;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public String getLink() { return link; }
    public void setLink(String link) { this.link = link; }
}
