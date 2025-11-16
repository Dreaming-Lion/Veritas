package com.veritas.backend.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(
    name = "bookmarks",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uq_bookmarks_user_article",
            columnNames = {"user_id", "article_id"}
        )
    },
    indexes = {
        @Index(
            name = "ix_bookmarks_user_id_created_at",
            columnList = "user_id, created_at"
        )
    }
)
public class Bookmark {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "article_id", nullable = false)
    private Long articleId;

    @Column(
        name = "created_at",
        nullable = false,
        columnDefinition = "TIMESTAMPTZ DEFAULT now()"
    )
    private OffsetDateTime createdAt;

    protected Bookmark() {}

    public Bookmark(Long userId, Long articleId) {
        this.userId = userId;
        this.articleId = articleId;
    }

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public Long getArticleId() { return articleId; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
}
