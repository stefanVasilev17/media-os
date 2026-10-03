FROM node:22-bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive \
    DISPLAY=:99 \
    CHROMIUM_PATH=/usr/bin/chromium \
    NVIDIA_VISIBLE_DEVICES=all \
    NVIDIA_DRIVER_CAPABILITIES=compute,utility,graphics,video,display \
    PYTHONUNBUFFERED=1

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        chromium \
        ffmpeg \
        xvfb \
        x11-utils \
        python3 \
        python3-pip \
        python3-venv \
        ca-certificates \
        curl \
        procps \
        pciutils \
        libglvnd0 \
        libegl1 \
        libgl1 \
        libgles2 \
        libvulkan1 \
        vulkan-tools \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY gpu-render-worker/package.json /app/package.json
RUN npm install --omit=dev --no-audit --no-fund

COPY remotion-engine /app/remotion-engine

COPY gpu-render-worker/requirements.txt /app/requirements.txt
RUN pip3 install --break-system-packages --no-cache-dir -r /app/requirements.txt

COPY gpu-render-worker/handler.py /app/handler.py
COPY gpu-render-worker/render.mjs /app/render.mjs
COPY gpu-render-worker/render-remotion.mjs /app/render-remotion.mjs
COPY gpu-render-worker/gpu-preflight.mjs /app/gpu-preflight.mjs
COPY gpu-render-worker/ci-browser-smoke.mjs /app/ci-browser-smoke.mjs
COPY gpu-render-worker/ci-preflight.sh /app/ci-preflight.sh
COPY gpu-render-worker/test_handler.py /app/test_handler.py
COPY gpu-render-worker/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh /app/ci-preflight.sh

ENTRYPOINT ["/app/entrypoint.sh"]
