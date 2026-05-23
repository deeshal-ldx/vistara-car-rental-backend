#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Load optional config: scripts/deploy.env or repo/deploy.env
for config in "${SCRIPT_DIR}/deploy.env" "${REPO_ROOT}/deploy.env"; do
  if [[ -f "${config}" ]]; then
    # shellcheck disable=SC1090
    source "${config}"
    break
  fi
done

GIT_REMOTE="${GIT_REMOTE:-origin}"
GIT_BRANCH="${GIT_BRANCH:-main}"
DEPLOY_USER="${DEPLOY_USER:-vistara}"
APP_DIR="${APP_DIR:-${REPO_ROOT}}"
PM2_APP_NAME="${PM2_APP_NAME:-vistara-car-rental-backend}"
PM2_START_CMD="${PM2_START_CMD:-npm -- start}"
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:8000/api/v1/health}"
GIT_RESET_HARD="${GIT_RESET_HARD:-0}"

usage() {
  cat <<EOF
Usage: $(basename "$0") [options]

Deploy the Vistara backend: fetch, update code, install, build, restart PM2.

Options:
  --reset-hard    Force sync to origin/<branch> (git reset --hard)
  --branch NAME   Git branch (default: ${GIT_BRANCH})
  --app-dir PATH  Repo path on server (default: ${APP_DIR})
  --help          Show this help

Config file (optional): scripts/deploy.env
  See scripts/deploy.env.example

Environment overrides: GIT_BRANCH, APP_DIR, DEPLOY_USER, PM2_APP_NAME, etc.
EOF
}

RESET_HARD="${GIT_RESET_HARD}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --reset-hard) RESET_HARD=1 ;;
    --branch) GIT_BRANCH="$2"; shift ;;
    --app-dir) APP_DIR="$2"; shift ;;
    --help|-h) usage; exit 0 ;;
    *) echo "Unknown option: $1" >&2; usage; exit 1 ;;
  esac
  shift
done

if [[ ! -d "${APP_DIR}" ]]; then
  echo "ERROR: APP_DIR does not exist: ${APP_DIR}" >&2
  exit 1
fi

run_as_deploy_user() {
  if [[ "$(id -u)" -eq 0 ]]; then
    sudo -u "${DEPLOY_USER}" -H bash -lc "$*"
  else
    bash -lc "$*"
  fi
}

log() {
  echo "[deploy $(date '+%H:%M:%S')] $*"
}

log "App dir:    ${APP_DIR}"
log "Branch:     ${GIT_REMOTE}/${GIT_BRANCH}"
log "PM2 app:    ${PM2_APP_NAME}"
log "Deploy as:  ${DEPLOY_USER:-$(whoami)}"

run_as_deploy_user "cd '${APP_DIR}' && git fetch ${GIT_REMOTE}"

if [[ "${RESET_HARD}" == "1" ]]; then
  log "Syncing with git reset --hard ${GIT_REMOTE}/${GIT_BRANCH}"
  run_as_deploy_user "cd '${APP_DIR}' && git checkout ${GIT_BRANCH} && git reset --hard ${GIT_REMOTE}/${GIT_BRANCH}"
else
  log "Updating with git pull ${GIT_REMOTE} ${GIT_BRANCH}"
  run_as_deploy_user "cd '${APP_DIR}' && git checkout ${GIT_BRANCH} && git pull ${GIT_REMOTE} ${GIT_BRANCH} --no-rebase"
fi

run_as_deploy_user "cd '${APP_DIR}' && git log -1 --oneline"

log "Installing dependencies..."
run_as_deploy_user "cd '${APP_DIR}' && npm install"

log "Building..."
run_as_deploy_user "cd '${APP_DIR}' && npm run build"

log "Restarting PM2..."
if run_as_deploy_user "pm2 describe '${PM2_APP_NAME}' >/dev/null 2>&1"; then
  run_as_deploy_user "pm2 restart '${PM2_APP_NAME}' --update-env"
else
  log "PM2 app not found — starting ${PM2_APP_NAME}"
  run_as_deploy_user "cd '${APP_DIR}' && pm2 start ${PM2_START_CMD} --name '${PM2_APP_NAME}'"
fi

run_as_deploy_user "pm2 save"

if [[ -n "${HEALTH_URL}" ]]; then
  log "Health check: ${HEALTH_URL}"
  if curl -sf "${HEALTH_URL}" >/dev/null; then
    curl -s "${HEALTH_URL}"
    echo ""
    log "Deploy complete — health OK"
  else
    echo "WARNING: Health check failed for ${HEALTH_URL}" >&2
    run_as_deploy_user "pm2 logs '${PM2_APP_NAME}' --lines 20 --nostream" || true
    exit 1
  fi
else
  log "Deploy complete (health check skipped)"
fi
