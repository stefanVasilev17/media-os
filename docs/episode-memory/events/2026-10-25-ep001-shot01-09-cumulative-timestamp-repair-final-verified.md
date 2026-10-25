# EP001 — SHOT 01–09 cumulative playback repair — VERIFIED

**Date:** 2026-10-25. Status: **CORRECTED MP4 READY / FRAME-BY-FRAME-END QA PASSED**. This is a technical video assembly fix; **all Director creative LOCKs remain unchanged**. The Director reported "В общото видео нещо не влиза в последните екрани" after SHOT09 V6 had been approved.

## Actual root cause — FFprobe verified, do not rely on MediaOS metadata alone

The former episode cumulative render `153714f1-f3bd-461c-9c95-c8cbd0b0eddd` combined existing 8-shot 1080p aggregate and approved SHOT09 V6 720p source using ffmpeg concat with `-c copy` after temporarily upscaling SHOT09. Although MediaOS claimed 30,923 planned frames, independent FFprobe showed:
- **Video stream duration `738.161578` seconds (~12:18)**, video had 30,923 frames with broken presentation time stamps and effective ~41.9 FPS average.
- **Audio stream duration `1030.912667` seconds (~17:11)**, correct.
- Result: video ran out early while audio continued, making the last screens appear missing. MediaOS `READY` and planned `durationInFrames` alone were insufficient integrity checks.

Independently probed original Director-LOCKED SHOT09 V6 `533193c8-e94a-42f1-a72e-b837bbbcabe6`: video 136.333333 seconds, 4090 frames, exactly 30 fps. **The original SHOT09 was not defective and must remain unmodified.**

## Implemented media-only repair

File: `remotion-engine/cpu-worker.mjs`, final fix commit **`056216b2ff753ad6245556982698dad19dfb9d85`**.

For the deliberately constrained `EP001-Voice-CurrentPreview` `retimeVideoTo30fps=true` repair path:
1. Download exact existing broken nine-shot composite as a source, decode *all* its video frames.
2. Use `ffmpeg -vf 'setpts=N/(30*TB)' -fps_mode:v cfr -r 30 -c:v libx264 -preset veryfast -crf 18 -pix_fmt yuv420p` to reconstruct strictly 30-FPS video PTS and preserve visual sequence.
3. **`-c:a copy`** preserves the original approved audio bitstream (no TTS/voice regeneration).
4. Encode a new *derivative* review MP4, never overwrite/re-render any approved SHOT 01–09 original.

The first implementation failed fast due conflicting `-fps_mode passthrough` with `-r 30`, caught in live logs; corrected to `-fps_mode cfr` and independently locally tested to give 30 frames = exactly 1.000 second.

The next MP4 generation initially received HTTP 507 STORAGE_GUARD; root cause was another configuration mismatch: Railway's actual PostgreSQL volume is **5000 MB**, with measured usage ~1.05 GB, while `StorageHealthService` assumed `MEDIA_OS_PG_VOLUME_MB=1000` (estimated 80% at old setting). Safely set backend service `MEDIA_OS_PG_VOLUME_MB=5000`, exactly the *existing* real Railway volume; no disk expansion, unsafe guard bypass, deletion or quality reduction. MediaOS subsequently reported estimated use **16%** and safely accepted the upload.

## New correct cumulative preview — FULL independent QA PASS

- **New Render ID `fd1046d0-6b20-4267-8135-8b67add2ca33`**, `READY`.
- **Playback:** https://media-os-backend-production.up.railway.app/api/v1/remotion/renders/fd1046d0-6b20-4267-8135-8b67add2ca33/video
- Output: 1920×1080, H.264 30/1 FPS, AAC original copied audio, 96,070,787 bytes.
- Actual FFprobe MP4 video stream: **1030.800000 seconds, 30,924 encoded frames** (one harmless encoder/CFR rounding frame beyond the nominal 30,923; +0.033 seconds); `avg_frame_rate=30/1`.
- Actual FFprobe audio stream: **1030.912667 seconds**; 0.113 second longer than video, within normal AAC tail tolerance.
- Actual decoder extraction of **real MP4 video frames at timestamps 899, 950, 1015 and 1028 seconds succeeded**. JPEG images were decoded and validated with sizes 5,352 / 9,022 / 8,148 / 9,549 bytes respectively. The captured frame at **1015 seconds** clearly depicts `LOGIN APPROVED` and the `AUTHENTICATION STATE` panel; at **1028 seconds** it also depicts `PHONE / CLIENT APPLICATION — STILL WAITING FOR SECURE LOGIN STATE`, so the ending screens **do exist in the fixed combined MP4**.
- **Do not use the former `153714f1-...` cumulative MP4** for viewing. Retention may release its payload when a newer aggregate succeeds.
- Exact approved original SHOT09 V6 remains `READY`, size 12,493,291 bytes; four voice clips original and immutable. Original SHOT01–08 source shots remain Director approved.

## Permanent production learning
- Every cumulative video QA gate MUST inspect **actual FFprobe audio/video stream durations and average FPS**, not just planned render DB metadata.
- Extract/decode frame previews near every late-shot transition, especially the final 10–20 seconds; test all timeline endings and audio/video synchronization. Explicitly fail a cumulative video if actual video duration differs from expected script/voice timeline by >1 video frame plus codec-timing allowance.
- Normalize video timebases/PTS when concatenating different source media streams; a simple `ffmpeg concat -c copy` is not guaranteed to produce a correct mixed-source episode timeline.
- Persist native approval of source shot artifacts independently from disposable cumulative MP4s, and make media retention rules safe for approved composites.
