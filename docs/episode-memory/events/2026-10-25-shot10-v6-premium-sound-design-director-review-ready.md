# EP001 — SHOT 10 V6 — kinetic diagrams with synchronized sound design — Director preview READY

**Date:** 2026-10-25. **Director feedback:** fix V5 static/boring presentation, remove ellipses in session/token IDs, make architecture more kinetic, add actual audio. **State: V6 media-ready for Director review; NOT LOCKED.** Existing SHOT 01–09 final cumulative `fd1046d0-6b20-4267-8135-8b67add2ca33` remains approved and untouched.

## Exact V6 current preview
- **Composition:** `EP001-Shot10-SessionCreationShortV6`
- **Render ID:** `76f384f1-960d-44d0-8c4d-ba484301258b`
- **Playback:** https://media-os-backend-production.up.railway.app/api/v1/remotion/renders/76f384f1-960d-44d0-8c4d-ba484301258b/video
- **MediaOS state:** READY, 100%, 7,896,307 bytes, 1280x720 FAST_PREVIEW.
- **Independent FFprobe:** H.264 1280x720; **2160 frames at 30 fps; actual video duration 72.000 seconds**; **AAC mono audio 48kHz actual duration 72.000 seconds**. This is not a silent render.
- **Audibility/volume QA:** FFmpeg volumedetect actual mean -37.2 dBFS, peak -20.1 dBFS; intentionally subtle underscore; review for audio mix adjustments before any final sound master. Actual video frame decodes at t=8,18,31,42,55,69,71s all PASS.
- **Sound design:** 19 precisely synchronized bespoke synthesized technology UI cues and soft background noise atmosphere, mapped to architecture stages; added by guarded Remotion CPU worker FFmpeg postmix using AAC while stream-copying original H.264 video. No third-party sound licensing assumptions. User explicitly asked for sound. This is **SFX, not a new generated voice-over**. Narration script and voice generation for SHOT10 still need their own Director review.
- **Source:** `remotion-engine/src/episodes/ep001/live-diagram/Shot10SessionCreationShortV6.tsx` (commit `dd5e77d934cda82b285e87647aefc8fc7f9426a3`), enhanced cinematic orbital background, signal rails, pulse lights, animated focus progression; improved real data examples.
- **FFmpeg sound mux:** `remotion-engine/cpu-worker.mjs` commit `385db63cc3f3ef909072d2cabf41d68b4e7696c6`; strictly scoped `inputProps.soundDesign='SHOT10_V6_PREMIUM_SFX'`, composition V6 and 2160 frames/30fps, fails if existing `audioClips` provided. No old-shot voice alterations.
- **Root registration:** `remotion-engine/src/Root.tsx`; Backend `RemotionRenderController.java` registered V6, deploy commit `d940e672737405a07ec8553c75eed5beab19289b`.
- **Input props:** `durationInFrames:2160`, `audioClips:[]`, `soundDesign:'SHOT10_V6_PREMIUM_SFX'`. This is a visual/sfx director preview and should never be represented as final narration-sync or episode-wide export.

## Corrections in V6
- Remove trailing ellipses from session IDs and example token references; use complete deliberately illustrative sample IDs: `SID9K2F42`, `JWT00427F3A`, `HEADER7A1C`, `PAYLOAD0042`, `SIGNATURE7D2F`.
- JWT anatomy stays 3 clearly distinct visual parts, verification reveals signature and expiry sequentially. Treat token fragments as **illustrative visual references** rather than asserting those strings constitute a production-valid signed JWT.
- Server-side session design and signed JWT remain **alternatives**, not mandatory steps together.
- Add luminous active rails and background orbital circuit motion without filling the screen with busy tags. Keep canonical original living architecture at entrance.
- Timing remains strictly 72 seconds. Future edit needs a new revision, not overwriting this V6.
- The approved nine-shot cumulative 17:10.9 MP4 and individual SHOT01–09 Director LOCKs remain unchanged. No EP001 cumulative SHOT01–10 assembly until Director approves SHOT10 visuals, narration, and final sound.

## Director review next
Review actual V6 with audio for pacing, energy, legibility, and whether architectural insight is conveyed. Then prepare reviewed English voice-over and a separate voice-synced review render; do not auto-lock.
