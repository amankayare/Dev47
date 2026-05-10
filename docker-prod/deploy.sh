#!/bin/bash

# Exit on error, undefined vars, and pipe failures
set -euo pipefail

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Project root is one level up from docker-prod/
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

DEPLOY_DIR="${SCRIPT_DIR}"
REBUILD_TARGET="${1:-all}"
DEPLOY_BRANCH="${2:-main}"

echo "========================================="
echo " Dev47 — Manual Deployment"
echo " Branch  : ${DEPLOY_BRANCH}"
echo " Rebuild : ${REBUILD_TARGET}"
echo " Root    : ${PROJECT_ROOT}"
echo " $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo "========================================="
echo ""
echo "NOTE: Global-Proxy must already be running ('web-network' must exist)."
echo "      Run: cd /opt/Global-Proxy && docker compose up -d"
echo ""

# Export for Docker build args
export GIT_BRANCH="${DEPLOY_BRANCH}"

# ── Checkout the requested branch on VPS ──────────────────────────
echo ">>> Fetching and checking out '${DEPLOY_BRANCH}'..."
cd "${PROJECT_ROOT}"
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
  frontend)
    echo ">>> Building: frontend only"
    docker compose build --no-cache frontend
    docker compose up -d frontend
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
  STATUS=$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}unknown{{end}}' dev47-backend 2>/dev/null || echo "unknown")
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
