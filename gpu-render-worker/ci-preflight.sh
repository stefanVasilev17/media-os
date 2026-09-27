#!/usr/bin/env bash
set -euo pipefail

export DISPLAY="${DISPLAY:-:99}"
mkdir -p /tmp/chromium-ci-home /tmp/chromium-ci-runtime
chmod 700 /tmp/chromium-ci-runtime
unset DBUS_SESSION_BUS_ADDRESS || true
unset DBUS_SYSTEM_BUS_ADDRESS || true

node --check /app/render.mjs
node --check /app/gpu-preflight.mjs
node --check /app/ci-browser-smoke.mjs
python3 -m py_compile /app/handler.py
python3 /app/test_handler.py

chromium --version
FFMPEG_VERSION="$(ffmpeg -version 2>&1)"
printf '%s\n' "${FFMPEG_VERSION%%$'\n'*}"
python3 --version
node --version

if grep -Fq -- "--use-angle=gl-egl" /app/render.mjs; then
  echo "Forbidden Chromium flag found: --use-angle=gl-egl" >&2
  exit 1
fi
if grep -Fq -- "'--use-gl=egl'" /app/render.mjs; then
  echo "Forbidden Chromium flag found: --use-gl=egl" >&2
  exit 1
fi
if ! grep -Fq -- "delete env.DBUS_SESSION_BUS_ADDRESS" /app/render.mjs; then
  echo "Chromium DBus environment sanitization is missing." >&2
  exit 1
fi

FFMPEG_ENCODERS="$(ffmpeg -hide_banner -encoders 2>&1)"
if ! grep -Eq 'libx264|h264_nvenc' <<<"$FFMPEG_ENCODERS"; then
  echo "No H.264 encoder is available in ffmpeg." >&2
  printf '%s\n' "$FFMPEG_ENCODERS" | grep -Ei '264|nvenc' || true
  exit 1
fi
printf '%s\n' "$FFMPEG_ENCODERS" | grep -Ei 'libx264|h264_nvenc' || true

Xvfb "${DISPLAY}" -screen 0 1920x1080x24 -ac -nolisten tcp +extension GLX +render -noreset >/tmp/xvfb-ci.log 2>&1 &
XVFB_PID=$!
trap 'kill "${XVFB_PID}" >/dev/null 2>&1 || true' EXIT INT TERM

for _ in $(seq 1 50); do
  if xdpyinfo -display "${DISPLAY}" >/dev/null 2>&1; then
    break
  fi
  sleep 0.1
done

xdpyinfo -display "${DISPLAY}" >/dev/null
node /app/ci-browser-smoke.mjs

echo "GPU_WORKER_CI_PREFLIGHT_OK"
