# MediaOS Phase A: independent Railway builds and render benchmark

## Scope

This is an opt-in rollout. No LOCKED EP001 visual source files, rendering profiles, database migrations, object storage or production job records are modified.

## Build separation

- Dockerfile.backend builds the frontend and Maven backend; the Maven package lifecycle runs backend tests; the final image is Java only.
- Dockerfile.remotion-worker typechecks and bundles Remotion at Docker build time, prunes build-only dependencies, and runs the existing Remotion CPU worker with Chromium, FFmpeg and Xvfb.
- The original Dockerfile remains for rollback. The root railway.json retains its deploy settings but no longer forces every service to build the original shared Dockerfile.
- Remotion worker still uses docker-entrypoint.sh with MEDIA_OS_PROCESS_ROLE=render-worker.
- No new parallel replicas, scene changes or x264 options.

## Production rollout

1. Confirm Railway production has no critical active render and both services are healthy.
2. Point media-os-render-worker to Dockerfile.remotion-worker. Preserve variables, the existing worker start command, one replica, and remotion-engine/** watch patterns. The root railway.json no longer forces the legacy Dockerfile path; verify the effective Dockerfile in build logs.
3. Verify Docker build passes Remotion typecheck and bundle, then verify that the worker logs the existing renderConcurrency=2 and successfully renders a non-LOCKED preview.
4. Point media-os-backend to Dockerfile.backend. Preserve /actuator/health and backend/frontend watch patterns. Keep remotion-engine/** in the BACKEND watch patterns until the backend render-hash identity is decoupled from the backend source/build version.
5. Verify backend health, metadata and video-serving endpoints. Compare independent image build times to the previous shared build.
6. Roll back any failing service by restoring its Dockerfile path to Dockerfile and redeploying the last known-good Railway image. Preserve all LOCKED renders and database records.

## Benchmark

Inside remotion-engine on a machine with Chromium and FFmpeg installed:

    MEDIA_OS_BENCH_COMPOSITION=EP001-PhoneFirst-Youtube MEDIA_OS_BENCH_FRAMES=300 node benchmark-concurrency.mjs

The script compares equal frames at concurrency 1 and 2 and writes output MP4s plus summary.json to a temporary directory. It never claims production queue jobs. Run only on isolated or idle resources, inspect visual quality and compare repeated runs before changing production concurrency.

## Acceptance

- Both Docker images build and the services start correctly.
- Remotion TypeScript validation and bundling block broken builds before production.
- Backend Maven tests run and pass before a new backend image deploys.
- Existing cache identity is preserved whenever Remotion source changes.
- Measured render wall-time gains and output quality verified before scaling.
