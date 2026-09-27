# GPU worker preflight workflow

GPU renderer changes are developed on `gpu-dev`. Runpod production continues to build from `main`, so experiments on `gpu-dev` do not trigger a production GPU rollout.

## CI gate

Every push to `gpu-dev` builds the production `gpu-render-worker/Dockerfile` and runs `/app/ci-preflight.sh` inside that image. The suite validates:

- Node syntax for renderer and preflight scripts
- Python syntax and handler unit tests
- Chromium, FFmpeg, Node and Python availability
- Xvfb startup
- Puppeteer + Chromium browser startup inside the production image
- H.264 encoder availability
- rejection of known-bad Chromium GL flags
- DBus environment sanitization required by the Runpod container

A change should not be merged to `main` unless `gpu-worker-preflight` is green.

## GPU-specific smoke test

CPU CI cannot prove NVIDIA driver/EGL/ANGLE behavior. The production worker therefore supports a short Runpod diagnostic job:

```json
{"input":{"mode":"preflight"}}
```

It checks `nvidia-smi`, launches Chromium using the same Runpod-compatible hardware-WebGL strategies, rejects SwiftShader/llvmpipe/software rasterizers, reports the WebGL vendor/renderer, Chromium version, FFmpeg version and NVENC availability, and returns `GPU_PREFLIGHT_OK` without loading a MediaOS shot or rendering a 20-second video.

Only after this GPU smoke test passes should a real Spline shot render be used for visual validation.
