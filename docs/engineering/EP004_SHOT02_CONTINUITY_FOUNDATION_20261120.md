# EP004 SHOT02 — V1 Living Continuity Foundation (NOT production/script/voice ready)

**Started by Director on 2026-11-20 (Europe/Sofia):** After explicitly LOCKING EP004 SHOT01 V8, Director instructed “точно така! Да започваме!” and authorized the Executor to start building SHOT02. The exact Director-locked predecessor is [EP004 SHOT01 V8](../visual/EP004_SHOT01_V8_DIRECTOR_LOCK_20261120.md).

## Verified predecessor (do not edit or re-render)

- Canonical approved V8 MP4 **`e8f3818e-aac0-40f2-8e1a-d70e9fa108e0`**, worker source **`590448542604e8308750664354bbd8dea55a53e5`**, render **2001 frames / 30fps / 1920×1080 / H.264 AAC / 66.7 seconds**.
- Actual last encoded video frame **index 2000**, which must be the seam source; the actual decoded final-frame byte hash was **not obtainable through current connected tools**. Do not invent it.
- Original Director-approved Voice Take and eight HEAR→SEE cue IDs for SHOT01 remain immutable; locked EP001–EP003 sources are not modified.

## Implemented in source and native tested

Source [PR #342](https://github.com/stefanVasilev17/media-os/pull/342), exact native-verified head commit **`6cfa25fbab435317b7ad9c27378f9dd3eb2c89d8`**, merge commit **`6ba1329dd255c2c73600428c24cdaaf10e6107b5`** into actual production lineage. Changes are new episode-4 files only, add a standalone preview to the main Remotion catalog, and one new existing-worker Docker test step. Nothing in `Shot01OrdinaryWorkday.tsx` or native SHOT01 state machinery was edited.

1. `EP004Shot02ContinuityWorld.mjs` plus `.d.mts` define a strict **preview-only state machine**, anchored to the exact V8 Render ID/source commit/source script hash, duration 2001, predecessor final frame 2000, and `worldStartFrame=2000`. `ep004Shot02World(0,props)` is exactly equal to the **modeled** ending state `ep004Shot01Exit(...previewOnly:true)`: same camera, request IDs, world frame, ports, degradation state, feedback signals and original living-world JSX state; frames 1 onward advance all real request/detection particles.
2. `Shot02ContinuityV1.tsx` copies the approved V8 native SVG scene into a **separate SHOT02-only file** with same Outlook client, 365 menu clearance, Load Balancer (green internal marker still hidden), API Gateway, pods, route paths, packet shape/opacity and tension colors; no new cards, fabricated mechanisms, fake captions or changes to any locked source. The first 60 frames show continuously moving request streams with stable camera, no multi-frame still frame. The subsequent tiny preview camera move is provisional, not Director accepted.
3. `Root.tsx` registers **`EP004-SHOT02-CONTINUITY-V1-STORYBOARD`**, a **visual-only Remotion development composition** default 270 frames/30fps. It is clearly watermarked “CONTINUITY MOCK · NOT DIRECTOR LOCKED”. This is **not** a SHOT02 source-ready voice composition and deliberately has **no `Shot02GeneratedScene.tsx`**; Factory production registry discovers **EP004-SHOT01 only**, as protected.
4. Five new regression tests in `ep004-shot02-continuity.test.mjs` check exact predecessor identity, frame-0 **modeled** snapshot, motion in all 60 prelude frames, 270-frame route correctness and no visible packet teleports, matching living-world JSX, and failure closed when `previewOnly=false`. Dockerfile adds its execution to the shared existing native worker CI.

**NATIVE TEST EVIDENCE:** Existing same Railway worker deployment `d6a3cf73-e017-470b-bd4f-4b0357cf7214` **SUCCESS**, exact code source commit `6cfa25fbab435317b7ad9c27378f9dd3eb2c89d8`, with `claimsEnabled=false` and `renderConcurrency=1`. **5/5 new SHOT02 tests PASS**, **23/23 SHOT01 regression tests PASS**, **173/173 shared worker regressions PASS**, Factory isolation **PASS (3 EP004 files, only SHOT01 registered for production)**, TypeScript preflight **zero new errors** (pre-existing locked EP001 diagnostic remains) and both main/factory Remotion bundles **PASS**. This is a **source/native compiled storyboard only**: no separate SHOT02 MP4, no paid preview render, no new TTS, no new infrastructure.

## CRITICAL next verification — no invented content

**The actual Director-approved EP004 SHOT02 script / selected Voice Take / true per-beat alignment is not present in the available versioned GitHub/project sources.** It may be in the authenticated MediaOS episode package, but that private source was not accessible through these connector actions. Do not write narration from guessing what the second scene “should” be. The preview uses synthetic SHOT01 *preview-only* cues solely for modeling continuity; **do not claim pixel equality to the real decoded V8 MP4**.

Before creating **`Shot02GeneratedScene.tsx`**, production render manifest, syncing real HEAR→SEE events, or a CPU job:
- Read real SHOT02 Script/SCENE/voice state from authenticated MediaOS, or obtain the exact Director-controlled package export.
- Verify actual V8 S3 MP4 SHA-256 and decoded **last encoded frame 2000**, and compare SHOT02 first real frame 0 under true SHOT01 selected Take and cue timing; no static-photo cover beyond frame 0. The current code is a conceptual/structural seam, not an independently pixel-verified film seam.
- Define the SHOT02-specific causal beats from the source, assign each cue to its real text/verified voice timestamp, add narrative-specific meaningful visual changes and camera choreography; preserve V8 node geometry and colors unless Director explicitly authorizes otherwise. Use original creator's voice and agreed style only.
- Build an authentic SHOT02 GeneratedScene and run factory isolation and source-matched worker readiness before any separately authorized paid CPU render.
- After Director reviews candidate SHOT02, make a WIP sequential film preview of locked V8 SHOT01 + candidate SHOT02, not a fake locked master. On Director SHOT02 approval, produce SHA-verified cumulative EP004 **SHOT01+SHOT02** locked film in same approval workflow.

**RELEASE DISPOSITION:** The temporary native CI deployment has `claimsEnabled=false`. Production worker must be **restored to exactly the original source-pinned V8 worker**, with previous Director-only one-job claim gate and the existing three Railway services, after this test. The GitHub SHOT02 foundation remains merged and available for next code pass. No additional Railway services, persistent volumes, Postgres binary blobs, external agent subscriptions or background paid rendering.

**STATUS:** SHOT02 **CONTINUITY FOUNDATION CODE COMPLETE + NATIVE VERIFIED; SCRIPT/VOICE/CUE/PERCEPTUAL SEAM AND MP4 NOT READY; NOT DIRECTOR LOCKED**.
