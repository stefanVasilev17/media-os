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

## Native execution verified — 2026-10-24

- Railway one-shot audit verified SHOT01–05 native LOCKED, QA PASS, exact active render IDs preserved.
- SHOT07 v10 **native post-render QA PASS**: all seven checks passed; `POST /api/v1/visual/lock` succeeded; subsequent read of `GET /api/v1/visual/state?scriptRevision=3` confirmed `locked=true`, `lockedRenderId=dc31f24e-ea31-462a-8398-457f780e7f6a`, `qaStatus=PASS`. This is both Director- and database-locked.
- Existing old SHOT06 native render `de3532d5-d76c-4dbf-a08a-9ea5fa7e972a` is a **1280×720 FAST_PREVIEW** generated 2026-10-20, before the 2026-10-21 v5 Director approval; `locked=false`, `qa=PENDING`. **NEVER promote this old render to Director-approved v5**.
- 2026-10-24: verified current `LoadBalancerYoutubePreview.tsx` source contains v5 map-hold constants `PANEL_REVEAL_START=225` / `PANEL_REVEAL_END=285`. Recreated SHOT06 v5 audio tracks from the unchanged seven approved voice clips, six 60-frame holds, 90-frame end hold, all required spoken anchors (`THREE_COPIES=7.121s`, `SERVER_A=9.921s`), total 5137 frames. Storage check `ESTIMATED_OK`.
- **New SHOT06 v5 native 1920×1080 REVIEW candidate** `86d0edad-6efd-46c7-b041-627f3ac78333` queued 2026-10-24T16:36:03Z; Railway worker claimed at 16:36:10Z and reported 5% progress. This candidate is **NOT YET Director-native-LOCKED**. Verify finished video against the actual approved v5 before passing QA/LOCK.
- Previously assembled current-episode preview `b97658ac-473d-4b64-858d-36c164759956` contains SHOT01–05 only (12124 frames at 30fps). **No SHOT01–07 composite has been rendered or claimed.** Once SHOT06 v5 candidate is approved and native-locked, build a new contiguous SHOT01–07 composition with all seven exact locked IDs, retaining all original audio and previous episode preview.
