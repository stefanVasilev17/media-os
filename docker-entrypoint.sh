#!/bin/sh
set -eu

if [ "${RAILWAY_SERVICE_NAME:-}" = "media-os-render-worker" ] || [ "${MEDIA_OS_PROCESS_ROLE:-}" = "render-worker" ]; then
  export DISPLAY=:99
  export CHROMIUM_PATH=/app/chromium-software-webgl.sh
  Xvfb :99 -screen 0 1600x900x24 -nolisten tcp >/tmp/media-os-xvfb.log 2>&1 &
  sleep 1
  exec node /app/render-worker/worker.mjs
fi

exec java -jar /app/app.jar
