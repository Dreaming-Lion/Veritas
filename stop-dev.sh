#!/usr/bin/env bash
# stop.sh

set -euo pipefail

echo "🛑 Veritas 컨테이너를 중지합니다..."

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

if ! command -v docker &>/dev/null; then
  echo "❌ Docker가 설치되어 있지 않습니다."
  exit 1
fi

if [ ! -f docker-compose.yml ] && [ ! -f docker-compose.yaml ]; then
  echo "❌ docker-compose.yml 파일이 현재 디렉터리에 없습니다."
  exit 1
fi

# 이미 떠있는 컨테이너만 종료
if dc ps | grep -q "Up"; then
  dc down --remove-orphans
  echo "✅ 컨테이너 중지 완료"
else
  echo "ℹ️  실행 중인 컨테이너가 없습니다."
fi

echo "🔚 완료."
