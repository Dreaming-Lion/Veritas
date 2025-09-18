#!/usr/bin/env bash
# logs.sh

set -euo pipefail

# .env 자동 로드
set -a
[ -f .env ] && . ./.env
set +a

PROJECT_NAME="${PROJECT_NAME:-Veritas}"

# docker compose(v2)/docker-compose(v1) 래퍼
dc() {
  if docker compose version &>/dev/null; then
    docker compose "$@"
  else
    docker-compose "$@"
  fi
}

usage() {
  cat <<'EOF'
사용법:
  ./logs.sh                    # 서비스 선택 메뉴
  ./logs.sh <service> [옵션]   # 특정 서비스 로그
  ./logs.sh all [옵션]         # 모든 서비스 로그

옵션:
  -f, --follow                 로그 팔로우
  --since <기간>               예: 10m, 1h, 2025-09-01T00:00:00
  --tail <라인수>              마지막 N라인만 출력 (기본 300)
  --timestamps                 타임스탬프 출력
  help                         이 도움말 보기

예시:
  ./logs.sh backend -f
  ./logs.sh frontend --since 10m --tail 500
  ./logs.sh all -f --timestamps
EOF
}

# 사전 체크
if ! command -v docker &>/dev/null; then
  echo "❌ Docker가 설치되어 있지 않습니다."
  exit 1
fi
if [ ! -f docker-compose.yml ] && [ ! -f docker-compose.yaml ]; then
  echo "❌ docker-compose.yml 파일이 현재 디렉터리에 없습니다."
  exit 1
fi

# 서비스 목록 가져오기
services_raw=$(dc ps --services 2>/dev/null || true)
if [ -z "${services_raw}" ]; then
  echo "ℹ️  현재 실행 중인 서비스가 없습니다. (빌드 전이면 'docker compose config --services'를 사용합니다)"
  services_raw=$(dc config --services 2>/dev/null || true)
fi

if [ -z "${services_raw}" ]; then
  echo "❌ 서비스를 찾을 수 없습니다. compose 파일을 확인하세요."
  exit 1
fi

mapfile -t SERVICES < <(echo "${services_raw}")

# 인자 파싱
if [[ "${1:-}" == "help" ]]; then
  usage
  exit 0
fi

TARGET="${1:-}"
shift || true

# 공통 로그 옵션 빌드
LOG_OPTS=()
TAIL_DEFAULT=300

while [[ $# -gt 0 ]]; do
  case "$1" in
    -f|--follow) LOG_OPTS+=("--follow"); shift ;;
    --since) LOG_OPTS+=("--since" "${2:-}"); shift 2 ;;
    --tail) LOG_OPTS+=("--tail" "${2:-}"); shift 2 ;;
    --timestamps) LOG_OPTS+=("--timestamps"); shift ;;
    *) echo "알 수 없는 옵션: $1"; usage; exit 1 ;;
  esac
done

# tail 기본값 설정 (사용자가 지정 안했을 때만)
if [[ ! " ${LOG_OPTS[*]-} " =~ " --tail " ]]; then
  LOG_OPTS+=("--tail" "${TAIL_DEFAULT}")
fi

select_menu() {
  echo "📜 로그를 볼 서비스를 선택하세요:"
  local i=1
  for s in "${SERVICES[@]}"; do
    echo "  $i) $s"
    ((i++))
  done
  echo "  a) all (모든 서비스)"
  echo "  q) 종료"
  read -r -p "> " sel

  if [[ "$sel" == "q" ]]; then
    exit 0
  elif [[ "$sel" == "a" ]]; then
    TARGET="all"
  elif [[ "$sel" =~ ^[0-9]+$ ]] && (( sel>=1 && sel<=${#SERVICES[@]} )); then
    TARGET="${SERVICES[$((sel-1))]}"
  else
    echo "❌ 잘못된 선택"
    exit 1
  fi
}

if [ -z "${TARGET}" ]; then
  select_menu
fi

# 대상 검증 및 로그 출력
if [[ "${TARGET}" == "all" ]]; then
  echo "📟 모든 서비스 로그 출력 (${LOG_OPTS[*]})"
  # 서비스 이름을 명시적으로 전달해서 순서 고정
  dc logs "${LOG_OPTS[@]}" "${SERVICES[@]}"
else
  # 존재하는 서비스인지 체크
  if ! printf '%s\n' "${SERVICES[@]}" | grep -qx "${TARGET}"; then
    echo "❌ '${TARGET}' 서비스가 존재하지 않습니다."
    echo "가능한 서비스:"
    printf ' - %s\n' "${SERVICES[@]}"
    exit 1
  fi
  echo "📟 ${TARGET} 서비스 로그 출력 (${LOG_OPTS[*]})"
  dc logs "${LOG_OPTS[@]}" "${TARGET}"
fi
