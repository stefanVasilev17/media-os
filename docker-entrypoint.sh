#!/bin/sh
set -eu

if [ "${RAILWAY_SERVICE_NAME:-}" = "media-os-render-worker" ] || [ "${MEDIA_OS_PROCESS_ROLE:-}" = "render-worker" ]; then
  exec node /app/render-worker/worker.mjs
fi

exec java -jar /app/app.jar
