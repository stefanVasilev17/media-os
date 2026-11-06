# EP002 SHOT02 — voice-driven Remotion code candidate / PRE-SHOT VISUAL CHECK

**Status:** SCOPED SOURCE PROPOSAL — NOT BUILT / NOT RENDERED / NOT DIRECTOR VISUALLY ACCEPTED
**Separate SHOT PR:** based on `feat/mediaos-ep002-unified-product-integration` commit `e2674a5b4b5faa0bd9cbae71e6d6094becdcf7f8`
**Target:** `EP002 / SHOT02 — 9:00 AM: The Ticket Sale Opens`
**Approved sources:** Script v4.0 (`backend/src/main/resources/episode-production/ep002-locked-script-v4.json`), Visual Pass v1.0 (`backend/src/main/resources/episode-production/ep002-approved-visual-source.json`), protected SHOT01 as reviewed in `MEDIAOS_EP002_SHOT01_VISUAL_DIRECTOR_LOCK_20261104.md`.
**Rules reviewed:** `AGENTS.md`; `docs/visual/AT_REMOTION_VISUAL_CONSTITUTION_V1.md`; `docs/visual/CODEX_VISUAL_LESSONS_LEDGER.md` (no active accepted ledger entries); `docs/visual/SEQUENTIAL_CODEX_SHOT_PROTOCOL_V1.md`.
**Prior-visual geometry:** From `remotion-engine/src/episodes/ep002/Shot01LoginWaiting.tsx`: Gateway x934 y420, Balancer x1161 y420, Auth Service x1510 y298. Preserve the SHOT01 Phone via read-only `Shot01ReadablePhone.tsx`. No edits to SHOT01 or EP001 protected assets.

## Voice proof and limitation

The Director confirmed in conversation that MediaOS reports **REAL TIMING VERIFIED** for SHOT02. The earlier Director screenshot showed selected Take ID `ede9cab9-f2d2-43e2-802d-9a97f3a348f6`, total 1205 audio frames and the five intended anchors, but these are **conversation evidence**, not a live authenticated database response. Exact verified `startFrame`/`endFrame` values were **not** provided to this coding session; no fictional timestamp may be entered.

The code **does not bake 1205 frames or sample timings** into the scene. It requires a caller-supplied, backend-verified `voiceTakeId`, `durationInFrames`, `timingMode='ELEVENLABS_CHARACTER_TIMESTAMPS'` and the five ordered `verifiedCues`. Cue boundaries are validated for positive duration and complete non-overlapping coverage. If anything is missing, the scene fails closed rather than substituting storyboard percentages.

The future authorized adapter must load the *actual Director-owned, current* response from `GET /api/v1/creative/episodes/EP002/voice-cue-review/SHOT02`, match `selectedTakeId` and `inputFingerprint` against the current episode/voice state, and pass the returned `frames` to `Shot02GeneratedScene`. An apparently correct client-supplied array alone **does not prove** a Director review; verification of live provenance is a separate pre-render gate. Do not claim a playback-ready composition or accepted scene until that adapter exists and all checks pass. Any changed Take, source fingerprint or SHOT02 revision invalidates previous assumptions.

## Five visual beats (voice-driven, no guessed seconds)

1. **09:00 reveal.** Small '09:00 · TICKETS ON SALE' context label. Camera reveals more of same architecture world; no disconnected concert mock or fake timeline.
2. **Arrival surge.** Small anonymous request packets increase in density from Phone toward Gateway. No credentials shown on packets; no node relocations to fake a surge.
3. **Gateway and Balancer.** Existing Gateway and Balancer nodes brighten as separate decisions. Balancer fans out to exactly three Auth replicas inside the existing spatial Auth Service region.
4. **New Login arrivals/s.** Shows original *new login arrivals*, not backend/database attempts. Illustrative (not telemetry); starts at 100, later 350. The higher 650 and 900 levels should be controlled by SHOT03's approved cues rather than appearing before narration.
5. **Shared User Database.** Three Auth-to-DB lookup corridors converge on one shared DB. Pressure begins but the DB remains online, not red or crashed. Camera travels right while preserving node coordinates; the end view sets up SHOT03.

## Chosen component reuse and gaps

- Import the approved `ATBackground`, `ATControlledRealismLayer`, `ATCameraRig`, `ATBackendNode`, `AT_FONT` components from the existing shared registry; read-only reuse of SHOT01 Phone.
- Source-local new elements: wave glyph emitter, fan-out/convergence paths, small 09:00 label and arrival rate counter. These are **not** promoted to shared assets without review.
- New database node is placed to the right of the existing Auth region; it becomes visible via camera traversal. Its placement is a **candidate** requiring Director visual acceptance and a SHOT03 continuity check.
- Known rejection risks: crowded text around Auth, cards resembling a generic dashboard, excessive packet density, three Auth replicas unreadable in a 16:9 composition, confusing the arrival counter with real telemetry, unsynced cue transitions or a clipped DB when camera pans.

## Scope and QA status

**New code:** `remotion-engine/src/episodes/ep002/Shot02GeneratedScene.tsx` only.
**Focused test:** `remotion-engine/shot02-readiness.test.mjs`.
**No modifications:** SHOT01, Root.tsx, worker, shared primitives, original Script/Visual Pass, PostgreSQL, `.github/workflows`, or protected EP001 files.

This PR is a **source-only draft**. It is not registered as a Remotion composition in `Root.tsx` or the EP003+ factory router, which intentionally prohibits EP002. Before preview: verify Director's live cue receipt and selected current Take; run actual Node tests, TypeScript typecheck and Remotion bundle in an authorized cloud build; integrate EP002 SHOT02 into a reviewed render route; deploy the *matching exact worker SHA* only with an explicit Director production release approval; and obtain separate Director authorization before any paid/CPU-consuming MP4 render. Never claim TypeScript/preview/visual QA success based only on file creation. Director must inspect and LOCK the real MP4 before proceeding to SHOT03.
