# EP002 SHOT01 — SHOT02 Visual-Parity Candidate (2026-11-11)

## New Director request

The Director compared screenshots of original SHOT01 against approved SHOT02. SHOT01 used a different, dim, one-Auth-only explanatory world, whereas SHOT02 uses the canonical vibrant **Phone → API Gateway → Load Balancer → Auth 01/02/03 → one User Database**. Director requested a new SHOT01 visually indistinguishable in architectural style from SHOT02–11 and **ready for manual render**, without silently replacing the human-approved historical MP4 or changing the recorded narration.

## Visual implementation

- Separate `remotion-engine/src/episodes/ep002/Shot01UnifiedVisualV2.tsx` imports the **original** SHOT02 V5 card components `GatewayCard`, `BalancerCard`, `AuthCluster`, `DatabaseCard`, and `PathSystem`, exported without changing their SHOT02 rendering behavior, and exact shared `Shot02PressurePhone` component and original SHOT02 geometry/ports/routes.
- One Phone, Gateway, Balancer, three Auth instances, exactly **one** User Database; no fake replica, no additional DB capacity, no duplicated gateway, no different phone. The brand, background, materials, typography, route geometry, glow/lighting and 1920×1080 world are copied through the identical SHOT02 components, not approximated with new visual assets.
- SHOT01 uses the SAME real 5 ElevenLabs timestamp starts as the historical approved selected Take 2, original script, voice and 30fps duration; no invented percentage-based markers for the new component. User presses Login, phone displays spinner and **Logging in ...**, one actual packet moves to AUTH 01 and the one DB, time passes with no answer, prominent Liveness/Readiness PASS facts illuminate Auth, request still waits, and at final fifth cue the rail rewinds. No tiny duplicate captions or decorative word clouds.
- Camera focus is subtle (maximum ~1.2% map scale) and restores identity pose by final frame. **Exact final SHOT01 source pose** restores canonical frame0, pressure0, empty request stream, no spinner, no active health cards or rail, original idle Phone, and the exact SHOT02 Gateway/Balancer/Auth/DB geometry. Therefore transition from SHOT01 last frame to approved SHOT02 first frame is built as a **same-world hard cut**. The actual MP4 still requires Director seam inspection before locking.
- Original old `Shot01LoginWaiting.tsx` and `Shot01ReadablePhone.tsx` source files remain untouched; original approved stored **720p, 980-frame MP4** remains pinned in Director Review Room with exact render ID **`447f2846-3d1d-4d6c-924c-ea3918520625`**. NEW candidate is rendered by existing `EP002-SHOT01-DRAFT` composition ID with the new component, unique `visualStylePass: SHOT01_SHOT02_UNIFIED_V2` input property and **REVIEW 1920×1080 profile**. This does not overwrite the immutable old MP4. If accepted later, Director must explicitly approve replacing SHOT01 reference with new specific MP4 and precise native resolution/duration, never latest-successful.

## Strict provenance and paid-render gate

- `Ep002Shot01PreviewController` still requires authenticated Director, correct saved current scene contract ID, selected Take, measured duration, real five synchronized `beatStartFrames`. **PROVISIONAL_STORYBOARD disallowed**. Requires `MEDIAOS_SHOT01_UNIFIED_RELEASE_SHA` pinned to exact deployed worker Git SHA, stores it in `expectedSourceCommit`, marks visual style and verifies 1080p REVIEW when querying current preview.
- `RemotionRenderController.ensureVerifiedEp002Preview` uses **REVIEW** Full HD, not old FAST_PREVIEW. Original render hash includes source/pass/profile; historical MP4 is unaffected.
- `RemotionCpuWorkerController` refuses any worker-owned SHOT01 audio that is not original approved voice plus V2 style, real 1080p30 REVIEW, and exact source SHA; adds safe targeted `EP002-SHOT01-DRAFT` claim.
- `cpu-worker.mjs` also checks 5 real ordered cues, selected original Take, exact source SHA and resolution/profile before original voice download/FFmpeg audio mux. Existing other SHOT02–11 locks remain.
- **No paid TTS, no paid CPU render, no creative lock is triggered automatically**. User must explicitly use MediaOS SHOT01 Blueprint `Create voice-synced preview` after fresh current Take verification. This produces a candidate, not auto-LOCK.

## Quality verification checklist

1. Focused `shot01-unified-visual.test.mjs` enforces genuine cues, original exact SHOT02 primitives, only one animated request, no new DB replicas, unobstructed text, full-HD source/Worker gate, end-to-start seam state.
2. Legacy `shot01-readability.test.mjs` still protects the approved historical source unchanged.
3. Full `Dockerfile.remotion-worker` tests, TypeScript preflight, both Remotion bundles and Backend full PostgreSQL Java tests and frontend build must PASS.
4. Railway Backend/Worker are deployed from the same exact immutable SHA, with independent SHA preDeploy guards, matching `MEDIAOS_SHOT01_UNIFIED_RELEASE_SHA`, worker target limited to `EP002-SHOT01-DRAFT`. No paid render from chat.
5. After Director requests paid render in UI, confirm authentic MP4, original voice and precise 5 cues, legible 1080p architecture, Phone click→Auth health→wait→rewind story, and **SHOT01 last frame → SHOT02 first frame exact visual seam** before any human LOCK. Old SHOT01 lock is immutable until that decision.
