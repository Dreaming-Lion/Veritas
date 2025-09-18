# Veritas

## 🌞 프로젝트 소개


## 🐳 Docker 로 실행하기

```bash
# Docker 컨테이너 실행
./start-dev.sh

# log 확인
./logs.sh

# Docker 컨테이너 종료
./stop.sh

# Docker 자원 정리
./clean-docker.sh
```

<br>

## 📝 커밋 메시지 컨벤션

```
feat        : 새로운 기능 추가
fix         : 버그 수정
docs        : 문서 수정
style       : 코드 포맷팅, 세미콜론 누락 등
refactor    : 코드 리팩토링
test        : 테스트 코드 추가/수정
chore       : 빌드 업무 수정, 패키지 매니저 수정 등
```

#### 예시
```
feat(frontend): 로그인 페이지 UI 구현
fix(backend): 사용자 인증 API 버그 수정
docs: README 업데이트
style(frontend): 코드 포맷팅 적용
```