#!/usr/bin/env bash
# clean-docker.sh

set -euo pipefail

echo "🧹 Veritas Docker 자원을 깨끗하게 정리합니다..."

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

echo "⚠️  아래 작업을 수행합니다:
  1) 컨테이너/네트워크 종료 및 삭제
  2) Compose로 생성된 볼륨 삭제
  3) 이 프로젝트(${PROJECT_NAME}) 라벨의 이미지/볼륨/네트워크 정리"

read -r -p "진행할까요? (y/n) " ans
if [[ ! "$ans" =~ ^[Yy]$ ]]; then
  echo "❌ 취소했습니다."
  exit 1
fi

echo "🛑 컨테이너/네트워크 중지 및 삭제..."
# -v: compose가 관리하는 볼륨까지 제거
dc down --volumes --remove-orphans || true

echo "🧽 프로젝트 라벨 자원 추가 정리..."
# 프로젝트 라벨의 이미지만 제거 (다른 프로젝트 영향 X)
proj_label="com.docker.compose.project=$(echo "$PROJECT_NAME" | tr '[:upper:]' '[:lower:]')"

# 이미지 제거
img_ids=$(docker images -q --filter "label=${proj_label}" | sort -u || true)
if [ -n "${img_ids}" ]; then
  echo "🗑 이미지 제거..."
  docker rmi -f ${img_ids} || true
else
  echo "ℹ️  제거할 프로젝트 이미지가 없습니다."
fi

# 네트워크 제거 (레거시 잔여물)
net_ids=$(docker network ls -q --filter "label=${proj_label}" || true)
if [ -n "${net_ids}" ]; then
  echo "🗑 네트워크 제거..."
  docker network rm ${net_ids} || true
fi

# 볼륨 추가 제거 (라벨 기반 — compose가 -v로 못 지운 잔여물 대비)
vol_ids=$(docker volume ls -q --filter "label=${proj_label}" || true)
if [ -n "${vol_ids}" ]; then
  echo "🗑 볼륨 추가 제거..."
  docker volume rm ${vol_ids} || true
fi

echo "🧹 사용하지 않는 네트워크/이미지(댕글링) 일반 정리(옵션)..."
read -r -p "docker system prune -f (dangling 자원 정리) 도 수행할까요? (y/n) " prune_ans
if [[ "$prune_ans" =~ ^[Yy]$ ]]; then
  docker system prune -f
fi

echo "✅ 정리 완료!"
