package com.veritas.backend.service;

import com.veritas.backend.dto.bookmark.BookmarkListResponse;
import com.veritas.backend.dto.bookmark.BookmarkListResponse.BookmarkArticleDto;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class BookmarkService {

    private final JdbcTemplate jdbcTemplate;


    @Transactional(readOnly = true)
    public BookmarkListResponse getBookmarks(Long userId) {

        String bookmarkSql = """
                SELECT article_id
                FROM bookmarks
                WHERE user_id = ?
                ORDER BY id DESC
                """;

        List<Long> articleIds = jdbcTemplate.query(
                bookmarkSql,
                ps -> ps.setLong(1, userId),
                (rs, rowNum) -> rs.getLong("article_id")
        );

        if (articleIds.isEmpty()) {
            return new BookmarkListResponse(0, List.of());
        }

        String placeholders = articleIds.stream()
                .map(id -> "?")
                .collect(Collectors.joining(","));

        String articleSql = """
                SELECT 
                    id,
                    title,
                    content,
                    summary,
                    date,
                    link
                FROM news
                WHERE id IN (""" + placeholders + ")";


        List<BookmarkArticleDto> articleRows = jdbcTemplate.query(
                articleSql,
                ps -> {
                    int idx = 1;
                    for (Long id : articleIds) {
                        ps.setLong(idx++, id);
                    }
                },
                (rs, rowNum) -> new BookmarkArticleDto(
                        rs.getLong("id"),
                        rs.getString("title"),
                        rs.getString("content"),
                        rs.getString("summary"),
                        rs.getString("date"),
                        rs.getString("link")
                )
        );

        Map<Long, BookmarkArticleDto> articleMap = articleRows.stream()
                .collect(Collectors.toMap(
                        BookmarkArticleDto::getId,
                        Function.identity()
                ));

        List<BookmarkArticleDto> ordered = articleIds.stream()
                .map(id -> articleMap.getOrDefault(
                        id,
                        new BookmarkArticleDto(id, null, null, null, null, null)
                ))
                .toList();

        return new BookmarkListResponse(ordered.size(), ordered);
    }

    public void addBookmark(Long userId, Long articleId) {
        String existsSql = "SELECT COUNT(*) FROM bookmarks WHERE user_id = ? AND article_id = ?";
        Integer cnt = jdbcTemplate.queryForObject(existsSql, Integer.class, userId, articleId);
        if (cnt != null && cnt > 0) {
            return;
        }

        String insertSql = "INSERT INTO bookmarks(user_id, article_id) VALUES(?, ?)";
        jdbcTemplate.update(insertSql, userId, articleId);
    }

    public void removeBookmark(Long userId, Long articleId) {
        String deleteSql = "DELETE FROM bookmarks WHERE user_id = ? AND article_id = ?";
        jdbcTemplate.update(deleteSql, userId, articleId);
    }
}
