package com.veritas.backend.service;

import com.veritas.backend.dto.bookmark.*;
import com.veritas.backend.entity.Bookmark;
import com.veritas.backend.exception.ApiException;
import com.veritas.backend.repository.BookmarkRepository;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;

@Service
public class BookmarkService {

    private final BookmarkRepository bookmarkRepository;
    private final JdbcTemplate jdbcTemplate;

    public BookmarkService(BookmarkRepository bookmarkRepository, JdbcTemplate jdbcTemplate) {
        this.bookmarkRepository = bookmarkRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    private String iso(Object dt) {
        if (dt == null) return null;
        if (dt instanceof java.sql.Timestamp ts) {
            OffsetDateTime odt = ts.toInstant().atOffset(ZoneOffset.UTC);
            return odt.toString();
        }
        return dt.toString();
    }

    public BookmarkListResponse listBookmarks(Long userId, int limit, int offset) {
        long total = bookmarkRepository.countByUserId(userId);

        String sql = """
            SELECT n.id, n.title, n.content, n.summary, n.date, n.link
            FROM bookmarks b
            JOIN news n ON n.id = b.article_id
            WHERE b.user_id = ?
            ORDER BY b.created_at DESC
            LIMIT ? OFFSET ?
        """;

        List<ApiArticleDto> articles = jdbcTemplate.query(
            sql,
            (rs, rowNum) -> mapArticle(rs),
            userId, limit, offset
        );

        return new BookmarkListResponse(total, articles);
    }

    private ApiArticleDto mapArticle(ResultSet rs) throws SQLException {
        ApiArticleDto a = new ApiArticleDto();
        a.setId(rs.getLong("id"));
        a.setTitle(rs.getString("title") != null ? rs.getString("title") : "");
        a.setContent(rs.getString("content") != null ? rs.getString("content") : "");
        a.setSummary(rs.getString("summary") != null ? rs.getString("summary") : "");
        a.setDate(iso(rs.getObject("date")));
        a.setLink(rs.getString("link") != null ? rs.getString("link") : "");
        return a;
    }

    public BookmarkExistsResponse exists(Long userId, Long articleId) {
        boolean saved = bookmarkRepository.existsByUserIdAndArticleId(userId, articleId);
        return new BookmarkExistsResponse(saved);
    }

    public void addBookmark(Long userId, BookmarkCreateRequest req) {
        Long articleId = req.getArticleId();
        if (articleId == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "article_id가 필요합니다.");
        }

        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM bookmarks WHERE user_id = ? AND article_id = ?",
                Integer.class,
                userId,
                articleId
        );
        boolean exists = (count != null && count > 0);
        if (Boolean.FALSE.equals(exists)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Article not found");
        }

        jdbcTemplate.update("""
            INSERT INTO bookmarks(user_id, article_id)
            VALUES (?, ?)
            ON CONFLICT (user_id, article_id) DO NOTHING
        """, userId, articleId);
    }

    public void removeBookmark(Long userId, Long articleId) {
        try {
            bookmarkRepository.deleteByUserIdAndArticleId(userId, articleId);
        } catch (EmptyResultDataAccessException ignored) {
        }
    }
}
