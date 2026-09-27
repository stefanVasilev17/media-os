#!/bin/sh
set -eu
export LIBGL_ALWAYS_SOFTWARE=1
export GALLIUM_DRIVER=llvmpipe
export MESA_LOADER_DRIVER_OVERRIDE=llvmpipe
exec /usr/bin/chromium-browser "$@" --use-gl=angle --use-angle=gl --ignore-gpu-blocklist --disable-gpu-compositing --disable-gpu-sandbox --ozone-platform=x11
