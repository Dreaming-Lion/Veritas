package com.veritas.backend.repository;

import com.veritas.backend.entity.Bookmark;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BookmarkRepository extends JpaRepository<Bookmark, Long> {

    boolean existsByUserIdAndArticleId(Long userId, Long articleId);

    long countByUserId(Long userId);

    void deleteByUserIdAndArticleId(Long userId, Long articleId);
}
