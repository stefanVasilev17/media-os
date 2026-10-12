#!/bin/sh
set -eu

export LIBGL_ALWAYS_SOFTWARE=1
export GALLIUM_DRIVER=llvmpipe
export MESA_LOADER_DRIVER_OVERRIDE=llvmpipe

if [ -x /usr/lib/chromium/chromium ]; then
  CHROMIUM_BIN=/usr/lib/chromium/chromium
elif [ -x /usr/bin/chromium ]; then
  CHROMIUM_BIN=/usr/bin/chromium
else
  echo "Chromium binary not found" >&2
  exit 127
fi

exec "$CHROMIUM_BIN" "$@" \
  --no-sandbox \
  --disable-setuid-sandbox \
  --use-gl=angle \
  --use-angle=gl \
  --ignore-gpu-blocklist \
  --disable-gpu-compositing \
  --disable-gpu-sandbox \
  --ozone-platform=x11
