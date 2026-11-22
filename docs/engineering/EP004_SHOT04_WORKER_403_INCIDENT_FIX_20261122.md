# EP004 SHOT04 — Remotion CPU media route 403 incident and production fix

**Date:** 2026-11-22
**Status:** backend fix LIVE; render not retried, no new MP4; Director review pending
**Repo/branch:** `stefanVasilev17/media-os` / `feat/ep004-shot02-real-v8-director-render-20261121`
**Scope:** Shared Railway backend security route authorization; no Remotion visual or locked media edits

## Observed failed render
- Render job: `6f3f9a4c-8ec3-4eb0-a4e7-346b1fec765e`.
- Composition: `EP004-SHOT04-CONTINUOUS-GATEWAYS-V1-VISUAL`.
- Worker source SHA: `dde86a5058f38b12bb7de2bb8368e4796c9ea751`.
- Start 2026-11-22 14:06:46 UTC, `TECHNICAL_PRECHECK_PASS` at `1920x1080@30fps`, `2791` frames.
- Abort before real frame generation: `EP004_SHOT04_APPROVED_CURRENT_TAKE_UNAVAILABLE_403`, on GET `/api/v1/remotion/renders/worker/{renderId}/ep004-shot04-selected-voice`.

## Confirmed root cause
`WorkloadIdentityFilter` resolves the HTTP method/path using `WorkloadRoute.resolve(String,String)` before a controller executes. The reviewed allowlist already included SHOT01–SHOT03 worker voice operations, but omitted SHOT04. It also omitted the required SHOT03 predecessor-video endpoint for the SHOT04 seam. The result was HTTP 403 from the filter; the selected Take controller was never reached. Missing authorization must not be worked around by removing credentials or weakening route scopes.

## Minimal repair
Code commit: `6e3b627d2d1e5e07f071970fdc550036eb89ea49`.

File `backend/src/main/java/com/architecturalthinking/mediaos/system/WorkloadRoute.java` permits exactly:
- `GET /api/v1/remotion/renders/worker/{renderId}/ep004-shot04-selected-voice`
- `GET /api/v1/remotion/renders/worker/{renderId}/ep004-shot04-previous-video`

Both are only `REMOTION_CPU` operations with existing scoped worker token verification. Existing controller-level worker key, worker/source identity, immutable Take selection, pinned source SHA, and verified predecessor blob rules stay unchanged. All other methods and paths remain forbidden.

Regression file `backend/src/test/java/com/architecturalthinking/mediaos/system/WorkloadRouteEp004Shot04Test.java` verifies allowed GETs, wrong-method rejection, invalid UUID rejection and unknown-path rejection.

## Railway verification
- Backend exactly pinned to repair SHA on existing production service `media-os-backend`. Existing Railway deployment `5bfe463c-c547-477f-96a6-3e04ca0cf2d1`: **SUCCESS**; predeploy SHA guard emitted `EP004_SHOT04_SCOPED_MEDIA_ROUTES_SECURITY_FIX_PIN`; `/actuator/health` **PASS**.
- Isolated PostgreSQL Java21 Maven suite: **573 tests, 0 failures, 0 errors, 1 skipped**, **BUILD SUCCESS**; specific new route suite **2 tests PASS**. Existing Flyway 131 migrations validate without schema changes.
- Render worker `media-os-render-worker` stays at approved SHA `dde86a5058f38b12bb7de2bb8368e4796c9ea751`, deployment SUCCESS; PostgreSQL SUCCESS.
- Exactly three existing Railway services; no service, bucket, volume, secret, or paid TTS created. Backend predeploy and source pin updated only to the repair SHA. Documentation may move the Git branch head after the pinned code deploy; do not casually change the live pin.

## Next authorized action / evidence boundary
The failed job is terminal. Do not restart it automatically or re-authorize an expensive CPU render using a worker credential. Director must open the authenticated MediaOS EP004 SHOT04 screen and approve one fresh bounded render using the current selected Slow Natural Take and actual HEAR→SEE cues. Before a new render, validate current readiness, locked SHOT03 SHA and object storage. The worker should fetch private selected Take and predecessor MP4 using the two repaired routes. Verify actual S3 MP4, source SHA, first decoded frame continuity, first 72 frames moving without speech, correct later audio mux and visual clarity. New Shot04 is NOT Director-LOCKED until its rendered MP4 is inspected and expressly approved.

## Visual preservation
Follow `AGENTS.md`, `docs/visual/AT_REMOTION_VISUAL_CONSTITUTION_V1.md`, the Director-LOCKED EP001–EP003 baselines, Remotion-first production Bible and current SHOT04 production scene: same persistent 16:9 Living Technical Interface, dark navy, crisp text, stable architecture geography, semantic camera, visual holds, on-path packets, no filler microcopy or invented visuals. This incident fixed no visuals, so a render must still pass visual inspection before LOCK.
