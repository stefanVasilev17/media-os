# EP003 SHOT02 — V2 TECHNICAL GLOSSARY ONLY — actual saved MP4 / Director Review

**Date:** 2026-11-14. **State:** REAL H264/AAC video saved, backend/UI deployed, P0 first-frame verified. **NOT Director LOCKED**. The Director liked V1's architectural animation but rejected 9 low-value generic pop-up cards. V2 keeps the exact approved design and uses ONLY spoken technical terms + concise definitions. Global policy: [Director P0 glossary-only information cards](../engineering/AT_DIRECTOR_P0_TECHNICAL_TERMS_ONLY_INFO_CARDS_20261114.md), documented and merged by PR #283, wording adjustment PR #286.

## Exact immutable production evidence

- **NEW V2 MediaOS render ID:** `3222a875-a8c3-4993-bfd1-8d6535ad38ba`, `render_key=EP003_SHOT02_TERMS_V2`, `composition_id=EP003-SHOT02-TERMS-V2-DIRECTOR-CANDIDATE`, status `SUCCEEDED`, profile `REVIEW`.
- **Director playable MP4:** https://media-os-backend-production.up.railway.app/api/v1/remotion/renders/3222a875-a8c3-4993-bfd1-8d6535ad38ba/video
- **Actual saved MP4 SHA256:** `c579c26b4097e045748c5890f8b774807680ed5dfa169e78531b166720767532`.
- **Saved byte length:** `12,790,058`; H.264 visual + AAC original voice, `1920×1080@30fps`, `3383 frames`, **112.7667 seconds**.
- **Source SHA:** `d9e3668e3460f1ccbf9db5227d5883cb0297f07d`, immutable GitHub render build pin. Its bundled 7 source/P0 tests **7 passed/0 failed**, Remotion bundle built, TypeScript accepted one pre-existing EP001 baseline diagnostic / zero NEW errors.
- **Voice original / absolutely unchanged:** selected Director-LOCKED Slow Natural SHOT02 Take `c4131401-2b42-4bac-873f-05de50040c99`, actual measured audio `112.24s`, exact locked Script SHA256 `226de3610de61431fb89577aef6e3a46c1d8ff925a8725e9b982dcc6720e1b40`. No ElevenLabs call, no narration edit.
- **Prior V1 preserved (historical, NOT Director LOCKED):** `c77410f6-3e9a-4848-aa87-7674d598ad3a`, 9 generic cards; V2 never overwrites it.

## Critical P0 actual SHOT01 V2 → SHOT02 V2 seam

- First frame is pinned to real decoded **last encoded frame 2513** of Director-LOCKED SHOT01 V2, exact previous MediaOS MP4 `b6fd7f30-7c78-414b-a88c-387c0ee8c43a`.
- Original predecessor MP4 SHA256 `da6d3cbc77dc3a0dc5374aec4a7ba8beb97739d4c5facffdf36d1585e7587c08` was checked BEFORE the render. Decoded predecessor final PNG SHA256 `0d3426243dce2f9b2f0863f75ae5dab0356a514cc082f7177b777f09bcd11556`. No guessed reference.
- World simulation continues at **frame 14491**, with unchanged shared `Shot07CleanArchitectureWorld`, Phone, Gateway, Balancer, three Auth nodes, one shared User Database, same camera `translate3d(-7px,0,0) scale(1.007)` and original connector/request-particle geometry.
- **Actual newly encoded first-frame PSNR: 44.652046 dB**, required ≥27 dB. Source first-frame pin / pixel continuity **PASS**. Human-perceived perfect motion seam still requires Director to inspect real playback, not just this numeric gate.

## Genuine audio-linked technical terms: four glossary cards ONLY

| Term | Exact visible definition | Real onset frame | Onset in episode | Card total dwell | Full-opacity hold |
| --- | --- | ---: | ---: | ---: | ---: |
| THROUGHPUT | Work completed in a given period | 1008 | 33.60 s | 9.00 s | 7.73 s |
| LATENCY | Time one operation takes to complete | 1657 | 55.23 s | 9.00 s | 7.73 s |
| BOTTLENECK | The component limiting total Login capacity | 2137 | 71.23 s | 9.00 s | 7.73 s |
| ADMISSION BUDGET | Caps DB lookups, including retry work | 2755 | 91.83 s | 9.00 s | 7.73 s |

These positions were derived from the REAL saved ElevenLabs audio's character alignment; no guessed cue frames or paid voice regeneration. Stable card opacity equals 1 between ~18-frame entrance fade and ~20-frame exit fade, each fixed 9 s at 30fps. Content-fit checks passed, including initial failed overflow regression on longer Admission Budget wording—definition was shortened **before rendering** rather than shrinking fonts / changing container dimensions.

No general-purpose text overlays for 900/500, queues, 'one architecture', 'more servers same database' or outros. All architectural explanatory information remains in the already-approved diagram and voice; no new floating request markers or visual resets. Persistent labels INSIDE nodes and the top architecture heading are not explanatory cards and remain unchanged.

## Director and future SHOT03 contract

- SHOT02 V2 is **REAL SAVED/QA CHECKED, awaiting Director human visual approval**. No claim of full pixel-perfect cross-frame motion from PSNR alone, no generic card approval unless the Director accepts after watching.
- New in-MediaOS SHOT02 review reads the most recent successful V2 or earlier V1 fallback; deployed UI/backend commit `16cb87ce86db3e35ad22189af8ef2cd1e4a89138`, backend verified successful 532 Java tests / 0 failures and frontend build. Source PR #285 merged into frontend feature branch.
- Render authorization `EP003_DIRECTOR_SHOT02_V2_RENDER_APPROVED` was reset **false** without redeploy after the saved V2 MP4, avoiding accidental paid repeat render. V1 gate also previously false.
- If and ONLY IF Director explicitly LOCKS V2, prepare SHOT03 from **actual decoded last encoded V2 frame 3382**, then verify seamless 3382 → SHOT03 frame0 and continue world frame **14491+3382=17873**. Never use the rejected/unlocked V1 last frame, no frame screenshot approximation. SHOT03 original Slow Natural Take remains untouched.
