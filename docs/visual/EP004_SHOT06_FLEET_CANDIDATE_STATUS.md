# EP004 SHOT06 — V2 moving handoff candidate (2026-11-25)

V1 source 671746ca2e90908aaeafbda68e3e9e636543132c: actual Backend and Worker SUCCESS; runtime readiness true, 2373 frames, 10 verified cues, original voice and locked SHOT05 SHA verified. Render b1618ea8-aa98-4b6e-8362-f904c2470a29 completed 7193728 bytes, 79.1s, 1080p30 H264/AAC, 72f delay PASS, seam PSNR 45.15. Director liked the main fleet but rejected frozen predecessor and redundant microcopy; not LOCKED.

V2 source commits 5949d1402c937b4cb98418df72d8a55209029be2, b26782cfaa4717cb35c5ed73a53f0fa6224a1ce3, 4b9756a81a973269f74009cf7650940fdafbd2f2 remove the four requested labels and demand rail. Exact decoded final SHOT05 frame 2572 then real forward footage 2429–2499 (144f common packet/pulse phase). Verify phase PSNR >=30 and >=20 unique first 30 decoded frames before CPU. Dissolve to moving fleet during frames 12–60; no static overlay beyond frame zero. Composite before original approved AAC mux; verify output dimensions, rate, frame count and existing final seam/motion checks. Conceptual topology remains illustrative, not real Microsoft telemetry. No voice/cue/locked media change, no new paid render. V2 build/promotion/readiness pending until live evidence; Director visual review remains required.

Historical integration notes:

# SHOT06 — guarded production integration candidate

Status: source integration committed; NOT deployed or render-ready. Director approved the fleet reference and confirmed the existing approved SHOT06 voice Take. Do not regenerate voice or modify locked SHOT05 V10.

## Implemented
- EP004-SHOT06-SERVER-FLEET-V1-VISUAL composition and production wrapper, registered in source.
- Director-only render/readiness route, current selected approved Take and ten original beat cues, audio manifest/SHA/bytes verification, exact locked SHOT05 predecessor identity, real decoded previous frame requirement, source-pinned worker and callback guards.
- Existing MediaOS UI and film composition registration; Worker preflight, mux and seam checks; explicit render consent remains required.
- Cinematic server fleet, sampled rounded routes, deterministic request flow and pressure/failure sequence, balanced surviving destinations, camera push/pull, no invented actual Microsoft telemetry. Original voice timing is supplied by authenticated MediaOS, never synthetic fixtures.

## Evidence
- Source candidate 295fe5bc12b12e44ed3d16482cd5c2e9e2342c5d.
- 13/13 isolated deterministic motion checks passed. Production validator audit passed on synthetic fixtures using extracted SHOT04/05 validators; seven malformed input cases rejected.
- Dedicated Node production and Java security regression tests added, but full Docker/Maven/Remotion builds and encoded frame QA have not run.
- Existing locked predecessor: render 38162e2a-3bc2-4c07-80d8-fa445cdc5e8d, source 1766ff8391b81c928acae0578cfebcae73d7a1b1, 2573 frames. Exact persisted MP4 SHA-256 and authenticated selected SHOT06 Take/cue payload not retrieved by available tools.

## Remaining gate
Authenticated MediaOS preflight must validate actual stored media and cues; build/test and explicit production promotion must be verified before reporting READY. Existing backend/Worker pins unchanged; no new infrastructure, no paid render, no TTS, no changes to previous locked outputs. Do not substitute synthetic timings or bypass the sequential evidence gate.
