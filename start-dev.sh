#!/usr/bin/env bash
# start-dev.sh

set -euo pipefail

echo "🚀 Veritas 프로젝트를 시작합니다..."

# .env 자동 로드
set -a
[ -f .env ] && . ./.env
set +a

# 기본값
PROJECT_NAME="${PROJECT_NAME:-Veritas}"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"
BACKEND_PORT="${BACKEND_PORT:-8080}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
AI_PORT="${AI_PORT:-8001}"

# docker compose(v2)/docker-compose(v1) 래퍼
dc() {
  if docker compose version &>/dev/null; then
    docker compose "$@"
  else
    docker-compose "$@"
  fi
}

# 사전 체크
if ! command -v docker &>/dev/null; then
  echo "❌ Docker가 설치되어 있지 않습니다. Docker를 먼저 설치해주세요."
  exit 1
fi

if [ ! -f docker-compose.yml ] && [ ! -f docker-compose.yaml ]; then
  echo "❌ docker-compose.yml 파일이 현재 디렉터리에 없습니다."
  exit 1
fi

# 이미 실행 중인지 확인 (현재 compose 프로젝트 기준)
running_services=$(dc ps --status running --services 2>/dev/null || true)
if [ -n "${running_services}" ]; then
  echo "⚠️  이미 실행 중인 컨테이너가 있습니다:"
  echo "${running_services}" | sed 's/^/   - /'
  read -r -p "기존 컨테이너를 중지하고 새로 시작할까요? (y/n) " ans
  if [[ "$ans" =~ ^[Yy]$ ]]; then
    echo "🛑 기존 컨테이너를 중지합니다..."
    dc down --remove-orphans
  else
    echo "❌ 시작을 취소했습니다."
    exit 1
  fi
fi

echo "🐳 Docker Compose로 서비스를 시작합니다..."
dc up -d --build

echo "📊 서비스 상태를 확인합니다..."
sleep 5
dc ps

echo ""
echo "🔍 포트 확인:"
echo "   - Frontend(React):   http://localhost:${FRONTEND_PORT}"
echo "   - Backend(Spring):   http://localhost:${BACKEND_PORT}"
echo "   - AI(FastAPI):       http://localhost:${AI_PORT}"
echo "   - Postgres:          localhost:${POSTGRES_PORT}"

echo ""
echo "✅ Veritas가 성공적으로 시작되었습니다!"
echo "🌐 Frontend(React Dev):   http://localhost:${FRONTEND_PORT}"
echo "🔧 Backend(Spring Boot):  http://localhost:${BACKEND_PORT}"
echo "🧠 AI Service(FastAPI):   http://localhost:${AI_PORT}"
echo ""
echo "🛑 중지하려면 './stop.sh' 를 사용하세요."
echo "📝 로그는 './logs.sh' 로 확인하세요. (예: backend 로그 'docker compose logs -f backend')"
