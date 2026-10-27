# EP001 — QA2 Screen-safe DNS correction and audio master review

**2026-10-27 | Director final full-episode LOCK: NOT GIVEN.** SHOT01–12 original Director-locked sources remain unchanged. This event documents a new derived full visual master and a separate unapproved audio-mastering review file.

## VQA-001 closed after actual-frame inspection
- Newly rendered isolated corrected SHOT04: `d62735ed-2880-4780-9d53-956ce5f91fd1`, 1920×1080, 2601 frames, 7,988,997 bytes.
- Screen-safe text source `remotion-engine/src/episodes/ep001/live-diagram/NetworkTransitScreenSafePolish.tsx` and import in `FinalPolishSourceShots.tsx`. Main captions positioned outside zooming `ATCameraRig`.
- Railway-function extraction from that exact MP4 examined local frames 27.7, 29.2, 30.7, 32.7, 34.0, 35.2, 44 and 80 seconds. DNS caption completely visible in all active sample frames. Other scene architecture remains recognizable.
- New full raw 12-shot aggregate `8a6590f8-600c-48a2-8254-145beb9f3cc5`, 118,119,371 bytes. Same 12 source frame lengths as earlier exact 37703-frame manifest, including 60-frame/2-second visual hold after SHOT04.
- Repaired CFR **video reference master**: `bd28e1b3-6539-4561-95e6-e5f44a2c84ec`, 115,593,221 bytes, 1920×1080, 30 FPS, 37,703 planned frames / 20:56.767. Playback: https://media-os-backend-production.up.railway.app/api/v1/remotion/renders/bd28e1b3-6539-4561-95e6-e5f44a2c84ec/video
- FFmpeg opened this exact MP4: H.264 video, AAC stereo 48kHz, reported 1920×1080, 30fps, duration 00:20:56.77. Extracted actual full-master frames at absolute 03:38 (218s) and 03:43 (223s), both show centered complete DNS caption with no lower-edge clipping. VQA-001 screen clipping is therefore **visually resolved at both target checkpoints**.
- This is a **sampled-frame visual pass** and FFmpeg-format check, not comprehensive frame-by-frame inspection of all animation motion. A second independent stsz/stts atom-count audit of this newest CFR output was not obtained; do not claim that additional audit completed.

## Separate nondestructive Audio Mastering review derivative
- Added explicitly opt-in audio mastering branch to `remotion-engine/cpu-worker.mjs`, commit `9573f905ea1ab8b1a3636446dc1a9661c1045c47`, with exact 37,703-frame, 1920×1080, 30fps source guard; no changes to default or locked renders.
- Mastering command copied H.264 video bitstream with `-c:v copy`, re-encoded **only** audio using `loudnorm=I=-16:TP=-1.5:LRA=11` and stereo AAC 48kHz 192kbit. Target loudness and true-peak values are **configuration goals**, not verified measured outputs.
- Audio review render `e03c87c6-3f68-40cb-adba-24020bca28af` successfully completed in worker: 94,127,577 bytes, 1920×1080, 30fps, planned 37,703 frames / 20:56.767, profile REVIEW.
- Playback: https://media-os-backend-production.up.railway.app/api/v1/remotion/renders/e03c87c6-3f68-40cb-adba-24020bca28af/video
- Voice-over was not regenerated; no SHOT source modified. FFmpeg audio loudness analysis of the **new mastered** file was attempted but the QA runner command was rejected, so do not claim measured -16 LUFS/-1.5 dBTP. Existing pre-master read-only measurement was about -22.32 LUFS, -3.54 dBTP.
- Director must compare perceived loudness/dynamics against the visual reference and approve the mastering style, and independent audio output meter/read-back should be completed before treating mastered file as upload release master.

## Remaining gates
1. Verify actual post-master integrated LUFS, true peak and continuous playback/clip-boundary audio alignment, and confirm MP4's actual video frame/sample count remains exactly 37703.
2. Director editorial listen/watch on both 20:56 masters, not only stills; do not FINAL LOCK automatically.
3. Finish thumbnail/title, YouTube description, exact chapters, English captions, pinned comment and >=3 vertical Shorts; rights/metadata and publication settings review before final release.
4. Record explicit FINAL EP001 DIRECTOR LOCK on exact approved render UUID only after Director requests it.

All derived MP4s are **review candidates**, not a YouTube publication or final Director creative lock.
