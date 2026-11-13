# Architectural Thinking / MediaOS — P0 Director LOCK: Invisible Cross-SHOT Continuity

**Director decision:** 2026-11-13 (Europe/Sofia)
**Priority:** P0 / HIGHEST CREATIVE AND VISUAL PRODUCTION PRIORITY for all NEW and REVISED SHOTs in EP003 and future episodes, and for any separately authorized EP002 rework.
**Status:** DIRECTOR-LOCKED PRODUCTION RULE; documented, not a claim of implemented runtime enforcement.
**Scope:** Script/HEAR→SEE direction, SceneSpec, Remotion compositions, audio transition/episode assembly, preview, agent-generated revisions, visual QA and Director acceptance.

## Absolute rule

> **EVERY SHOT N > 1 MUST START FROM THE EXACT VISIBLE END STATE OF SHOT N-1. The viewer must experience ONE continuous living architecture film, not assembled separate scenes.**

No new camera/world reset, unexpected object relayout, color/style change, missing/reappearing objects, unreadable pop, restarted packet, or hard cut that exposes a SHOT boundary. SHOT identity is an implementation detail, not a visible event. This P0 rule overrides speed, convenience, aesthetics and any older less-strict transition guidance. If it cannot be proven, fail closed and request a Director review rather than rendering/locking/claiming a seamless master.

### 1. Frame and state lineage: mandatory for SHOT02 onward

- Take the **actual approved and source-pinned previous SHOT's LAST rendered frame** and its end-state contract as the authoritative starting reference. Never rebuild that image from a verbal description, template, speculative frame, alternate take, or latest-successful candidate.
- The following SHOT's **FIRST frame** must reproduce that previous visual state without a detectable discontinuity (pixel-equivalent after allowed codec variance). Use the exact same Living Architecture World and viewport/camera basis.
- Persist and hand off: camera position, zoom, pitch/perspective, rotation and camera motion trajectory; node/asset positions, dimensions, identities, versions and counts; all semantic ACTIVE/QUIET/FAILED states, connector/path illumination and in-flight packet IDs/positions; phone content; lighting, background, colors, text/panels and on-screen values. Preserve transition direction and motion velocity rather than restarting per-SHOT animations.
- The new SHOT may change focus, camera or topology **only gradually after the verified handoff**, and only when the narrative requires it. Objects introduced later must emerge in the existing world, not teleport at the cut.
- Keep a versioned, immutable `ShotEndState` / `ShotStartState` or equivalent checked data contract, with exact source render ID, source SHA, last source frame, camera/world/asset versions, active states, motion phase and expected destination. A reference to approved previous media is required; passing a guessed pose is not proof.
- For a real inserted seam clip, require **two** continuity boundaries: `SHOT[N].lastFrame -> SEAM[N].firstFrame` and `SEAM[N].lastFrame -> SHOT[N+1].firstFrame`. Without a seam clip, check the direct SHOT-to-SHOT boundary. The inserted segment must not conceal an unverified mismatch at either end.
- SHOT01 of an episode can establish the opening frame, but SHOT02–last SHALL preserve the exact full-world handoff. An EP002→EP003 thematic bridge is useful but does not override the within-episode invariant.

### 2. Natural breathing without a visible edit

- At each boundary, allow a **gentle voice-only breathing pause after a complete thought**, while the living architecture keeps moving meaningfully. Do not freeze/hold a static last video frame, blank the map, cut to unrelated b-roll, or use decorative camera motion.
- **EP002 Director V2 precedent: exactly 2 seconds (60 frames at 30fps) of additional narrator-free transition at ten boundaries. EP003 default proposal: approximately 2 seconds per boundary unless the Director approves a specific different gap.** This is a per-boundary editorial contract, not guessed TTS timestamp data.
- Respect the selected immutable approved ElevenLabs Take and real audio/HEAR→SEE cues; no silent re-generation, no voice phrase overlap, no clipping/accelerating speech, no retiming approved source frames to manufacture pauses. Add separately versioned seam motion/audio to assembly with true QA.
- Animation must remain causally connected: keep packet/path progression, soft camera easing, active-state travel, waiting/processing rhythm or another genuine architectural action, all in the same visible world. The transition should feel like one deliberate continuous camera take.

### 3. Non-negotiable technical and Director QA gate

For ALL `N-1` boundaries of an episode, independently check and record:

1. **Source truth:** exact locked source MP4/render ID/SHA and source FPS/size; last frame of N and first frame of N+1, plus any intermediate seam frames, actually extracted from the candidate master/source.
2. **Pixel/geography continuity:** real rendered frame-to-frame comparison, camera and object geometry, color/styling, active states, overlays, labels and phone; tolerate only verified encoding variance. Do not accept same names/design palette as proof.
3. **Temporal continuity:** actual position/velocity/state of moving paths, packets, accents and camera across the seam; no snap, reset, freeze, duplicate frame stutter or visible flash.
4. **Narration:** real silence duration, speech ends before the gap and resumes only after, no missing/overlapped words, with measured audio and genuine voice alignment. EP002 V2 exactly 60 added frames per boundary; future episodes use approved timing.
5. **Master evidence:** genuine 1920×1080/30fps MP4 QA, all seam results attached to the specific render ID and source fingerprint; clear per-boundary QA outcomes plus Director playback of the actual candidate. A test of code or a successful deployment alone is NOT final visual acceptance.

Blocking categories: `SHOT_SEAM_SOURCE_UNVERIFIED`, `SHOT_SEAM_FIRST_FRAME_MISMATCH`, `SHOT_SEAM_WORLD_STATE_RESET`, `SHOT_SEAM_CAMERA_OR_MOTION_JUMP`, `SHOT_SEAM_FROZEN_GAP`, `SHOT_SEAM_NARRATION_GAP_INVALID`, `SHOT_SEAM_VISUAL_QA_PENDING`.

**Result rule:** `SEAMLESS` / `READY_FOR_DIRECTOR_REVIEW` may be reported only after actual candidate media has been examined for *every* seam. **DIRECTOR_LOCKED** requires a separate explicit human acceptance. Unobserved boundaries remain `UNVERIFIED`, never PASS.

### 4. Source preservation and change workflow

- Existing EP001 and EP002 approved/LOCKED renders, voice Takes, creative sources and shared components are immutable. Enforce this new rule on future SHOTs and new versioned candidates, without retroactively editing locked binaries or replacing existing pins.
- If a previous LOCKED SHOT has an unsuitable last frame, build an explicit versioned adapter/seam or ask Director for approval to create a new candidate; NEVER silently alter the source SHOT to force the match.
- The SHOT-generation workflow is: prior **approved last-frame/state evidence** → next SHOT first-frame/state specification → shared-world continuation implementation → read-only source/frame QA → genuine seam preview → Director review → only then LOCK and proceed. Never generate 11 disconnected SHOTs and hope the final assembler hides a mismatch.
- Review all transitions together after assembly, not just individual clips. Any visual correction is scoped and versioned. Re-render only affected material and dependent transitions with explicit paid authorization. No GitHub Actions and no unauthorized TTS/CPU/AI charges.

## EP003 immediate application

EP003 SHOT02 must begin from the actual end frame/state of EP003 SHOT01; SHOT03 begins from SHOT02, and so on through SHOT11. The initial map retains the three Auth instances and one User Database from the EP002 story; replication/routing changes are revealed progressively at their actual narrative moments. Introduce new database replicas only after a continuous on-screen transition. This continuity plan must be part of each EP003 Script + HEAR→SEE specification **before** paid production.

## Precedence

This P0 Director-LOCK is newer than, and takes priority over, earlier generic seamless-scene suggestions. It does not override security, factual accuracy, protection of locked artifacts or spending authorization. Any exception needs a specific explicit Director-approved new version, not an agent assumption.

**Documented rule only:** No Remotion implementation, seam media QA, paid render, Director master acceptance or production deployment is claimed by this documentation change.
