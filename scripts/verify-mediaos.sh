#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/devtools/verification/compose.yaml"
RUN_ID="mediaosverify$(date +%s)$$"
COMPOSE=(docker compose --project-name "$RUN_ID" --file "$COMPOSE_FILE")

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker with the Compose plugin is required. No tests were started." >&2
  exit 2
fi
if ! docker info >/dev/null 2>&1; then
  echo "Docker Engine is unavailable. No tests were started." >&2
  exit 2
fi

cleanup() {
  "${COMPOSE[@]}" down --volumes --remove-orphans >/dev/null 2>&1 || true
}
trap cleanup EXIT

for service in asset-check backend frontend remotion; do
  printf '\n=== MediaOS isolated verification: %s ===\n' "$service"
  "${COMPOSE[@]}" run --rm "$service"
done

printf '\nAll four isolated MediaOS verification stages completed successfully.\n'
printf 'No GitHub Actions, Railway deployment, Codex task or render was started.\n'
