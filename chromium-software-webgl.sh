#!/bin/sh
set -eu
exec /usr/bin/chromium-browser "$@" --use-gl=swiftshader-webgl --enable-unsafe-swiftshader
