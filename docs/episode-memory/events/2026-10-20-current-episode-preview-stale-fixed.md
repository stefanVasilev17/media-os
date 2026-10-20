# EP001 Current Episode Preview — stale-shot correction (2026-10-20)

**Director report:** MediaOS Visual Agent marked SHOT 05 as Director LOCKED but the separate `CURRENT EPISODE PREVIEW` player still displayed the older visual with labels `LIVE EXAMPLE` and the removed micro-disclaimers.

**Root cause:** `VisualQaController.latestEpisodePreview()` queries the latest successful `EP001-Voice-CurrentPreview` composition, an independently materialized MP4, not the locked SHOT05 media. The frontend `updateCumulativePreview()` runs on the interactive shot-production workflow; locking through an external QA/MediaOS API does not refresh the preexisting cumulative video.

**Old episode preview:** `e4c416b6-12c6-45f1-963a-dcd0acfaef4f`, 11,566 frames / 6:25.533 (stale SHOT 05 cut).

**New canonical contiguous current preview:** `b97658ac-473d-4b64-858d-36c164759956`, 12,124 frames / 6:44.133 at 30fps, 1280×720. It was generated from precisely these five current QA-PASS and Director-LOCKED shot renders, preserving their original order, durations and sources:
- SHOT 01 `9cf224c3-a48e-45ff-92bb-f238036a1086` — 1,603 frames
- SHOT 02 `2216f610-77d5-48bc-a05d-fe966874ab58` — 2,714 frames
- SHOT 03 `d23abccb-5450-4158-872e-a388adec60cc` — 1,374 frames
- SHOT 04 `3309d525-8890-4e25-aad3-a3261cc50f92` — 2,601 frames
- SHOT 05 `978127c4-fed2-40a8-ad5d-e7e3920b71cb` — 3,832 frames (the Director-LOCKED 1080p production master)

**MediaOS confirmation:** `visual/state?scriptRevision=3` returned `preview.renderId=b97658ac-473d-4b64-858d-36c164759956` with `ready=true` after rebuild. GitHub QA: https://github.com/stefanVasilev17/media-os/actions/runs/39439963475 .

**Prevent recurrence:** Whenever an external agent locks or changes a shot, it must explicitly rebuild the cumulative episode preview from the latest contiguous QA-approved canonical shot renders, and verify that the backend `visual/state` points at the new current-preview ID. Rendering or locking a standalone shot is not enough. The Visual Agent frontend now also checks for newer preview state on refocus, on visibility changes and periodically, rather than indefinitely reusing stale in-memory state. Existing open mobile browser pages may require a page refresh.

**Safety:** No changes were made to any Director-LOCKED shot, to the green canonical packet, or to voice recordings. The new composition only concatenates preexisting approved MP4s.
