# EP001 — SHOT 01–07 Combined Preview — DIRECTOR LOCKED — 2026-10-24

## Verified output

- **Current cumulative episode preview render ID:** `1fcb24e2-99bc-4e97-85f1-cbafcfc4e94c`
- **Playable URL:** https://media-os-backend-production.up.railway.app/api/v1/remotion/renders/1fcb24e2-99bc-4e97-85f1-cbafcfc4e94c/video
- Composition: `EP001-Voice-CurrentPreview`, profile: `FAST_PREVIEW`.
- Status: `READY`, 1280×720, 30 FPS, 22,143 frames, 738.1 seconds (12 min 18.1 sec), 65,081,492 bytes.
- Railway render worker completion: 2026-10-24T17:17:58Z; independent MediaOS GET confirmed `READY`, current `/api/v1/visual/state?scriptRevision=3` preview ID exactly matches.
- Independent HTTP Range delivery check returned `206`, `content-type: video/mp4`, `content-range: bytes 0-127/65081492`, and a valid `ftyp` MP4 header.
- The earlier five-scene cumulative preview `b97658ac-473d-4b64-858d-36c164759956` was preserved, not overwritten.

## Exact ordered source scenes

| Shot | Native render ID | Frames | Production state |
| --- | --- | ---: | --- |
| SHOT 01 | `9cf224c3-a48e-45ff-92bb-f238036a1086` | 1603 | Director/native LOCKED; QA PASS |
| SHOT 02 | `2216f610-77d5-48bc-a05d-fe966874ab58` | 2714 | Director/native LOCKED; QA PASS |
| SHOT 03 | `d23abccb-5450-4158-872e-a388adec60cc` | 1374 | Director/native LOCKED; QA PASS |
| SHOT 04 | `3309d525-8890-4e25-aad3-a3261cc50f92` | 2601 | Director/native LOCKED; QA PASS |
| SHOT 05 | `978127c4-fed2-40a8-ad5d-e7e3920b71cb` | 3832 | Director/native LOCKED; QA PASS |
| SHOT 06 | `86d0edad-6efd-46c7-b041-627f3ac78333` | 5137 | v5 Director/native LOCKED; QA PASS; Director approved the 01–07 composite containing this candidate |
| SHOT 07 | `dc31f24e-ea31-462a-8398-457f780e7f6a` | 4882 | v10 Director/native LOCKED; QA PASS |

## Director approval, reproducibility and safety

- SHOT07 v10 is the exact approved iPhone-and-database-scan master (original five C01–C05 voices preserved). Its creative and native locks were explicitly confirmed.
- SHOT06 uses previously Director-approved v5 timing with map hold through frame 225 (7.5 seconds), transition through frame 285, and seven original C01–C07 voice clips. The Director explicitly approved the newly assembled 01–07 composite including the fresh 1080p SHOT06 render on 2026-10-24, resolving the pending visual-approval gate. Native MediaOS SHOT06 v5 LOCK and QA PASS were verified against the exact render ID `86d0edad-6efd-46c7-b041-627f3ac78333`. Never imply its MP4 bytes are identical to the earlier separately reviewed SHOT06 v5 source file; approval now covers the candidate actually present in the 01–07 composite.
- The full 01–07 preview was explicitly **Director LOCKED** after the Director reviewed it and stated `Супер е !!! Локваме до тук!`. The seven-shot 1280×720 preview is the immutable approved cut; a separately exported 1080p publication master has not yet been prepared or approved.
- No existing SHOT01–05 or SHOT07 locked master was modified. Native locks for SHOT01–05 and SHOT07 remained intact. No original voice clip was replaced.

## Final Director approval and native lock verification

- **Director approval:** `Супер е !!! Локваме до тук!` (2026-10-24), referring to the fully combined, already reviewed SHOT 01–07 video.
- **Locked cumulative Director review artifact:** `1fcb24e2-99bc-4e97-85f1-cbafcfc4e94c`, 22,143 frames, 738.1 seconds, 1280×720 FAST_PREVIEW, size 65,081,492 bytes. Its identity and current MediaOS pointer remained unchanged throughout the native lock operation.
- **Previously pending SHOT06 native lock resolved:** exact v5 1080p render `86d0edad-6efd-46c7-b041-627f3ac78333` activated as the official SHOT06 render and locked through MediaOS `POST /api/v1/visual/lock`. Production GET `visual/state?scriptRevision=3` verified SHOT01–07 *all seven* locked with QA `PASS`, with SHOT06 and SHOT07 IDs matching this table. The previous SHOT06 720p candidate `de3532d5-d76c-4dbf-a08a-9ea5fa7e972a` must never replace the approved v5.
- **Production governance:** treat SHOT01–07 as an immutable Director-approved segment group, including all original voices, transitions, visual timings and frame sequence. Do not silently recreate, retime, alter voice, swap shots, or replace the locked cumulative preview. Future expansion starts with SHOT08 and must preserve the approved first seven shots. Any new publication-quality 1080p composition is a distinct export and must pass independent QA; it does not retroactively change this locked Director review artifact.
