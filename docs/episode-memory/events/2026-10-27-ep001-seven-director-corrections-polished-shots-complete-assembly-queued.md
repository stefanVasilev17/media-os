# EP001 — Seven Director corrections — source renders complete

Date: 2026-10-27. The Director requested seven visual/pacing/continuity corrections to the 12-SHOT EP001 Login happy-path video.

**Status: All three derived corrected source videos READY and 12/12 final composition source HEAD+metadata integrity checks PASSED. Full episode aggregate QUEUED; not final MASTER or Director LOCK.**

## Exact corrected derived scene MP4 renders, REVIEW 1920x1080 at 30fps
- SHOT04 Network/Transit: `6e62f942-1f62-4b63-8a5e-ceace94d0299`, 2601 frames, 8,047,262 bytes. Remotion `EP001-Shot04-FinalPolish`. Rebuilt as native diagram with original approved source audio rather than whole-video browser decode, DNS label high-contrast and readable.
- SHOT06 Load Balancer: `2206a5f2-d734-4be7-8b1f-9c834f116c5f`, 5137 frames, 15,309,819 bytes. `EP001-Shot06-FinalPolish`. LOGIN REQUEST x center fixed to balancer at 197 world-coordinate; Hash Key centered vertically in navigation panel.
- SHOT07 Auth Service: `586ab306-e7f7-4650-8a40-874d7ed94315`, 4882 frames, 12,389,179 bytes. `EP001-Shot07-FinalPolish`. Smaller email, battery inside phone frame, USER LOOKUP CREATED badge centered, Auth-to-Database moving green point continuous without teleport.
- All derived MP4s reuse the original Director-approved source MP4 audio, with no new TTS or narration edits. Original LOCKED MP4s remain unchanged.

## Full EP001 intended shot manifest
SHOT01 `6565c46c-4da6-40cb-a2b6-d53b7d747847` 1603 frames;
SHOT02 `2216f610-77d5-48bc-a05d-fe966874ab58` 2714;
SHOT03 `d23abccb-5450-4158-872e-a388adec60cc` 1374;
SHOT04 correction 2601;
SHOT05 `978127c4-fed2-40a8-ad5d-e7e3920b71cb` 3832;
SHOT06 correction 5137;
SHOT07 correction 4882;
SHOT08 `9c9e98ca-4ebd-4da9-b7e2-e328a44a9109` 4690;
SHOT09 `533193c8-e94a-42f1-a72e-b837bbbcabe6` 4090;
SHOT10 `7e55c59a-3102-4d4c-b23e-96c68ad1f286` 2160;
SHOT11 `3a09dbd5-7ef8-4c0e-9621-12ca8a4b99a0` 2160;
SHOT12 `5d8c7db2-b34e-4781-af1a-2aa236691ea5` 2400.

Nominal total original scene frames 37,643; 60 additional frozen visual frames with silent audio after SHOT04 and before SHOT05 API Gateway => **37,703 frames = 1256.766667 seconds** (approximately 20:56.77), expected CFR 30fps / 1920x1080.

## Cloud render pipeline as actually queued
- First uncorrected stitched historical version: `8e4e9da0-f114-4a34-a491-cb9c3ca99c20` is previous 20:54.8 min, NOT new final polish.
- New corrected full 12-shot raw aggregate queued `28fdca36-9a0b-4c8f-a166-9a56b7780a4b`, composition `EP001-Voice-CurrentPreview` REVIEW, 37703 frames, 1920x1080.
- Source validation confirmed all twelve MP4s READY, exact per-source duration/fps and HTTP HEAD success.
- `cpu-worker.mjs` retains exact Director +2sec `holdAfterFrames:60` between shot04 and shot05, and `retimeVideoTo30fps:true, strictFrameCap:true` for a second separate CFR-normalized derivative render.
- Railway helper function `shot12-director-voice-once` actively orchestrates source checks, aggregate render, exact CFR repair and MP4 atom QA; backend/provider active worker version includes `3a69809c1e7e`. Do not present the first aggregate as the final YouTube deliverable until independently verified.
- A duplicate noncanonical SHOT06 polish render `e5362a80-abe6-4401-b580-8f1bbfc6d2cb` was unfortunately queued earlier; **do not substitute for the already READY approved derived SHOT06**. Duplicate may consume worker time ahead of new assembly; do not destabilize current renderer to cancel it.
- Remotion worker concurrency held at 1 to stabilize 1080p; originals remain untouched.
- **No new full episode polished MP4 declared ready as of this checkpoint.** Final preview should be linked only after independently verifying MP4 `stsz` 37703 samples, exact 30 fps video timeline 1256.766667 seconds and approximately matching AAC audio duration. Director still to approve final assembled edit.
