# EP003 SHOT01 — V2 READABLE CONTAINERS — REAL MP4 / DIRECTOR REVIEW

**Date:** 2026-11-14 (Europe/Sofia)
**Status:** V2 actual video rendered and persisted in MediaOS; **NOT Director LOCKED**.
**Director correction:** Small caption cards appeared for less than a second and disappeared before they were readable. The original source had an inverted next-cue opacity multiplier, not a narration timing issue.
**Canonical global P0 rule:** [Director Text Dwell or Omit](../engineering/AT_DIRECTOR_P0_TEXT_DWELL_OR_OMIT_20261114.md) merged via PR #277.

## REAL verified V2 video artifact

- V2 render ID: `b6fd7f30-7c78-414b-a88c-387c0ee8c43a`
- Director URL: https://media-os-backend-production.up.railway.app/api/v1/remotion/renders/b6fd7f30-7c78-414b-a88c-387c0ee8c43a/video
- Source SHA: `01279808c702edc006efa728d287749108f6d5de` — branch `fix/ep003-shot01-readable-cards-p0-20261114`.
- Saved MP4 SHA-256: `da6d3cbc77dc3a0dc5374aec4a7ba8beb97739d4c5facffdf36d1585e7587c08`.
- MediaOS saved actual MP4: **10,287,488 bytes**, H.264/AAC, 1920×1080, 30fps, 2514 frames = **83.8 seconds**, `VISUAL_REVIEW_REQUIRED__NOT_LOCKED`.
- Original Director-LOCKED voice Take ID `1bde96be-d530-4ccc-ae0f-3bea138879d7`. No TTS regenerated, no transcript changed, and no fabricated timestamps.
- EP002 end render ID `73ec0e6f-d348-4518-a32b-573bf89a8ab5`, real pinned last frame PNG SHA `9c1110155e5816c72745aaae1ec1c1ad83c6d4d85ad496d6e8a9c276a9c46365`.
- **Measured actual rendered first-frame P0 QA: 38.976003 dB PSNR**, threshold ≥27. **PASS** for pixel continuity. This alone does not prove viewer-perceived motion seam or every visual frame; human Director must inspect.

## Source cause and exact fix

V1 source formula `ease(since,0,22)*(next?1-ease(until,0,21):1)` inverted the outgoing fade; for most frames in an interval, `until>21` meant opacity zero, so the card appeared only at the very end. V2 replaces this with a tested full-window envelope:

- Fade-in 18 frames (~0.60s), stable opacity **1** until 20 frames before next cue, fade-out 20 frames (~0.67s).
- Reject a card if its actual cue-to-cue budget is shorter than `max(5.5s,1.8s + displayed_words/2.6)`; omit the card entirely. Never flash, shrink text to tiny fonts or accelerate the locked narration.
- With actual selected ElevenLabs SHOT01 cue frames `[323,688,1231,1937,2217]` and final frame count 2514, the five eligible cards have **fully opaque stable holds** of approx: **10.9s, 16.8s, 22.3s, 8.1s, 8.6s**. These are source-computed envelope holds, not a human claim of actual legibility after watching the finished MP4.
- Automated scoped tests: **8 passed, 0 failed**, including all five cue windows, midpoint opacity, fade boundaries, omit-short-text behavior, content-fit, authentic request path geometry and same opening P0 render pin. Remotion bundle and TypeScript preflight complete without new errors; pre-existing Director-accepted EP001 legacy TypeScript baseline warning remains.
- No node layout, paths, moving packet geometry or style changes made in this correction. The same EP002 Living Architecture World is used.

## Version control / Director acceptance

Original V1 MP4 `078e3f41-5da0-45c2-8b6b-007e004fc491` remains untouched. V2 saved as a separate unique MediaOS `render_key=EP003_SHOT01_V2` with SHA-sensitive idempotency; no overwrite. Director must **watch V2** and confirm full readability, no container overlap, correct moving request packets and no visible seam, then explicitly LOCK V2. Neither the source PR #278 nor a successful MP4 is a Director visual approval.

**MediaOS Director player:** backend read-only latest-saved route is introduced separately via PR #279 (already deployed successfully), selecting newest V2 automatically or prior V1 while V2 unavailable. The player does no paid TTS/render. Test actual login and browser playback to confirm end-user experience.

**SHOT02 continuity:** ONLY AFTER Director LOCK of V2, pin the exact last real encoded V2 frame **2513** as SHOT02's opening frame, inheriting the true world state including camera and in-flight request motion. Never use the original V1 final frame if Director chooses V2. P0 must be rechecked at the actual SHOT01→SHOT02 assembly boundary.

**Paid render guard:** after successful V2 storage the one-shot Railway execution flag `EP003_DIRECTOR_SHOT01_RENDER_APPROVED` was disabled (`false`, skip redeployment), preventing further autonomous corrective renders.
