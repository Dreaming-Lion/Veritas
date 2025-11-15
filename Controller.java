@RestController
@RequestMapping("/api/bookmark")
public class BookmarkController {

    private final BookmarkService bookmarkService;

    public BookmarkController(BookmarkService bookmarkService) {
        this.bookmarkService = bookmarkService;
    }

    // 북마크 등록 API
    @PostMapping
    public ResponseEntity<BookmarkResponse> createBookmark(
        @RequestHeader("Authorization") String authHeader,
        @RequestBody BookmarkRequest request
    ) {
        String token = authHeader.replace("Bearer ", ""); // 토큰 추출
        BookmarkResponse response = bookmarkService.createBookmark(token, request);
        return ResponseEntity.ok(response); // 200 OK 응답
    }

    // 북마크 조회 API
    @GetMapping
    public ResponseEntity<Page<BookmarkResponse>> getBookmarks(
        @RequestHeader("Authorization") String authHeader,
        @RequestParam int page
    ) {
        String token = authHeader.replace("Bearer ", "");
        return ResponseEntity.ok(bookmarkService.getBookmarks(token, page));
    }

    // 북마크 삭제 API
    @DeleteMapping("/{bookmarkId}")
    public ResponseEntity<?> deleteBookmark(
        @RequestHeader("Authorization") String authHeader,
        @PathVariable String bookmarkId
    ) {
        String token = authHeader.replace("Bearer ", "");
        bookmarkService.deleteBookmark(token, bookmarkId);
        return ResponseEntity.ok().build(); // 빈 응답 반환
    }
}