#!/usr/bin/env bash
set -euo pipefail

export DISPLAY="${DISPLAY:-:99}"

Xvfb "${DISPLAY}" -screen 0 1920x1080x24 -ac -nolisten tcp +extension GLX +render -noreset >/tmp/xvfb.log 2>&1 &
XVFB_PID=$!

cleanup() {
  kill "${XVFB_PID}" >/dev/null 2>&1 || true
}
trap cleanup EXIT INT TERM

for _ in $(seq 1 50); do
  if xdpyinfo -display "${DISPLAY}" >/dev/null 2>&1; then
    break
  fi
  sleep 0.1
done

exec python3 /app/handler.py
