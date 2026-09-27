#!/bin/bash
# 홈서버 배포. 배포 잡이 .env(IMAGE·IMAGE_TAG)를 만든 뒤 이 디렉터리에서 부른다.
# pull → 교체(up -d) → healthy 대기 → 이미지 정리. 정적 서빙이라 마이그레이션·순서 의존이 없다.
set -euo pipefail
cd "$(dirname "$0")"

wait_healthy() {
  local service=$1 deadline=$(( $(date +%s) + ${READY_TIMEOUT_SECONDS:-90} ))
  while :; do
    local state
    state=$(docker compose ps --format '{{.Service}} {{.Health}}' "$service" | awk '{print $2}')
    [ "$state" = "healthy" ] && { echo "$service healthy"; return 0; }
    if [ "$(date +%s)" -ge "$deadline" ]; then
      echo "$service: healthy 대기 초과 — 로그:" >&2
      docker compose logs --tail 50 "$service" >&2 || true
      return 1
    fi
    sleep 3
  done
}

# BE 네트워크가 없으면 cloudflared가 못 붙는다 — BE compose가 먼저 떠 있어야 한다
docker network inspect "${BE_NETWORK:-caquick_default}" > /dev/null
echo "== pull"
docker compose pull --quiet
echo "== up"
docker compose up -d --remove-orphans
wait_healthy admin
docker image prune -f > /dev/null
echo "== done: $(grep '^IMAGE_TAG=' .env)"
