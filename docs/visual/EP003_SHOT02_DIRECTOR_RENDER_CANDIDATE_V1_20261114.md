# EP003 SHOT02 — Find the Real Bottleneck — REAL Director Review V1

**Date:** 2026-11-14 Europe/Sofia. **Status:** Actual rendered MP4 SAVED / verified; **NOT Director-LOCKED**. Script v0.4 and voice are LOCKED and unchanged. This is the first SHOT02 visual review.

## Saved actual artifact

- **MediaOS render ID:** `c77410f6-3e9a-4848-aa87-7674d598ad3a`; render_key `EP003_SHOT02_V1`; status `SUCCEEDED`; profile `REVIEW`.
- **Direct URL:** https://media-os-backend-production.up.railway.app/api/v1/remotion/renders/c77410f6-3e9a-4848-aa87-7674d598ad3a/video
- **MP4 SHA-256:** `f8965119f7e8815f3b71dbdae7b1df465105f2b93dc41f4291a3b76ed01377bf`
- **Exact saved bytes:** 13,735,625. H264 video + AAC audio, **1920×1080, 30 fps**, **3383 frames**, 112.7667 seconds.
- **Rendering source commit:** `744aee776df21c089c9e64d222475ca761954194` from `feat/ep003-shot02-director-v1-real-voice-p0-20261114`; immutable deployed source of the artifact. Subsequent doc commits do not change the MP4.
- **Selected and locked Slow Natural Voice Take:** `c4131401-2b42-4bac-873f-05de50040c99`, original measured duration 112.24 seconds; Script v0.4 spoken SHA-256 `226de3610de61431fb89577aef6e3a46c1d8ff925a8725e9b982dcc6720e1b40`. ZERO TTS regeneration, no narration edits, no synthetic HEAR→SEE times.

## Hard P0 handoff from actual SHOT01 V2

- Previous exact Director-LOCKED MediaOS render ID `b6fd7f30-7c78-414b-a88c-387c0ee8c43a`, **2514 frames**. Predecessor actual MP4 SHA-256 `da6d3cbc77dc3a0dc5374aec4a7ba8beb97739d4c5facffdf36d1585e7587c08` verified against original stored bytea **before** rendering.
- Extracted real V2 **last encoded frame 2513**, PNG SHA-256 `0d3426243dce2f9b2f0863f75ae5dab0356a514cc082f7177b777f09bcd11556`. Used that exact frame as new SHOT02 frame 0 source image.
- Continuous simulation starts from the same Living Architecture world frame **14491**, same camera (`translate3d(-7px,0,0) scale(1.007)`), same Phone/Gateway/Balancer/3 Auth/one User Database, existing shared on-path request particles and same visual system. No fake request dots, new replicas or teleporting path.
- **Measured actual encoded-frame PSNR:** **44.651268 dB** vs actual V2 end frame, min 27. **P0 pixel gate PASS** (higher is better). PSNR alone does not prove human-perceived motion continuity; Director must watch the actual SHOT01→SHOT02 joined seam and the complete candidate before approving.

## Genuine 11Labs HEAR → SEE cue anchors and readable text

Exact REAL narrator-derived frame locations at 30 fps (no invented timings):
| Cue | Start frame | End frame | Total display window | Fully opaque middle |
| --- | ---: | ---: | ---: | ---: |
| INTRO / One architecture | 2 | 599 | 19.90s | 18.63s |
| DEMAND / 900 incoming | 599 | 793 | 6.47s | 5.20s |
| CAPACITY / 500 measured | 793 | 1381 | 19.60s | 18.33s |
| QUEUES / waiting | 1381 | 1896 | 17.17s | 15.90s |
| THROUGHPUT / latency | 1896 | 2137 | 8.03s | 6.77s |
| BOTTLENECK / shared DB | 2137 | 2357 | 7.33s | 6.07s |
| MORE_AUTH / same DB | 2357 | 2659 | 10.07s | 8.80s |
| BUDGET / ~450 | 2659 | 3129 | 15.67s | 14.40s |
| NEXT / more DB capacity | 3129 | 3383 | 8.47s | 7.20s |

Each cue has at least the global **5.5-second total dwell** and at least 5.2 seconds fully opaque. All captions are one existing content-fit architectural info card (max one at a time) in verified negative space at x560, y742. No extra independent overlay panel or new request markers. A too-short cue would be omitted completely by `ep003CardIsReadable` guard. This is code/timing verified; real viewing remains Director's responsibility. No fast caption glitch from original EP003 SHOT01 V1 source.

## QA and cost protection

- Railway `ep003-shot02-director-render-once` successfully executed exactly pinned source and all scope-correct tests **6 PASS / 0 FAIL**, Remotion bundle built, TypeScript preflight **zero new errors**, with one accepted unrelated legacy EP001 diagnostic.
- Successful MP4 ffprobe guarantees H264/AAC, Full HD, frame count/duration, actual stored bytes. First-frame P0 PSNR recorded above.
- Frontend/backend new in-MediaOS SHOT02 Director player deployed from `feat/ep003-shot02-director-review-player-20261114`, Java+Postgres **532 tests 0 failures, 1 skipped**, frontend 34 tests passing. Real latest render endpoint `/api/v1/remotion/renders/ep003/shot02/latest-successful` is READ ONLY. Original SHOT01 V2 player now reports Director LOCKED for exactly its V2 artifact.
- Explicit one-shot Railway `EP003_DIRECTOR_SHOT02_RENDER_APPROVED` flag reset to `false` **after V1 real MP4 saved**, with no extra deployment/re-render.
- Director visual LOCK is NOT auto-issued. Review full shot playback, no card collisions/overflow, request particles on source login paths, and actual join. If Director approves, canonically lock `c77410f6-3e9a-4848-aa87-7674d598ad3a`; then use SHOT02 actual last encoded **frame 3382** and continued world time **14491+3382=17873** as SHOT03 opening. NEVER use SHOT01's last frame directly to begin SHOT03.
