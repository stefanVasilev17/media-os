# EP001 — SHOT 07 v10 — FINAL DIRECTOR VISUAL LOCK — 2026-10-24

## Explicit Director approval

The Director viewed SHOT07 v10 and explicitly stated: **"Супер! Локваме!!! Нека го добавим към вече направения видеоклип!"**

**Director decision: SHOT07_V10_DIRECTOR_VIDEO_LOCKED.** SHOT 07 visuals and all five existing Director-LOCKED original voice recordings C01–C05 are frozen. Do not alter the exact approved render or replace it with a different video/visual/audio revision without explicit Director unlock.

- Repo: `stefanVasilev17/media-os`; composition `EP001-Shot07-VoiceSynced`.
- Approved source: `remotion-engine/src/episodes/ep001/live-diagram/AuthServiceTier2V10YoutubePreview.tsx`.
- Approved Remotion wiring: `remotion-engine/src/episodes/ep001/live-diagram/VoiceSyncedShot.tsx`, commit `4dc626adf0c0de9eebacd34ac0f6eb30cd06ce0a`.
- **Exact Director-approved native MP4 render ID: `dc31f24e-ea31-462a-8398-457f780e7f6a`.**
- Video URL: `https://media-os-backend-production.up.railway.app/api/v1/remotion/renders/dc31f24e-ea31-462a-8398-457f780e7f6a/video`.
- Render worker reported `Completed` at 2026-10-24T13:38:59.701902429Z, 12,258,372 bytes, 1920×1080, 30 FPS, 4,882 frames, approx. 162.733 seconds.
- Approved design: realistic iPhone with slim titanium-like bezel, Dynamic Island-style UI and masked password; no `Continue` CTA; richer high-contrast cyan/teal volumetric scanner inside User Database; full dark navy background; no floating lookup banners or extraneous microcopy.
- Original five C01–C05 voice recordings, wording, timing, pauses and alignment remain immutable.

## Cumulative video splice requirement

Append only this exact SHOT 07 v10 render to the already-approved sequential EP001 preview, preserving SHOT 01–06 masters and original audio. Before native DB LOCK, run `POST /api/v1/visual/qa/post-render` against the exact v10 render, and verify `PASS`; lock with `POST /api/v1/visual/lock` only if the active render ID is identical. Verify currently native-LOCKED SHOT06 visually corresponds to the previously Director-approved SHOT06 v5 (the v5 approval is documented separately, and an older technical candidate is not interchangeable).

Build `EP001-Voice-CurrentPreview` using exact locked, QA-PASS, contiguous SHOT01–07 segments and their stored frame lengths. Never override, unlock, or rerender prior approved SHOT01–06 files just to make the composite. If SHOT06 native lock or other prerequisites are missing, preserve this Director v10 lock decision and report the actual blocker rather than falsely claiming a combined video.

## Lock semantics

This document records the Director's **explicit creative LOCK**. It does not by itself prove the production database's native `visual_shot_lock` exists or the cumulative MP4 is rendered. The native lock and the episode render must be verified independently.
