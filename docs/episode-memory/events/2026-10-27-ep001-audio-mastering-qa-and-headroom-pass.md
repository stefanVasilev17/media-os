# EP001 — Audio Mastering QA & True-Peak Headroom Pass
**Date:** 2026-10-27. **Stage:** Audio QC verified with independent FFmpeg EBU R128 + actual MP4 container sample inspection. **NOT a Director FINAL LOCK**; no voiceover regeneration, no changes to any Director-locked SHOT source.

## Reference / production identity
- Episode: Architectural Thinking EP001 — "What Really Happens When You Click Login?"
- Earlier exact 20:56.767 1080p visual reference `bd28e1b3-6539-4561-95e6-e5f44a2c84ec`. Its DB metadata remains READY but its MP4 payload has **been removed by retention** (`HEAD /video = 404`); do not link it as a downloadable video. Earlier source `08fbfdb5-...` is similarly 404. All original SHOT-locked source files retain their creative approval status.
- First actual audio mastering review `e03c87c6-3f68-40cb-adba-24020bca28af`, available MP4 94,127,577 bytes, 1080p, 30fps, 37,703 frames. Audio from a derived composite, originally mastered with `loudnorm=I=-16:TP=-1.5:LRA=11`.
- Measured directly on that exact MP4 via FFmpeg EBU R128 (input fields): **-16.46 LUFS integrated**, **-1.17 dBTP true peak**, **4.50 LU loudness range**. Pre-master visual review audio previously measured -22.32 LUFS / -3.54 dBTP (from earlier now-missing source; not a fresh before/after measured pair).
- First mastered actual MP4 tracks: video 37,703 samples at **30.000 FPS**, stream time **1256.7666667s**; audio 58,932 samples, stream time **1256.790s** (23.3 ms AAC tail). Video/sample QA passed.
- 29 silence starts at threshold `silencedetect=n=-50dB:d=1.5`; e.g. intentional silent visual hold **276.365–278.534** seconds (2.168s). One 6.78s silence in SHOT 10 approx 1048.139–1054.921sec, which needs an editorial listening review, not an automatically inferred defect.
- Audio QA of first master did **NOT** pass conservative true-peak target -1.5 dBTP because measured -1.17 dBTP. It was below digital clipping, but did not meet the chosen engineering headroom gate.

## Second headroom-corrected review derivative — objective QA PASS
- Added opt-in `audioMasteringTruePeak:-2` pre-AAC true-peak target, leaving default mastering behavior unchanged: `remotion-engine/cpu-worker.mjs`, commit `f76f9820f20214a417692dfd52c8f2fccf869868`.
- New derivative MP4 render ID **`96699a27-7615-4ce1-a092-53cdf1e9d1af`**, MediaOS READY, H.264/AAC, 1920×1080 30fps, **94,183,474 bytes**.
- Playback/download: https://media-os-backend-production.up.railway.app/api/v1/remotion/renders/96699a27-7615-4ce1-a092-53cdf1e9d1af/video
- Actual independent FFmpeg EBU R128 reading of the **final encoded MP4** (not render filter settings): **-16.31 LUFS integrated**, **-1.76 dBTP true peak**, **4.30 LU loudness range**. PASS chosen target roughly -16 LUFS and true peak at/below -1.5 dBTP.
- Actual MP4 box inspection: video `stsz=37703`, `sttsSamples=37703`, `fps=30.000`, video duration **1256.7666667 seconds**. AAC audio `stsz=58932`, `sttsSamples=58932`, audio duration **1256.790 seconds** (23.3ms padding). PASS. The H.264 video stream was copied (`-c:v copy`) without visual rerender.
- Original voice clips were **not regenerated**. This derivative was made from the first already-AAC-mastered review copy, so it has **one additional AAC audio encode generation**. Whether that changes audible quality needs Director listening; a one-pass render from the pristine pre-master source would be preferable for final commercial release if audible artifacts are found.
- Retention protection for this **provisional** QA-passing review MP4 (not a Director LOCK) added to both retention candidate SELECT and UPDATE SQL predicates with matching parameter binding, commit `19fef15dd7ece997e0ba69b6083018f73eb30221`. Confirm production backend deploy SUCCESS before asserting the protection is active.

## Pending Director/editorial gates
- **Director listens** to critical cuts, voice timbre, sibilance and fatigue vs the first master; compare `e03...` to `966...` if useful. 29 detected silences should be reviewed editorially, especially one 6.78s pause in SHOT 10; do not silently delete designed pauses.
- Optional sound-design pass (subtle packet SFX, authentication confirmation, and Dashboard reveal); no new sound track added in this work.
- Final on-platform caption/metadata/rights QC, thumbnails, title, description, chapters, and at least 3 vertical Shorts.
- No YouTube upload, no public publish, and **NO FINAL EP001 DIRECTOR LOCK** has been performed. Exact UUID `96699a27-7615-4ce1-a092-53cdf1e9d1af` is the latest **technical audio QA candidate** only.
