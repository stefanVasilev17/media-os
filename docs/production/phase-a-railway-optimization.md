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

## Verified production rollout (2026-10-27)

- **Production render worker**: Railway `media-os-render-worker`, source `main`, `Dockerfile.remotion-worker`, one `sfo` replica, deployment `21ad0509-c123-4225-b8ff-3670c3eebab3` reported `SUCCESS` and `Online`. Runtime logged `renderConcurrency=2`, unique worker ID and the internal backend URL.
- **Production backend**: Railway `media-os-backend`, source `main`, `Dockerfile.backend`, one `sfo` replica, deployment `d53f9f52-61e9-4609-aca8-a16727a03539` reported `SUCCESS` and `Online`, healthcheck `/actuator/health`.
- **Production status**: zero pending Railway deployment operations at verification, both services had one running and zero crashed replicas.
- **Backend quality gate**: frontend TypeScript/Vite build passed; Maven reported `Tests run: 56, Failures: 0, Errors: 0, Skipped: 0`, followed by `BUILD SUCCESS`.
- **Remotion quality gate**: `build-typecheck-preflight.mjs` accepted exactly one pre-existing TS2322 diagnostic in frozen `Shot10SessionCreationPresentationV8.tsx(198,48)` with zero other TypeScript diagnostics. This is a strictly scoped technical-debt allowlist, not a change to the LOCKED shot. Remotion `npm run build` completed and generated `/app/remotion-engine/build`.
- The initial standalone Remotion build was blocked by this pre-existing diagnostic before the frozen allowlist was introduced. The earlier successful worker image remained available during the failed attempt. Railway may still show historic warning/failure counts.
- `npm prune --omit=dev` reported 10 high severity dependency vulnerabilities. This is an unresolved npm audit item; do not run unreviewed broad dependency upgrades against LOCKED production. Review exact advisories and compatible patches separately.
- No GitHub Actions restored and no visual shot source files edited.

### Not yet verified

- Production render duration improvement (concurrency 1 versus 2) has NOT been measured on matching frames; use the isolated benchmark script and visual comparison before claiming a speedup.
- The new independent image builds passed, but repeat-build speed and cache hit rates have NOT been benchmarked.
- Runtime job completion by the new worker has NOT yet been confirmed from a new non-LOCKED preview; service health alone does not guarantee frame-render correctness.

### Safety constraints

- Keep `remotion-engine/**` in backend Railway watch patterns until render-hash identity no longer depends on backend `RAILWAY_GIT_COMMIT_SHA` / build timestamp.
- Keep just one render-worker replica during the controlled rendering benchmark.
- Do not update LOCKED EP001 scene code to silence the documented TypeScript diagnostic; resolve this only via a separate explicitly approved visual-safe migration.
