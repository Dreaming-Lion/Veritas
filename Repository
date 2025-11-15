public interface BookmarkRepository extends JpaRepository<Bookmark, Long> {

    // bookmarkId로 북마크 조회
    Optional<Bookmark> findByBookmarkId(String bookmarkId);

    // 특정 사용자에 대한 북마크 목록 페이징 조회
    Page<Bookmark> findByUser(User user, Pageable pageable);
}