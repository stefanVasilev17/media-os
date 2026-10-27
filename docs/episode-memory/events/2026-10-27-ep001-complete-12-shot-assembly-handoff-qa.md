# EP001 — Complete SHOT01–12 cumulative assembly / QA handoff

**Date:** 2026-10-27. **Status:** ALL 12 SHOTs Director-LOCKED; a final continuous EP001 derivative is NOT YET verified/approved. Do not overwrite or modify approved source MP4s.

## Exact canonical sources, order, frame expectations
1. SHOT01–09 corrected cumulative MP4: `fd1046d0-6b20-4267-8135-8b67add2ca33`; actual independent FFprobe **30,924 encoded frames** / 1030.8s, 1920x1080 at 30fps. MediaOS DB metadata says 30,923 (one-frame mismatch), so use **actual** frames for assembly.
2. SHOT10 Session Creation Presentation V8: `7e55c59a-3102-4d4c-b23e-96c68ad1f286`; 2160 frames / 72s at 30fps, 1280x720.
3. SHOT11 Route Decision Presentation V5: `3a09dbd5-7ef8-4c0e-9621-12ca8a4b99a0`; 2160 frames / 72s at 30fps, 1280x720.
4. SHOT12 Complete Login Recap V5: `5d8c7db2-b34e-4781-af1a-2aa236691ea5`; 2400 frames / 80s at 30fps, 1280x720.

**Full episode:** 37,644 frames, **1254.800 seconds / 20:54.8**, native merged profile REVIEW 1920x1080, H264 video and copied original AAC soundtrack. Normalize only the last three already-rendered 720p derivatives to 1080p, not original locked files. No remotion scene or ElevenLabs voice regeneration.

## Actual work / outputs
- First 4-segment raw concatenation: render `fe5ee035-3ede-44f6-9e7f-98317fc0df30`, completed READY 116,426,969 bytes. Independent MP4 atom QA: 37,644 video frames **but 1254.9127s / 29.9973 fps**, vs 1254.800 expected; NOT a final deliverable.
- First 30fps timestamp re-encode: render `73332292-fbc3-40f0-a767-06aa8adfae01`, completed READY 114,131,458 bytes. Independent MP4 atom QA: exactly 30fps, but **37,646** video frames / 1254.8667s; audio duration 1254.8917s (AAC tail). NOT final due two extra video frames.
- Added opt-in `strictFrameCap` on the `retimeVideoTo30fps` branch in `remotion-engine/cpu-worker.mjs` to supply `-frames:v job.durationInFrames`, without changing normal worker behavior; commit `b9edebc26a7b78b2878fbbf948be2bf415eab527`. Updated worker successfully deployed on Railway.
- Strict-frame render `b0ea9583-98f1-4e3d-a541-4a07b854b736` was requested with 37,644 frames, but worker failed before encode because source `fe5ee035...` video URL returned **404**. This intermediary payload was released by automatic retention after a newer successful aggregate. This failure does NOT affect any of the four Director-locked sources.
- Subsequent Railway Function edits to verify the surviving intermediate `73332292...` were blocked by tool safety checks, so no evidence to assert it is currently downloadable. Do not claim the exact-frame final master exists.

## Deterministic next steps
1. Verify source `73332292-fbc3-40f0-a767-06aa8adfae01` remains downloadable (`HEAD /api/v1/remotion/renders/{id}/video`, content-length > 1 MB). If not, recombine the four protected canonical sources from scratch.
2. Create a **new distinct** `EP001-Voice-CurrentPreview` REVIEW render with props `{durationInFrames:37644,retimeVideoTo30fps:true,strictFrameCap:true,segments:[{shotKey:"EP001_FULL_EXACT_FRAME_MASTER",videoUrl:"https://media-os-backend-production.up.railway.app/api/v1/remotion/renders/73332292-fbc3-40f0-a767-06aa8adfae01/video",durationInFrames:37644}]}` only if that source is available. Use the already deployed worker opt-in cap; no source edits required.
3. Verify actual MP4 `stsz`/`stts` video count 37,644, stream FPS 30/1, video duration 1254.800 +/- one frame; audio duration about 1254.89s (original AAC padding). Prefer FFprobe and decode/extract ending frames at 20:40–20:54.
4. Only after QA PASS, provide the new exact-frame MP4 as **Director Review**. Do not auto-LOCK the aggregate; all underlying SHOT01–12 are already Director-LOCKED.
5. Independent outstanding infrastructure task: `RemotionRenderRetentionService.java` needs exact SHOT12 V5 UUID exemption in candidate SELECT and UPDATE. Tool rejected earlier edit; no runtime guard claimed as deployed. Avoid any new successful composition re-render that could displace the original locked MP4.

**Source of truth:** Original Studio approvals and Director LOCK notes for SHOT01–12. Do not include old failure-architecture episode material in current EP001.
