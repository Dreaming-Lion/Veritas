@Entity
@Table(name = "bookmarks")
public class Bookmark {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) // 자동 증가 ID
    private Long id;

    private String bookmarkId; // 북마크의 고유 식별자
    private String targetId;   // 북마크 대상의 ID (예: 댓글 ID)
    private String targetType; // 대상 타입 (예: comment, article 등)
    private String content;    // 북마크 대상의 내용

    private LocalDateTime createdAt; // 북마크 생성 시간

    @ManyToOne(fetch = FetchType.LAZY) // 사용자와 다대일 관계
    @JoinColumn(name = "user_id")      // 외래 키로 연결
    private User user;                 // 북마크를 등록한 사용자
}
