# EP003 SHOT07 — Bottleneck Measurement — Director Handoff
**Date:** 2026-11-14
**Status:** SHOT06 V1 Director-LOCKED. SHOT07 V1 visual code is built and all seven P0 tests passed; **full voiced SHOT07 MP4 is blocked by missing selected Director-approved Slow Natural Take**. Never call TTS automatically and never claim SHOT07 is rendered/locked.

## Approved canonical source
- `remotion-engine/ep003-director-locked-visual-sequence.json` has exactly SHOT01–SHOT06, all Director LOCKED, 19480 frames = 10:49.33.
- Official 6-SHOT master `ee3d01d9-bb88-4ae5-8313-8220263e026e` is SHA-pinned stream-copy of the original six sources; five real seam QAs pass, including SHOT05→SHOT06 42.833128 dB. MediaOS must show one official latest full film, not duplicate WIP movies.
- SHOT06 approved standalone MP4 UUID `0007bd16-edbf-4ecc-927a-4a5781d0b921`, SHA256 `4d38c8a5777b2eeab1952bd8960a925feae0672d142b70b12b2a2df2392d4a3f`, 3601 frames, worldStartFrame 27852, last world frame 31452, original Slow Natural selected Take `ff8ed53c-f405-43d5-82d9-33cac97cd811`.

## SHOT07 visual source — immutable SHOT06 handoff
- Exact locked script: `SHOT07 — Did We Really Fix the Bottleneck?` in `backend/src/main/resources/ep003-director-locked-voice-package-v1.json`, no editorial changes.
- New Remotion component `remotion-engine/src/episodes/ep003/Shot07BottleneckMeasurementV1.tsx`.
- New runner `remotion-engine/ep003-shot07-bottleneck-v1-render-once.mjs`. Composition ID `EP003-SHOT07-BOTTLENECK-V1-DIRECTOR-CANDIDATE`, renderKey `EP003_SHOT07_BOTTLENECK_V1`.
- Render SHA guard verifies original SHOT06 MP4 bytes and extracts **decoded frame 3600** as exact frame 0 of SHOT07. SHOT07 worldStartFrame must equal **31452** and frame 1 resumes live without a static cover.
- Exact existing camera `translate3d(-7px,0,0) scale(1.007)`; `Shot07CleanArchitectureWorld` unchanged. Two small replica cylinder glyphs and original query/replication Bezier paths. Existing replica age and dash offset continue seamlessly with +3600 frame carryover. No new off-path request packets.
- Match previous last-shot headline `CORRECTNESS BEFORE SPEED` before dissolving to `DID WE FIX THE BOTTLENECK?` at real spoken original-problem cue. Primary label begins `READ → PRIMARY`, replicas begin `SUITABLE READ → REPLICA`.
- Eleven content-fitted, collision-checked cards visualize original 900 new Login requests/sec vs ~500 original account lookups/sec, optional replica reads, required authentication critical path and unchanged Primary bottleneck, leading to independent database ownership/sharding. Cards at left=560,top=771, same colors/type. No container nesting or text overflow. 27 exact narration phrase cues with no fabricated timestamps.

## Critical current blocker
- Railway `ep003-shot07-bottleneck-v1-once` service ID `76697aff-b8ae-4c03-a879-b7134158ec0a`, deployment `026e13cd-13a2-45cd-8730-81521ef61e0e`: **7/7 P0 tests passed, application started**, then `EP003_SHOT07_RENDER_BLOCKED Error: EP003_SHOT07_NO_SELECTED_SLOW_NATURAL_TAKE__USE_DIRECTOR_VOICE_STUDIO_ONCE__NEVER_AUTOGENERATE`.
- Per `docs/engineering/EP003_SLOW_INTAKE_VOICE_FACTORY_RELEASE_20261113.md`, Director must open MediaOS → EP003 → SHOT07 → Voice Studio, use existing saved take if any and explicitly select, or personally authorize ONE paid `Generate (slow intake)` request, listen and approve. No automatic spend/selection or retry; script remains immutable.
- **Only after a selected original Slow Natural Take exists**, re-run SHOT07 renderer on a new isolated once service (or fresh authorised deploy with idempotency checks), read real alignment and duration, confirm first-frame PSNR >=27dB / >=18 moving steps / real H264/AAC 1920×1080 30fps, capture saved render UUID and source SHA.
- Then assemble an isolated 7-SHOT **WIP**, verify six real encoded joins by PSNR and pixel identity >=50 dB. Do not promote SHOT07 into official latest master before Director explicitly watches and LOCKs it.
