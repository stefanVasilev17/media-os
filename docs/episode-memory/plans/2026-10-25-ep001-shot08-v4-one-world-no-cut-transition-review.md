# EP001 SHOT 08 v4 — One World, One Camera — Director DRAFT

**Director feedback:** v3 has an amateurish topic jump/transition; the user rejects changes of virtual environment and asks for a smooth continuous visual narrative. v4 is a corrective 30-second silent preview, NOT LOCKED; SHOT01–07 must remain identical and native LOCKED.

## Root-cause diagnosis

- v3 used `TerminalWorld` (frozen true SHOT07 render) **and** a separate `InnerWorld` fullscreen SVG, with global opacity crossfade over frames 339–425. The new `InnerWorld` completely replaced the world, its camera, and the object design. That was experienced as changing topics rather than drilling into storage.
- v3 camera offset `focus * (960-1733*depth)` was not a true focus-anchor transform; the tracked subject's screen position was `1733*depth + offset`, not the intended interpolation `1733 → 960`. During zoom the subject could drift offscreen.

## v4 single-world visual rule

1. Show frozen final SHOT07 video frame **4881** at frame 0 of SHOT08, using the same original Remotion `AuthServiceTier2V10YoutubePreview` and the exact locked render props, including all voice-alignment anchors and clip starts. No alteration to its code/assets.
2. Render **one single 1920×1080 camera transform** around the original User Database node center `(1733,613)`. No second fullscreen backdrop, no scene crossfade, no cut, no fabricated overview map.
3. Camera formula: `depth = 1 + 5.25 * zoom`, `targetX = 1733 + (960 - 1733) * shift`, `targetY = 613 + (540 - 613) * shift`, `translationX = targetX - 1733 * depth`, `translationY = targetY - 613 * depth`. These guarantee that the database's on-screen position follows the direct interpolation without mid-zoom jumps.
4. The new inner storage volume is an **SVG element spatially attached to the same world** at native world coordinate `(1637,520)`; its geometry is clipped into the original DB card area `x=1626 y=508 w=218 h=207`. The archive is revealed gradually **inside the same database node as its original exterior enlarges**, rather than appearing as a different canvas.
5. Show coherent retrieval from 3 physically layered storage slabs (not generic UI cards): spatial rails → cyan beam → matching Record 042 → slowly lifting record → single `alex@example.com` identity label.
6. No API Gateway/Load Balancer duplicates. No ROLE, SETTINGS, Account Status, success badge, credential-verification verdict or Dashboard in this 30-second slice. Focus stays on database for the entire shot. Minimal labels.
7. Timeline: 0–3s stable original map, 3–15s camera gently centers the physical database, 12–21s continuous dolly/zoom (final 6.25×) into the same card, 13–21s the internal layers gradually reveal, 18–25s scanner traverses data, 23–30s `RECORD 042` match and extraction. All are overlapping stages within **one world**.

## Production artifacts

- New isolated Remotion component: `remotion-engine/src/episodes/ep001/live-diagram/Shot08V4ContinuousDive.tsx`.
- New composition `EP001-Shot08-ContinuousDive-V4`, 900 frames / 30 seconds, 1920×1080 logical canvas, 30fps, supported FAST_PREVIEW 1280×720; no VO.
- Existing `EP001-Shot08-PremiumSlice-V3` and earlier v1/v2 retained as archives; none are eligible to overwrite SHOT01–07.
- One-shot independent TypeScript/Bun TSX parser test succeeded, plus deterministic camera position tests at frames 0, 90, 180, 300, 465, 630, 900. At frame 0 scale=1 and DB screen x=1733, at frame 465 DB x=960; by frame 630 scale=6.25 and DB x=960. This is a **code and math test**, not proof of cinematic success.
- Render review gate: verify playable MP4, independently capture sample frames around 0, 3, 10, 15, 20, 25, 30 seconds, check continuity, clipping, blur, timing and whether the camera follows the same object perceptually, not merely mathematically.
- Do not extend the SHOT08 voice/timeline, integrate with cumulative EP001, or approve Director LOCK before explicit visual approval.
