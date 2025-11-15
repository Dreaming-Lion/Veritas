@Service
public class BookmarkService {

    private final BookmarkRepository bookmarkRepository;
    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    public BookmarkService(BookmarkRepository bookmarkRepository, UserRepository userRepository, JwtUtil jwtUtil) {
        this.bookmarkRepository = bookmarkRepository;
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
    }

    // 북마크 등록
    public BookmarkResponse createBookmark(String token, BookmarkRequest request) {
        String userId = jwtUtil.extractUserId(token); // 토큰에서 사용자 ID 추출
        User user = userRepository.findByUserId(userId).orElseThrow(); // 사용자 조회

        Bookmark bookmark = new Bookmark();
        bookmark.setBookmarkId(UUID.randomUUID().toString()); // 고유 북마크 ID 생성
        bookmark.setTargetId(request.getTargetId());
        bookmark.setTargetType("comment"); // 예시로 comment 고정
        bookmark.setContent("좋은 글 감사합니다."); // 예시 내용
        bookmark.setCreatedAt(LocalDateTime.now());
        bookmark.setUser(user);

        bookmarkRepository.save(bookmark); // DB에 저장

        // 응답 DTO 생성
        BookmarkResponse response = new BookmarkResponse();
        response.setBookmarkId(bookmark.getBookmarkId());
        response.setTargetId(bookmark.getTargetId());
        response.setTargetType(bookmark.getTargetType());
        response.setContent(bookmark.getContent());
        response.setCreatedAt(bookmark.getCreatedAt());

        return response;
    }

    // 북마크 목록 조회 (페이징)
    public Page<BookmarkResponse> getBookmarks(String token, int page) {
        String userId = jwtUtil.extractUserId(token);
        User user = userRepository.findByUserId(userId).orElseThrow();

        Page<Bookmark> bookmarks = bookmarkRepository.findByUser(user, PageRequest.of(page, 10));

        // Bookmark → BookmarkResponse로 변환
        return bookmarks.map(b -> {
            BookmarkResponse res = new BookmarkResponse();
            res.setBookmarkId(b.getBookmarkId());
            res.setTargetId(b.getTargetId());
            res.setTargetType(b.getTargetType());
            res.setContent(b.getContent());
            res.setCreatedAt(b.getCreatedAt());
            return res;
        });
    }

    // 북마크 삭제
    public void deleteBookmark(String token, String bookmarkId) {
        String userId = jwtUtil.extractUserId(token);
        Bookmark bookmark = bookmarkRepository.findByBookmarkId(bookmarkId)
            .orElseThrow(() -> new NotFoundException("Bookmark not found"));

        // 본인 북마크인지 확인
        if (!bookmark.getUser().getUserId().equals(userId)) {
            throw new AccessDeniedException("Unauthorized");
        }

        bookmarkRepository.delete(bookmark); // 삭제
    }
}
