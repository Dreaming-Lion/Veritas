// 북마크 등록 요청 DTO
public class BookmarkRequest {
    private String targetId; // 북마크 대상의 ID
}

// 북마크 응답 DTO
public class BookmarkResponse {
    private String bookmarkId;
    private String targetId;
    private String targetType;
    private String content;
    private LocalDateTime createdAt;
}
