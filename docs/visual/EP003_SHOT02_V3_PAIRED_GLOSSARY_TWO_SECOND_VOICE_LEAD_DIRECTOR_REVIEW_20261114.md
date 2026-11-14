# EP003 SHOT02 — V3 Stacked Latency/Throughput + 2.0s Narration Breathing — REAL Director Review MP4

**Date:** 2026-11-14, Europe/Sofia. **Status:** new real H.264/AAC MP4 persisted successfully in production MediaOS; **NOT DIRECTOR-LOCKED**. The Director approved the living architecture design of prior SHOT02 but requested four specific refinements, without any voice regeneration.

## Actual saved media source of truth

- **V3 render ID:** `8598d156-438f-4614-a9dd-ce6172233d9b`, `render_key=EP003_SHOT02_TERMS_V3`, composition `EP003-SHOT02-TERMS-V3-DIRECTOR-CANDIDATE`, status `SUCCEEDED`, profile `REVIEW`.
- **Direct V3 MP4:** https://media-os-backend-production.up.railway.app/api/v1/remotion/renders/8598d156-438f-4614-a9dd-ce6172233d9b/video
- **Immutable actual MP4 SHA256:** `eee2308b3f8150ac9ac49db6b0a257374e40fbbf8ddf6b1245ae58d5400ff471`.
- **Actual bytes:** `13,082,725`, H.264 video + AAC audio, `1920×1080`, `30 FPS`, **3,443 frames** = **114.766667 seconds**. Original Slow Natural audio 112.24 seconds plus **2.00 seconds silent leading motion** and ~0.53 seconds final margin.
- **Original selected Director-LOCKED SHOT02 voice (immutable):** `c4131401-2b42-4bac-873f-05de50040c99`; locked spoken narration SHA256 `226de3610de61431fb89577aef6e3a46c1d8ff925a8725e9b982dcc6720e1b40`. NO ElevenLabs regeneration, no rewritten words, no changed natural voice speed.
- **Exact pinned rendering source:** commit `c45c790f2cc9dc50ce7b2080cad99200c48fa131`, branch `feat/ep003-shot02-v3-latency-throughput-stack-2s-leadin-20261114`; V3 source PR #287 (remain open until Director reviews/approves).

## Four Director corrections verified in implementation

1. **Longer LATENCY hold:** no automatic 9s cut at the wrong time. Both glossary cards appear from actual Latency first mention to the next Bottleneck teaching concept. 480 frames = **16 seconds**, with fade-in ~18 frames, fully opaque for 442 frames = **14.73s**, fade-out ~20 frames, including the second spoken Latency and Throughput comparison.
2. **THROUGHPUT at the voice:** first "This is its measured throughput" starts at **real unshifted frame 1008**, displayed at V3 frame **1068** (35.60s). The term is displayed AGAIN during second "Throughput tells us..." at original frame `1896` plus 60 = **1956** (65.20s), not missing as in V2.
3. **THROUGHPUT beneath LATENCY:** LATENCY has x560/y704/h131; THROUGHPUT has x560/y851/h131; **16px actual gap**, no overlap, same content-fit font/color/card style as previous EPs, separate text boxes. Pair is visible from **V3 frame 1717 (57.23s) to frame 2197 (73.23s)**; the voice says second Throughput at frame 1956, safely within this interval. All unrelated architecture nodes, paths and packet motion remain identical to V2.
4. **Two seconds before voice:** SHOT02 visual/camera/world animation begins at rendered frame 0; approved original audio is delayed by exactly **60 frames at 30fps = 2.0s**, using final AAC mux filter `adelay=2000:all=1` rather than editing/regenerating the voice. ALL actual narrator HEAR→SEE cues were derived from saved character-level ElevenLabs alignment and shifted by the same 60 frames. The original voice starts after 2s, and new duration is 3443 frames (old 3383 + 60). NOTE: this is an exact mux and cue contract; only Director audio playback judges the subjective pacing.

## P0 exact visual continuity and real video QA

- Director-LOCKED SHOT01 V2 predecessor actual MP4 ID `b6fd7f30-7c78-414b-a88c-387c0ee8c43a`, SHA256 `da6d3cbc77dc3a0dc5374aec4a7ba8beb97739d4c5facffdf36d1585e7587c08` matched against REAL saved bytea before execution. First SHOT02 V3 source PNG extracted from **actual decoded predecessor final frame 2513**, SHA256 `0d3426243dce2f9b2f0863f75ae5dab0356a514cc082f7177b777f09bcd11556`.
- Same visual world frame **14491 at SHOT02 frame 0**, original Shot07CleanArchitectureWorld component, Phone/Gateway/Balancer/3 Auth/single DB, original request particles follow real paths. Same camera `translate3d(-7px,0,0) scale(1.007)`; animation moves during the new 60-frame narrator-free prefix.
- **Measured real encoded-first-frame PSNR = 44.652046 dB vs SHOT01 V2 real last frame**; threshold >=27. P0 first-frame pixel identity **PASS**. This is objective seam evidence, NOT a guarantee of human-invisible motion across the whole boundary; Director must view real joined playback.
- Specific V3 tests **7 passed, 0 failed** including source check for first term cue, repeated Throughput comparison, actual paired duration and no box overlap, exact 60-frame prefix with shifted audio, real source predecessor MP4, no added request dots, no paid TTS, unique V3 render key. Remotion bundle and TypeScript preflight passed. No new errors.
- Source code never updates previous SHOT01 V2, SHOT02 V1 or V2 MP4, and no visual LOCK was written. No reused V1/V2 last-frame source for future SHOT03.

## MediaOS Director and next steps

**Watch:** MediaOS → Episodes → EP003 → SHOT02 · Director Video Review. The in-app latest successful endpoint recognizes V3 and gives fallback V2/V1 only until the new V3 completed; backend frontend/source pinned commit `7d29d56b465d75c97792def62f73f725d25abd9e` deployed SUCCESS with **532 Java tests/0 failures/1 skipped**, successful frontend build. UI must identify V3 `NOT LOCKED` explicitly.

**Cost:** One-shot Railway render authorization flag `EP003_DIRECTOR_SHOT02_V3_RENDER_APPROVED` switched back to `false` without deployment after successful saved V3. No new voice generation permitted.

**Human visual QA:** Director inspects final seconds SHOT01 V2 → SHOT02 opening, exact 2-second narrator pause, Latency visibly above Throughput and remains through second joint comparison, first Throughput card, source request particle paths, no collisions, no text overflow, no animation stutter. **Only after explicit Director V3 visual LOCK** will SHOT03 start from V3's REAL decoded last frame **3442**, continuing world-frame clock at **14491+3442=17933**. DO NOT use SHOT02 V1/V2 last frames if V3 gets approved.

**Permanent production rules:** [P0 paired concepts + narration breathing](../engineering/AT_DIRECTOR_P0_PAIRED_TECHNICAL_TERMS_AND_NARRATION_BREATHING_20261114.md) (#289 merged) and [reconciled one-card vs paired exception](../engineering/AT_DIRECTOR_P0_TECHNICAL_TERMS_ONLY_INFO_CARDS_20261114.md) (#290 merged).
