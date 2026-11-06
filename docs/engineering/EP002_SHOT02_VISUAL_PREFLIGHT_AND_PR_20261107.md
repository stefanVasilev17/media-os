# EP002 SHOT02 — voice-driven Remotion code candidate / PRE-SHOT VISUAL CHECK

**Status:** SCOPED SOURCE PROPOSAL — NOT BUILT / NOT RENDERED / NOT DIRECTOR VISUALLY ACCEPTED
**Separate SHOT PR:** based on `feat/mediaos-ep002-unified-product-integration` commit `e2674a5b4b5faa0bd9cbae71e6d6094becdcf7f8`
**Target:** `EP002 / SHOT02 — 9:00 AM: The Ticket Sale Opens`
**Approved sources:** Script v4.0 (`backend/src/main/resources/episode-production/ep002-locked-script-v4.json`), Visual Pass v1.0 (`backend/src/main/resources/episode-production/ep002-approved-visual-source.json`), protected SHOT01 as reviewed in `MEDIAOS_EP002_SHOT01_VISUAL_DIRECTOR_LOCK_20261104.md`.
**Rules reviewed:** `AGENTS.md`; `docs/visual/AT_REMOTION_VISUAL_CONSTITUTION_V1.md`; `docs/visual/CODEX_VISUAL_LESSONS_LEDGER.md` (no active accepted ledger entries); `docs/visual/SEQUENTIAL_CODEX_SHOT_PROTOCOL_V1.md`.
**Prior-visual geometry:** From `remotion-engine/src/episodes/ep002/Shot01LoginWaiting.tsx`: Gateway x934 y420, Balancer x1161 y420, Auth Service x1510 y298. Preserve the SHOT01 Phone via read-only `Shot01ReadablePhone.tsx`. No edits to SHOT01 or EP001 protected assets.

## Director PREMIUM visual revision — 2026-11-07 (implementation candidate)

The Director has now locked five hard production quality gates: **animated/readable technical terms**, strong **voice → visual causality**, **ZERO text/geometry overlap**, premium art direction, and modern spatial camera grammar. The permanent project-wide policy is being recorded in the consolidated MediaOS branch visual constitution; this SHOT applies the same constraints without changing any protected shared component.

### Beat-by-beat visual delivery

| Director Beat | Screen action and modern cinematic treatment | Relevant named-term accents |
| --- | --- | --- |
| **1 — 09:00** | A compact warm 09:00 / TICKETS ON SALE chip appears in the quiet top corridor; the camera gently widens the same phone–Gateway–Balancer–Auth world. Nothing jumps into a disconnected slide. | The chip is a contextual event, not a fake system node. |
| **2 — software hasn't changed** | Anonymous Login arrivals start pulsing along the **existing, unchanged** Phone→Gateway route. Increase density, not arbitrary architecture size or disjoint cards. | Highlight **LOGIN REQUEST** only when the phrase is actually spoken. |
| **3 — API Gateway and Balancer** | Motion guides from Gateway entry through a clearly legible Load Balancer fan-out, then shows three Auth replicas. Use smooth push-in, single subject halo, narrow accent underline and large readable technical term on a separate fixed top HUD lane. | Separate **API GATEWAY**, **LOAD BALANCER**, **AUTH SERVERS** spoken-phrase timings. |
| **4 — arrival rate** | A restrained lower-right metric strip shows **NEW LOGIN ARRIVALS / SECOND** with a visible illustrative 100→350 rise; the request stream reacts in the same world. Never claim these examples are production metrics or database attempt counts. | **ARRIVAL RATE** receives its exact audio-driven term spotlight. |
| **5 — database dependence** | Auth service is emphasized again when narration refers to it; three lookup paths visibly converge toward the shared User Database. The camera pans across the continuous world to a database that remains healthy. The last view prepares SHOT03. | Second **AUTH SERVERS** occurrence, followed by **USER DATABASE**. |

### Exact technical-term timing is a separate gate

**Five coarse HEAR→SEE beat anchors do not reveal every spoken technical-term start.** The upgraded scene additionally requires **seven independently measured and verified phrase windows**, in this order: `LOGIN_REQUEST`, `API_GATEWAY`, `LOAD_BALANCER`, `AUTH_SERVERS` (first occurrence), `ARRIVAL_RATE`, `AUTH_SERVERS_REPRISE` (second occurrence), `USER_DATABASE`. Each has an exact `startFrame` and `endFrame` from the selected Take's existing genuine ElevenLabs character alignment. Gateways/arrival/database term start frames must match their corresponding verified HEAR→SEE beat starts; other term windows must occur in true spoken order. There is **no guessed 10-second stagger**, no timing percentage fallback, and no second ElevenLabs paid operation.

**Current integration blocker:** The existing MediaOS Director review endpoint exposes the five coarse `frames`, but not these seven separate term windows. The server-side verified source-alignment extraction and SHA-/Take-bound adapter must be added and reviewed before this scene can be rendered in production. Do **not** ask the Director to hand-enter magic timestamps or claim the 7-term adapter exists. The code deliberately rejects missing term-cue values.

### Collision and visual-fidelity protocol

All editorial text is rendered in fixed **1920×1080 screen-space lanes** outside `ATCameraRig`: brand (top-left), 09:00 context (upper-middle), one term-focus HUD (upper-right), and new-arrivals metric (lower-right). The architecture beneath the camera holds the existing Phone, shrunk Gateway/Balancer widths (centers unchanged), Auth cluster, and rightward DB. Halo effects contain **no text**. A pure SHOT-local geometry contract tests camera-projected conservative node and Phone boxes against the fixed text lanes and rejects collisions at render time. The geometry model was executed over **1331 camera-envelope poses (1331 passed)** and rejected a deliberately unsafe pan. Executable `node:test` cases are committed but have **not been executed via the full repository Node/TypeScript toolchain** in this revision.

**This is not proof of beautiful frames.** Required next review: actual TypeScript and Node tests, real Remotion bundle, voice-matched renderer integration, sampled full-frame stills around all 7 terminology transitions, 1920×1080 readability and TV/mobile viewing tests, then the Director's direct MP4 visual acceptance. Any crowded or generic/dashboard-like scene is **NOT ACCEPTED** and must be corrected in this PR before SHOT03.

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
