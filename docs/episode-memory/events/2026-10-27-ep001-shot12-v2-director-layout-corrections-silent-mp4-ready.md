# EP001 — SHOT 12 — Director correction V2 silent preview READY

**Status:** V2 TECHNICAL RENDER QA PASS, DIRECTOR VISUAL REVIEW PENDING, NOT LOCKED.
**Date:** 2026-10-27.

## Director corrections, implemented in Remotion (NOT just a still)
- Director requested login account/email and masked password be visible until the successful response returns. V2 Phone remains in Login state during initial and verification path, transitions to Dashboard at approximately 76–80s, and fills private fields after the subsequent authorized protected-data request at approximately 94–99s.
- Request Assembly card widened/rebalanced so text fits inside its boundary.
- Reusable Proof label centered directly under Authentication State with more room than V1.
- Protected API placed directly below the Phone (left side); request and response routes made physically distinct to reduce crossings and keep narrative mechanics accurate.
- Remotion V2 source: `remotion-engine/src/episodes/ep001/live-diagram/Shot12CompleteLoginRecapV2.tsx`; new root composition and backend composition allowlist registration. Prior V1 preserved intact.

## Exact new silent MP4 / QA
- Composition: `EP001-Shot12-CompleteLoginRecapV2`.
- V2 renderId: `c7d8b2fd-3e22-4f68-a593-49742a8fe86c`.
- Verified playback URL:
  https://media-os-backend-production.up.railway.app/api/v1/remotion/renders/c7d8b2fd-3e22-4f68-a593-49742a8fe86c/video
- Render provider version: `AT_REMOTION_aad98e27ef94_20261027093832`.
- FAST_PREVIEW, silent, 1280×720, 30 FPS, exactly 3150 frames / 105 seconds.
- Worker logged `Completed c7d8b2fd-3e22-4f68-a593-49742a8fe86c: 1946699 bytes`.
- Backend live metadata: `READY`, `sizeBytes=1946699`.
- HTTP `Range: bytes=0-63` returned `206` and an MP4 header with brand marker `ftyp`; passed expected width/height/fps/frame count.
- IMPORTANT: verified render, metadata, and MP4 header only; do not represent this as a personally frame-by-frame watched visual QC pass.
- NO new ElevenLabs generation or dubbing included in V2 MP4. The existing C01 draft recording stays separate, C02/C03 voice states remain as previously recorded.
- **No Director LOCK issued** for this preview. All approved SHOT01–11 masters and approved voices preserved.

## Next gate
Present V2 video to Director. Receive Director notes / visual LOCK decision. Final audio timing, transitions and voice sync require separately approved narration takes. Do not overwrite V1 or previous locked masters.
