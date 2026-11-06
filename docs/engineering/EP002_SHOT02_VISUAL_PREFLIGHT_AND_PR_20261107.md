# EP002 SHOT02 — voice-driven Remotion code candidate / PRE-SHOT VISUAL CHECK

**Status:** PRE-RENDER SOURCE INTEGRATION CANDIDATE — NOT BUILT / NOT RENDERED / NOT DIRECTOR VISUALLY ACCEPTED
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

**Five coarse HEAR→SEE beat anchors do not reveal every spoken technical-term start.** The upgraded scene additionally requires **seven independently measured and verified phrase windows**, in this order: `LOGIN_REQUEST`, `API_GATEWAY`, `LOAD_BALANCER`, `AUTH_SERVERS` (first occurrence), `ARRIVAL_RATE`, `AUTH_SERVERS_REPRISE` (second occurrence), `USER_DATABASE`. Each has an exact `startFrame` and `endFrame` from the selected Take's existing genuine ElevenLabs character alignment. Gateway and arrival-rate term starts match their Director beat anchors; User Database must be spoken within beat 5. The fifth beat may begin earlier on the second Auth servers mention, without moving the actual User Database phrase timing. All seven term windows must occur in true spoken order. There is **no guessed 10-second stagger**, no timing percentage fallback, and no second ElevenLabs paid operation.

**2026-11-06 integration blocker, now addressed at source level (not deployed):** The original MediaOS Director review endpoint exposes five coarse `frames`, not seven separate term windows. PR #192 now includes a strict, read-only Take-/SHA-/fingerprint-bound adapter; see the dated pre-render integration update below. No actual live proof, build or render is implied. Do **not** ask the Director to hand-enter magic timestamps or claim the 7-term adapter exists. The code deliberately rejects missing term-cue values.

### Collision and visual-fidelity protocol

All editorial text is rendered in fixed **1920×1080 screen-space lanes** outside `ATCameraRig`: brand (top-left), 09:00 context (upper-middle), one term-focus HUD (upper-right), and new-arrivals metric (lower-right). The architecture beneath the camera holds the existing Phone, shrunk Gateway/Balancer widths (centers unchanged), Auth cluster, and rightward DB. Halo effects contain **no text**. A pure SHOT-local geometry contract tests camera-projected conservative node and Phone boxes against the fixed text lanes and rejects collisions at render time. The geometry model was executed over **1331 camera-envelope poses (1331 passed)** and rejected a deliberately unsafe pan. Executable `node:test` cases are committed but have **not been executed via the full repository Node/TypeScript toolchain** in this revision.

**This is not proof of beautiful frames.** Required next review: actual TypeScript and Node tests, real Remotion bundle, voice-matched renderer integration, sampled full-frame stills around all 7 terminology transitions, 1920×1080 readability and TV/mobile viewing tests, then the Director's direct MP4 visual acceptance. Any crowded or generic/dashboard-like scene is **NOT ACCEPTED** and must be corrected in this PR before SHOT03.

## Voice proof and limitation

The Director confirmed in conversation that MediaOS reports **REAL TIMING VERIFIED** for SHOT02. The earlier Director screenshot showed selected Take ID `ede9cab9-f2d2-43e2-802d-9a97f3a348f6`, total 1205 audio frames and the five intended anchors, but these are **conversation evidence**, not a live authenticated database response. Exact verified `startFrame`/`endFrame` values were **not** provided to this coding session; no fictional timestamp may be entered.

The code **does not bake 1205 frames or sample timings** into the scene. It requires a caller-supplied, backend-verified `voiceTakeId`, `durationInFrames`, `timingMode='ELEVENLABS_CHARACTER_TIMESTAMPS'` and the five ordered `verifiedCues`. Cue boundaries are validated for positive duration and complete non-overlapping coverage. If anything is missing, the scene fails closed rather than substituting storyboard percentages.

The new read-only source adapter in this PR checks the *actual Director-owned, current* `GET /api/v1/creative/episodes/EP002/voice-cue-review/SHOT02` review, matching selected Take and episode fingerprint before producing separate `verifiedCues` and `termCues`. The endpoint remains untested against live director data and is NOT deployed; secure server-side render orchestration must still pass its verified response to `Shot02GeneratedScene`. An apparently correct client-supplied array alone **does not prove** a Director review; verification of live provenance is a separate pre-render gate. Do not claim a playback-ready composition or accepted scene until that adapter exists and all checks pass. Any changed Take, source fingerprint or SHOT02 revision invalidates previous assumptions.

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

**SHOT-local visual code:** `Shot02GeneratedScene.tsx` and `Shot02PremiumLayout.ts`; source-only companion backend term resolver, Director read-only endpoint integration and one candidate-only Root.tsx composition.
**Focused tests (authored, not yet run in full checkout):** `shot02-readiness.test.mjs`, `shot02-premium-layout.test.mjs`, `shot02-render-contract.test.mjs`, and `Ep002Shot02TermResolverTest.java`.
**Protected originals unchanged:** SHOT01 visual sources, worker, shared primitives, locked Script/Visual Pass, database schema, `.github/workflows`, and EP001 protected files.

Original first-pass status (superseded by dated integration update below): this PR was a source-only draft with no composition registration. It remains excluded from the EP003+ factory worker; the new SHOT02 candidate registration is pre-render only. Before preview: verify Director's live cue receipt and selected current Take; run actual Node tests, TypeScript typecheck and Remotion bundle in an authorized cloud build; integrate EP002 SHOT02 into a reviewed render route; deploy the *matching exact worker SHA* only with an explicit Director production release approval; and obtain separate Director authorization before any paid/CPU-consuming MP4 render. Never claim TypeScript/preview/visual QA success based only on file creation. Director must inspect and LOCK the real MP4 before proceeding to SHOT03.


## Pre-render source integration — 2026-11-07 (draft PR #192; verification pending)

**Implemented in the SHOT02 branch, not in the live Railway deployment:**

- Added `Ep002Shot02TermResolver`, which reads the already stored selected Take's genuine ElevenLabs `normalized_alignment` / `alignment` character timestamps, locates the seven spoken phrases in real spoken order (including the two separate occurrences of **Auth servers**), and returns integer 30-fps phrase start/end frames. Missing or disagreeing phrases fail closed; there is no timing interpolation, transcript rewrite, paid TTS or hardcoded Take/frame ID.
- Added Director-only **read-only** `GET /api/v1/creative/episodes/EP002/voice-cue-review/SHOT02/render-readiness`. This requires current voice approval, an existing current verified five-beat review, a matching current episode fingerprint, selected Take, narration SHA, revision and measured duration, then derives the seven term cues from the same selected Take. A stale or invalid source produces `ready:false`, **empty cue arrays** and a reason rather than render-ready props. Raw alignment and audio are not returned.
- Strengthened stored V124 beat-review verification against **current episode fingerprint**. An older review from a different fingerprint can no longer be treated as current just because its stored digest remains internally consistent.
- Registered `EP002-SHOT02-CANDIDATE` in the existing Remotion `Root.tsx`, **not** in the EP003+ Factory worker. Its intentionally invalid default props (`voiceTakeId:''`, empty cues, 6 frames) prevent a plausible-looking but unsynchronized default render. For a future authorized render, the caller must provide a fresh `ready:true` server response's exact `voiceTakeId`, `durationInFrames`, `timingMode`, `verifiedCues`, and `termCues` through reviewed server-side render orchestration.
- Added Java focused resolver tests covering seven ordered terms, the repeated Auth phrase, missing repeats, conflicting Director beat anchors and absent alignment; added `shot02-render-contract.test.mjs` contract assertions. **These files were committed but Maven/Node tests, TypeScript typecheck and Remotion bundle have NOT been executed in an authorized full checkout.**

**Beat-five precision:** An extra focused Java test covers two legitimate Director beat-five anchors: the second `Auth servers` phrase and the later `User Database` phrase. The term highlight for the Database is always driven by its own character alignment; coarse beat-five boundaries are never substituted for the phrase. This corrects an overly strict original preview assumption without changing the Director-LOCKED script or Visual Pass.

**Release gates still OPEN:** live authenticated response showing `ready:true` and current real frames; successful repository Maven and Node tests, Remotion TypeScript check and bundle; secure server-side render input routing and worker release at an explicitly approved SHA; separate Director Railway CPU permission for MP4/stills; visual review at 1920x1080 of seven technical-term moments, beats, non-overlap and cinematic camera; Director final LOCK. No Railway deployment, GitHub Actions, paid ElevenLabs/OpenAI calls, MP4 or approval is claimed by this draft. EP002 SHOT01 v3 and EP001 12-SHOT protected sources remain unchanged.


## Isolated offline QA evidence — 2026-11-07

**Executed, not merely authored:** The exact two GitHub blobs from PR #192 were copied to an isolated local Node 22.16.0 workspace and verified using `git hash-object`:

- `remotion-engine/src/episodes/ep002/Shot02PremiumLayout.ts` — blob `3f78806df8f644006ca53b36df744bfd029aa9be`
- `remotion-engine/shot02-premium-layout.test.mjs` — blob `fc782006b392b64f6d65dc6b2e75a3f0b137aa76`

Running `node --test shot02-premium-layout.test.mjs` in the isolated directory with the unchanged relative source tree returned **4 tests PASSED, 0 FAILED**: four HUD text lanes within 1080p safe bounds; immutable SHOT01 node centers and local Gateway/Balancer gaps; no conservative projected text/node collisions across **1331 sampled camera poses**; rejection of unsafe pan/zoom and nonfinite coordinates. Running `tsc --noEmit --strict --target ES2022 --module ESNext --moduleResolution Bundler --skipLibCheck --lib ES2022,DOM src/episodes/ep002/Shot02PremiumLayout.ts` against the exact layout source returned **PASS**. This proves the narrowly scoped geometry and TypeScript-layout preflight, not pixel-level visual quality.

**Environment limitation:** GitHub `git ls-remote` failed because the isolated container cannot resolve github.com; Java 21 and Node 22 are present, but Maven and the full GitHub checkout/npm dependencies are not. Therefore no complete Maven suite, `shot02-render-contract.test.mjs` against full source, Remotion TSX typecheck, Remotion bundle or video was executed. Existing production Railway was not used as a QA runner; no Railway CPU was started, no automated workflow triggered, and no paid calls or production release performed.

**NEXT:** authorize/use an isolated complete-checkout QA worker (not production rendering), execute focused Java resolver tests and all relevant Node tests, `npm run typecheck` / `npm run build`, and check the authenticated current SHOT02 voice-cue readiness response. Registering a candidate composition does NOT mean the production renderer may consume it. Capture exact code SHA and verification logs before proposing any CPU render.


## SHOT02 guarded 1080p render integration — 2026-11-07, SOURCE ONLY

**Branch:** the Draft PR #192 head on top of Draft PR #191. This is an authored implementation candidate, **not yet Maven/React/Remotion built**, deployed, queued, or rendered. Both production Railway services remain on earlier pinned SHAs.

1. **Real voice cues:** the Director-only read-only `voice-cue-review/SHOT02/render-readiness` endpoint derives five reviewed beat intervals and seven phrase intervals from the *same current selected ElevenLabs Take*, with SHA/fingerprint/TTS alignment checks. The scene now treats each actual phrase timestamp as authoritative and requires spoken terms to fall within the appropriate narrative beat window, **not** artificially start at the coarse beat boundary. The unchanged script places `Login request` before `API Gateway`, `Load Balancer` and `Auth servers` in the same narrative chain.
2. **Controlled render intake:** new `Ep002Shot02PreviewController` exposes Director-only `POST/GET /api/v1/creative/episodes/EP002/shots/SHOT02/render-preview` and read-only `GET .../capability`. POST requires recorded global creation preflight, a fresh episode fingerprint and unique request ID, verified SHOT02 voice, 5 beats + 7 terms, and the **explicitly enabled** worker release gate. It writes exact selected Take/visual-source/render source lineage. `mediaos.ep002.shot02-preview-enabled:false` and `mediaos.ep002.shot02-worker-source-sha:` (blank) are fail-closed defaults; no config was enabled.
3. **1920x1080 composition:** production render intake supports `EP002-SHOT02-CANDIDATE` only through the trusted Director path and produces `REVIEW` 1920x1080, 30fps. Direct generic POST `/api/v1/remotion/renders/compositions/EP002-SHOT02-CANDIDATE` is forbidden. The Remotion `Root.tsx` candidate has deliberately unusable empty voice/term default props.
4. **Worker integrity:** CPU claim query requires exact running Worker commit SHA equal to `expectedSourceCommit` from the audited job; non-matching workers cannot claim. Worker rechecks the *current* SHOT02 fingerprint/selected Take/voice approval before CPU claim and before handing existing selected audio to mux; stale jobs fail terminally rather than spending CPU or silently retrying. An interrupted EP002 SHOT02 render stays terminal and must be requested again explicitly by the Director. Audio is fetched via existing Worker-authenticated route, never new paid ElevenLabs calls. No new provider keys or GitHub Actions.
5. **In-product Director UI:** a guarded `Ep002Shot02RenderPanel` under the EP002 Factory **Verified Preview Approval** stage shows current Voice/TTS readiness, Worker capability and latest render. The button stays disabled without a pinned release and current verified seven-term timing; after enablement, it prompts for **separate explicit Railway CPU cost consent** before sending a single audited render POST. This is a future product control, not an actual Director click today.

**Verification receipts:** exact original layout/test Git blobs `3f78806df8f644006ca53b36df744bfd029aa9be` and `fc782006b392b64f6d65dc6b2e75a3f0b137aa76` passed Node's **4/4** pure geometry tests, including **1331 camera poses**, and the isolated strict TypeScript check. The new backend route, JSX, worker Java/JS, full repository Maven/Node/React/Remotion bundle and 1920x1080 visual frames have **not passed an isolated full build**, because this session has no complete checkout/dependencies and the managed cloud QA build has not been authorized or started. Seven additional source-level contract presence checks passed, **not runtime tests**.

**Mandatory next release gates:** the Director must separately approve creating/running an **isolated Railway-managed cloud QA build** for exact immutable PR #192 source (project policy explicitly prohibits quietly creating that paid QA service); QA must report real exit codes for Maven/Postgres, frontend, Node, TypeScript and Remotion bundles, including existing SHOT01 compatibility. Check the current authenticated SHOT02 readiness receipt and actual selected Take against the built SHA; resolve any failure without making up phrase timings. Only then request separate permission for production backend/Worker deployment, configure both SHOT02 gates to the released immutable source SHA, and use the in-app Director CPU-confirmation to queue one 1080p MP4. Inspect samples at 5 beat starts and 7 technical-term transitions; reject overlaps/weak typography/misleading counters/poor camera and require Director visual LOCK before SHOT03. No actual MP4, server deployment, new QA service or paid calls occurred in this source-only preparation.
