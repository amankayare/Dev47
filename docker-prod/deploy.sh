#!/bin/bash

# Exit on error, undefined vars, and pipe failures
set -euo pipefail

DEPLOY_DIR="/opt/Dev47/docker-prod"
REBUILD_TARGET="${1:-all}"
DEPLOY_BRANCH="${2:-main}"

echo "========================================="
echo " Dev47 — Manual Deployment"
echo " Branch  : ${DEPLOY_BRANCH}"
echo " Rebuild : ${REBUILD_TARGET}"
echo " $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo "========================================="

# Export for Docker build args
export GIT_BRANCH="${DEPLOY_BRANCH}"

# ── Checkout the requested branch on VPS ──────────────────────────
echo ">>> Fetching and checking out '${DEPLOY_BRANCH}'..."
cd /opt/Dev47
git fetch origin
git checkout "${DEPLOY_BRANCH}"
git pull origin "${DEPLOY_BRANCH}"

cd "${DEPLOY_DIR}"

# ── Build the requested target ─────────────────────────────────────
case "${REBUILD_TARGET}" in
  backend)
    echo ">>> Building: backend only"
    docker compose build --no-cache backend
    docker compose up -d backend
    ;;
  caddy)
    echo ">>> Building: caddy (frontend) only"
    docker compose build --no-cache caddy
    docker compose up -d caddy
    ;;
  all|*)
    echo ">>> Building: all services"
    docker compose build --no-cache
    docker compose up -d
    ;;
esac

# ── Health check ───────────────────────────────────────────────────
echo ">>> Waiting for backend to become healthy..."
for i in $(seq 1 12); do
  # Use docker inspect for a robust health check instead of python
  STATUS=$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}unknown{{end}}' docker-prod-backend-1 2>/dev/null || echo "unknown")
  echo "  attempt $i/12 — backend: $STATUS"
  
  if [ "$STATUS" = "healthy" ]; then
    break
  fi
  sleep 5
done

echo ">>> Container status:"
docker compose ps

echo ""
echo ">>> Deployment complete!"
