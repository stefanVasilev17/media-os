# EP001 — SHOT 01–09 · Corrected Cumulative Director LOCK (FINAL)

**Director decision:** The Director explicitly approved the repaired cumulative nine-shot MP4 with **"Локваме!!!"** on **2026-10-25**, after independently verified repair of the missing final screens. The approved *episode composite* is **DIRECTOR LOCKED / IMMUTABLE**. This approval is separate from the earlier SHOT09 V6 individual-shot Director LOCK, which remains in force.

## Exact Director-LOCKED cumulative MP4

- **Approved Render ID: `fd1046d0-6b20-4267-8135-8b67add2ca33` ONLY.**
- **Approved playback:** https://media-os-backend-production.up.railway.app/api/v1/remotion/renders/fd1046d0-6b20-4267-8135-8b67add2ca33/video
- Composition `EP001-Voice-CurrentPreview`, output 1920×1080, H.264 video at **30 FPS**, copied original AAC audio.
- Exactly **96,070,787 bytes** at last verified storage/QA. Planned duration 30,923 frames = **17:10.767**, measured video **1030.800 seconds** / **30,924 CFR frames** (one harmless encoder frame), measured original audio **1030.912667 seconds**. Decoder-verified actual frames at 899, 950, 1015, 1028 seconds.
- Actual closing frame at ~1015 sec shows LOGIN APPROVED and AUTHENTICATION STATE; ~1028 sec shows PHONE / CLIENT APPLICATION — STILL WAITING FOR SECURE LOGIN STATE. The Director-approved scene ending is present.
- Validated by FFprobe and actual decoded image frames; this is far stronger than a database READY status alone.

## Approved and protected creative source

- SHOT01–08 prior approval immutable; SHOT09 individual Director LOCK original `533193c8-e94a-42f1-a72e-b837bbbcabe6` stays immutable and separate.
- All four SHOT09 original voice clips stay unchanged; no voice regeneration or retiming.
- No camera, diagram, node text, narration, timing or styling changes are authorized by this LOCK. The approved nine-shot MP4 is the current EP001 cumulative baseline. New SHOT10+ composites must be **new derived files**, never an overwrite of this exact asset.
- The bad cumulative `153714f1-f3bd-461c-9c95-c8cbd0b0eddd` is **NOT approved**. The first failed PTS repair `38430ad9-83df-48ba-8d34-dc1d38e423fc`, second storage-guard failure `1c390c74-1396-48d7-855e-819a1ef1d040` are also **NOT approved masters**.

## Technical root cause and production learning

The old combined MP4 had a video stream of ~738.16 seconds but original audio of ~1030.91 seconds due to video PTS/timebase mismatch in mixed-resolution FFmpeg concat with stream copy. Corrected derivative regenerates only the video presentation timeline at exact 30fps (`setpts=N/(30*TB)` CFR), while copying approved audio. Final fix commit `056216b2ff753ad6245556982698dad19dfb9d85`. Backend volume configuration corrected to reflect the **existing** 5000MB Railway PostgreSQL volume (not an expansion), allowing the correctly formed MP4 to be safely stored. Full analysis in `2026-10-25-ep001-shot01-09-cumulative-timestamp-repair-final-verified.md`.

Every future cumulative render MUST have a post-render probe for actual video/audio duration and framerate, plus visual verification of late frames. See GitHub issue #92 for permanent automated QA.

## Director LOCK storage preservation

Current legacy `RemotionRenderRetentionService` prunes old successful `EP001-Voice-CurrentPreview` aggregates whenever a newer one exists, even if their video is approved. To protect **this exact Director-LOCKED episode master**, GitHub commit **`069e270e47c2273f62aa93e68502c0a2bf10b0fb`** introduces an explicit exclusion for render `fd1046d0-6b20-4267-8135-8b67add2ca33` in both the candidate selection and update guard. This preservation becomes effective after the updated backend is successfully deployed. Do not run any new cumulative render while that deployment remains unverified. Long-term: replace one-off pinning with an episode-level persisted director lock/asset registry, including budget-aware retention. See issue #91.

**Lock semantics:** This record is an official **creative Director LOCK**, not proof of an `episode_cumulative_lock` database row (that native model has not been confirmed to exist). Verify deployment/storage retention separately; never silently equate the two.

**Next permitted work:** SHOT10 planning/implementation derived from current script and existing approved map. The now LOCKED SHOT01–09 composite is source of truth for episode progress.
