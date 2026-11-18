# EP004 SHOT01 V2 — Premium Living Architecture Render Readiness (2026-11-18)

**Status:** SOURCE CANDIDATE / RENDER NOT YET AUTHORIZED OR VERIFIED. **Do not call this MP4 Director-LOCKED.** The previous standalone Python/Pillow MP4 was rejected by Director and is NOT a visual reference, source, fallback or render input.

## Authority and production lineage

- Strict source: Director-LOCKED EP004 Episode Package JSON, SHA-256 `a47b5d2af200014828089bcfb0812017970a8ecfe623cefc67456359af4fe365`, SHOT01 `An Ordinary Workday Stops`, immutable narration and eight genuine `SHOT01_P## _B##` cue IDs (without spaces in actual IDs).
- Production backend currently tracks `feat/ep003-owner-b-centered-and-header-safe-20261116`, not the diverged `main`. Never reset production to old main.
- Video release uses **existing** backend + shared Remotion worker + Postgres, existing private S3 bucket. No shot-specific service, new volume, binary PostgreSQL writes or paid ElevenLabs requests.
- The approved Take, provider alignment and measured duration stay the sole authoritative HEAR → SEE timing; **do not** substitute preview/editorial cue times for render inputs.
- Authenticated Director separately authorizes a single bounded CPU render. Default `MEDIA_OS_REMOTION_CLAIMS_ENABLED=false` is preserved until render gate and Director authorization; no bypass.

## V2 visual parity implementation

1. Use the original `ATBackground`, `ATCameraRig`, `ATControlledRealismLayer`, `AT_FONT` primitives used by EP001–EP003. Panel border, glow, colors, gradients and legibility follow the actual EP002/EP003 living-world styles. It is a new EP004 Outlook client in the **same** visual system, not a fabricated full-screen browser screenshot or an EP002 login text swap.
2. Place one recognizable client anchor (small Outlook mailbox), one shared gateway, one server fleet and muted other services in ONE connected world. Reuse the original shared EP004 world and camera functions; do not reset camera or node geometry on the SHOT02 seam.
3. `EP004_SHOT01_LAYOUT` is immutable canonical node geometry, checked against the shared `EP004_MAIL_ROUTE` / `EP004_STANDBY_ROUTE`. Main request position is always `ep004RoutePosition(EP004_MAIL_ROUTE, routeProgress)`. **No detached secondary request particle in SHOT01**. The standby connector remains a quiet visual possibility until SHOT02 narratively explains failover.
4. Keep active world motion during the 60-frame no-narration prelude. No static screenshot covers motion at a seam; the first output shot starts within a living diagram. Store exact final world/camera/request state for SHOT02's initial frame and later do real decoded MP4 seam QA.
5. No redundant generic floating status cards, no cards inside explanatory cards, no unsupported claim that all Microsoft 365 services failed, no clipped panel labels. Original architecture nodes keep meaningful internal labels.
6. Protect the three prior episodes' exact approved MP4s/voice, and never call a code/build PASS a human visual LOCK.

## Previously discovered release defects integrated in this candidate

- Proven real Slow Natural Take persisted mode is `ELEVEN_V4_AUTO_SLOW_NATURAL_PAUSES_V1`, not literal `SLOW_NATURAL`; the EP004 readiness check now accepts only the canonical persisted mode, never rewrites an existing approved Take or falsely accepts Standard.
- Recognize `[pause]` / `[long pause]` control spans in ElevenLabs returned alignment without treating them as spoken words. Retain the provider's original character/time indices and reject any missing source-locked cue; show the first unmatched cue ID.
- Shared worker accepts the **exact** composition target `EP004-SHOT01-ORDINARY-WORKDAY-V1-VISUAL` as a restricted scope; no broad wildcard or paid/automatic claim is introduced. Existing EP002 scopes retained.

## Reproducible QA and execution gates

1. `cd remotion-engine && npm ci && node --test ep004-shot01-world.test.mjs ep004-shot01-visual-parity-v2.test.mjs worker-claim-authorization.test.mjs && npm run typecheck && npm run build && npm run build:factory`.
2. `cd backend && mvn -B --no-transfer-progress clean verify` with existing isolated PostgreSQL 18 test environment; confirm `Ep004Shot01DirectorRenderServiceTest` and no protected EP003 Slow Natural regression.
3. Use the existing production frontend TypeScript build and tests. After CI, render static frames from the **actual Remotion bundle** at frame 0, 1, 20, 59, each of eight real cue positions, and exit frame. Compare against EP001/EP002/EP003 Director-approved frames for client/node geometry, palette, typography, visual richness, overflow and EXACT route/particle overlap. No Python/Pillow recreation may stand in for Remotion frame QA.
4. Confirm authenticated `GET /api/v1/episode-packages/{id}/shots/SHOT01/render-readiness`: `ready=true`, all eight REAL alignment-derived cues, selected original S3-backed approved Slow Natural Take, original source hash, measured `durationInFrames` and matched live worker SHA.
5. Before one actual production job: enforce P0 storage safety; scope existing worker to exact composition; ensure shared CPU concurrency=1, require authenticated audited Director consent, no TTS rerun. Render via existing Director button to private S3. No direct anonymous API render or worker claims auto-on.
6. Inspect real video with `ffprobe`: H.264/AAC, 1920×1080, 30 fps, measured frame count and audio. Verify private S3 object size and SHA/readback, playback, every HEAR → SEE cue, text fit, packet-on-path, 60 moving opening frames, last decoded frame/camera continuity to SHOT02. Record IDs and SHA in `PROJECT_STATE.md`.
7. Candidate stays **NOT LOCKED** until Director watches and explicitly approves; only then create the verified immutable master.

## Evidence / limitations at authoring

This branch contains V2 source, geometry & regression test additions and combines pending voice readiness (PR #321) and worker scoped allowlist (PR #319) without modifying any Director-approved prior MP4 or Take. No isolated Node/Java build, genuine Remotion frame capture, live voice readiness, approved render, production deployment, new storage write or real MP4 QA is claimed by this document. Until those pass, status is **NOT VERIFIED RENDER READY**; do not silently enable paid/render CPU claims.
