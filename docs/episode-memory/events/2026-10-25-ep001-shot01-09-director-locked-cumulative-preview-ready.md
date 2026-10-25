# EP001 — SHOT 01–09 cumulative Director preview — verified READY

**Date:** 2026-10-25. **Director source approvals:** SHOT01–08 previously LOCKED; **SHOT09 V6 explicitly Director LOCKED** on 2026-10-25. The 01–09 episode review MP4 has completed successfully. This is an *episode assembly derivative*, not a replacement for any separately approved shot master.

## New cumulative render — ready
- **Render ID:** `153714f1-f3bd-461c-9c95-c8cbd0b0eddd`
- **Playback:** https://media-os-backend-production.up.railway.app/api/v1/remotion/renders/153714f1-f3bd-461c-9c95-c8cbd0b0eddd/video
- **Engine composition:** `EP001-Voice-CurrentPreview`; profile **REVIEW**, output 1920×1080 at 30 fps
- **Frames:** 30,923 = 26,833 existing frames + 4,090 SHOT09 frames, duration **1,030.767 seconds = 17:10.767**
- **File bytes:** 97,816,403; status **READY**, 100%.
- **Media integrity check:** GET/video HTTP 206, Content-Type `video/mp4`, first MP4 box `ftyp`, verified range `bytes 0-127/97816403`. Production worker logged `Completed cumulative preview 153714f1-f3bd-461c-9c95-c8cbd0b0eddd: 97816403 bytes`. This is a technical container check, not independent full frame-by-frame visual QA.
- **Assembly audit:** MediaOS accepted only the correct source video metadata, source frame lengths, and prior native locks (SHOT01–07). Original SHOT09 V6 render remains `READY` and byte-identical metadata.

## Exact two sequential source artifacts
1. SHOT01–08 previously combined director-approved preview, render `8bb127a5-3a9e-4bc1-aa5e-4a224c80193b`, original 1920×1080, **26,833 frames**.
2. SHOT09 V6 exact Director LOCK original, render `533193c8-e94a-42f1-a72e-b837bbbcabe6`, original 1280×720, **4,090 frames**. Four original approved voice clips C01–C04 unchanged. The User Database main node shows matched record **0042 / alex@example.com / ACTIVE** instead of scanner.

The existing Remotion CPU worker `renderCumulativePreview()` uses `ffmpeg` lossless stream-copy concat on a list of source files and a **temporary 1920×1080 video re-encode of only the 720p ninth segment**; it copies original audio during scaling and does not modify the source shot artifact. The final 1920×1080 deliverable is persisted in MediaOS DB.

## IMPORTANT: automatic retention and historic eight-shot aggregate
MediaOS's pre-existing `RemotionRenderRetentionService` intentionally treats older renders with composition `EP001-Voice-CurrentPreview` as superseded when a newer successful aggregate exists. The **old eight-shot combined render's video payload was automatically pruned after this nine-shot render completed**: historical render metadata remains `READY`, but `sizeBytes=null` and its `/video` endpoint now returns **404**. This is documented accurately, **not** represented as the earlier eight-shot aggregate still downloadable. The eight component shot approval/master source renditions were not re-rendered or rewritten by this assembly, and the old eight-shot aggregate was successfully used as an input while accessible. **Do not link the old eight-shot aggregate as a playable MP4.**

This retention behavior must be addressed before treating intermediate episode composites as permanent source archives; maintain the approved original constituent shot master IDs and add a positive archival policy for Director-approved aggregates if they are intended to remain retrievable. The newest nine-shot composite is presently reachable and verified.

## Lock semantics
- SHOT09 V6 **Director creative LOCK is confirmed and recorded** in `2026-10-25-shot09-v6-final-director-lock.md`. Do not change V6 without explicit Director request.
- **Do not claim SHOT09 has a native DB `visual_shot_lock` until its row is checked.** Current QA path still expects 1080p and known compositions; this 720p approved original should be preserved, not substituted.
- SHOT01–07 native LOCK + QA PASS verified before assembly, and SHOT08 separate original creative LOCK remains source of truth.
- Future agents should use this nine-shot aggregate as the current *playable episode review baseline* and preserve original Director-approved shot renders.
