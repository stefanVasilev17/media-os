# EP003 — Corrected 10-SHOT full-film WIP Executor handoff (2026-11-16)

## Director request

The Director wants the latest Owner B / Replica B line alignment and INDEPENDENT PRIMARY OWNERS heading revisions **inside one full continuous episode video in MediaOS**, not three isolated SHOT players. The new versions are SHOT08 V4, SHOT09 V3, SHOT10 V2. Do not assert a finished full video until there is a real stored MP4 and all decoded seams pass. No Director LOCK for any of these versions has been granted.

## Verified existing assets

- Director-LOCKED official full 9-SHOT master: render `f2d433f5-3d3e-481e-ab2a-e843ab31e4ef`, 31,473 frames / 17:29.10, official route `#/ep003/full`.
- Immutable official sequence JSON: `remotion-engine/ep003-director-locked-visual-sequence.json` (nine shots, including original SHOT08 V3 and SHOT09 V2). Never modify to include review candidates.
- Original SHOT01–07 exact IDs/SHA/fps/voices are preserved from the official manifest.
- SHOT08 V4 **SAVED / QA PASS**: Remotion source pin `143975e3d6c0edf7308f2f8727c65596f5275834`; Railway deployment `f90767e5-3ecb-400d-8cfa-fee854b049c8`. Render ID `07207345-1350-4e82-aea2-3c369160f653`, MP4 SHA256 `88505c6482bfe929a42ca4c8313a22e8b7ed072563958990e9d5725fbf28895b`, 5372 frames, actual SHOT07→08 seam 43.647755 dB, early movement 23/23 PASS, original Slow Natural take. `EP003_SHOT08_V4_REAL_MP4_SAVED` confirmed at 13:13:12Z.
- SHOT09 V3 **SAVED / QA PASS**: Source pin `599d23563c9ca9dc7a4a1b196c05e01425435440`, real MP4 render `53ac60b4-346e-400b-8dec-7932ef2de94d`, SHA256 `be4b6cd623ab01ef199e4fba312ced36d26cc6edf21aab62c17f2ebadb3a00cf`, 3145 frames, encoded SHOT08 V4→09 V3 PSNR 44.36558 dB, 23/23 early movement PASS, original Slow Natural take; recorded at 13:27:16Z.
- SHOT10 V2 **BUILDING** on Railway deployment `12bc665e-7aa3-4b51-beba-7fd64887f835` as of 13:27:50Z. Exact source pin `b73e566f44823d045455b6a30b2dd6f156333279`. It strictly requires actual SHOT09 V3 MP4 ID and SHA256. Worker script `remotion-engine/ep003-shot10-measurement-v2-render-once.mjs`. Fixed previous bad hardcoded SHOT09 V2 UUID and stale frame hash. Uses original selected Slow Natural Take, 25 actual cues, no paid TTS.

## New full WIP implementation (not final render)

- `cumulative-engine/ep003-assemble-corrected-ten-shot-wip.mjs`: clones the proven real decoded-seam master assembler, validates the official nine-shot LOCK manifest, preserves original SHOT01–07, appends EXACT SHOT08 V4, SHOT09 V3, SHOT10 V2 source render IDs and SHA256 from explicit env vars, 35,489 frames / 19:42.9667, 1920×1080@30fps H264/AAC. Stream-copy only, no audio regeneration/reencoding, verify all 9/9 decoded seams, each PSNR>=27 dB and master/source frame identity >=50dB. Writes distinct WIP render key `EP003_CUMULATIVE_WIP_CORRECTED_SHOTS_01_TO_10`, composition `EP003-CUMULATIVE-WIP-CORRECTED-TEN-SHOT`, engine `EP003_WIP_OWNER_B_V2`, `directorLocked=false`, `lockedPrefixShotCount=7`, `verified=true` only after QA.
- `cumulative-engine/ep003-assemble-corrected-ten-shot-wip.test.mjs` and `Dockerfile.ep003-corrected-ten-shot-wip-once`. Isolated test has NOT run yet in Railway.
- Protected backend endpoint `/api/v1/remotion/renders/ep003/cumulative/wip-corrected-ten/latest-successful` accepts only exact 10-SHOT verified saved MP4 with 9 checked joins, no fallback.
- Frontend `Ep003CorrectedTenShotFullWip.tsx`, direct route `https://media-os-backend-production.up.railway.app/#/ep003/corrected/full`. Also embedded in imported EP003 workspace above official locked master. No fake video if renderer not done.
- Frontend V2 test added to `Ep003OwnerBDirectorReview.test.mjs`.
- Backend prior deployment at `6cbef6b5649a9d898f8663363f8dc1371b83b4c9` SUCCESS; newer branch `a288d989a93240d1bdf1e9553cd044cdf2c04200` includes the Episode Package page integration and stricter test and was submitted to Railway for deployment. Check deployment result. No app UI manual playback verification yet.

## Next steps to physically create full video

1. DONE: SHOT08 V4 saved and actual video hash confirmed above.
2. STARTED: SHOT09 V3 worker at Railway deployment `ba52125e-f88c-4f7d-aeff-7f291ae613d3` (source SHA `599d23563c9ca9dc7a4a1b196c05e01425435440`) passed source/voice/still preflight and reached render progress 20% at 13:18Z. Railway project `a2b47ba1-385e-4410-93ee-b2198492b724`, production environment `ffce6002-aa51-4a11-a23f-73c9a05d3cb1`, at 50-service cap. Reuse **unused existing service** `0c87b115-390d-49f2-b048-73e28917f8b0` (`ep003-shot09-nine-shot-director-wip-once`, no historic deployment), already configured Dockerfile `Dockerfile.ep003-shot09-failover-v3-once` and `EP003_SHOT09_V3_DIRECTOR_RENDER_APPROVED=true`. Existing `DATABASE_URL` is set. Set **verified** `EP003_SHOT08_V4_RENDER_ID` + `EP003_SHOT08_V4_SHA256` with skipDeploys=true; connect service source `stefanVasilev17/media-os` at exact commit `599d23563c9ca9dc7a4a1b196c05e01425435440`, trigger build+run once. Check original voice/cue, P0 PSNR >=27, movement >=18/23, H264/AAC save and capture `EP003_SHOT09_V3_REAL_MP4_SAVED` render ID and SHA.
3. Reconfigure same service Dockerfile to `Dockerfile.ep003-shot10-measurement-v2-once`, update `EP003_SHOT09_V3_RENDER_ID` + `EP003_SHOT09_V3_SHA256`, `EP003_SHOT10_V2_DIRECTOR_RENDER_APPROVED=true`, then connect exact commit `b73e566f44823d045455b6a30b2dd6f156333279`. Check `EP003_SHOT10_V2_REAL_MP4_SAVED`, original voice/cues and P0 QA.
4. Reconfigure same service Dockerfile to `Dockerfile.ep003-corrected-ten-shot-wip-once`, set `EP003_CORRECTED_TEN_SHOT_WIP_ASSEMBLY_APPROVED=true` plus `EP003_SHOT08_V4_RENDER_ID`, `EP003_SHOT08_V4_SHA256`, `EP003_SHOT09_V3_RENDER_ID`, `EP003_SHOT09_V3_SHA256`, `EP003_SHOT10_V2_RENDER_ID`, `EP003_SHOT10_V2_SHA256`. Pin service to GitHub commit containing WIP worker and tests (>= `64c4a0e24831f0187673930d9872ca9cf82e58bb`). Run and verify `EP003_CUMULATIVE_DIRECTOR_FULL_VIDEO_SAVED` and 9/9 actual video seam QA. Then Director watches one full 19:42.97 MP4 at the new MediaOS link.
5. Preserve all previous Director LOCKs and source MP4s. Legacy SHOT03–07 replica Bezier line consistency remains separate and has not been visually corrected in the official sources.

**No successful SHOT10 V2 / full 10-shot MP4 was observed when this document was drafted.**
