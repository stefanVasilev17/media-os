# EP001 — SHOT 01–08 — Verified cumulative Director preview (2026-10-25)

**Status:** New eight-shot combined MP4 **READY**, 1920×1080 REVIEW output, 30fps, 26,833 frames (14:54.433), 79,819,964 bytes. **SHOT09 remains separate and NOT LOCKED.**

## Verified combined artifact
- Render ID: `8bb127a5-3a9e-4bc1-aa5e-4a224c80193b`.
- Video: https://media-os-backend-production.up.railway.app/api/v1/remotion/renders/8bb127a5-3a9e-4bc1-aa5e-4a224c80193b/video
- Native MediaOS render status: READY (100%), final artifact persisted `2026-10-25T09:32:25.372Z`.
- Post-render check returned HTTP **206 Partial Content**; Content-Type **video/mp4**; first 128 bytes include valid `ftyp` signature. Exact output dimensions and frame duration confirmed using production JSON.
- Source engine: `AT_REMOTION_5de272e53832_20261025093006`.
- Assembly chain based on original native locked master renders SHOT01–07 with exact IDs below, plus Director-creative-locked SHOT08 exact MP4. No audio regeneration or scene edits.

## Inputs — in required contiguous order

| Segment | Original render ID | Frames |
| --- | --- | ---: |
| SHOT 01 | `9cf224c3-a48e-45ff-92bb-f238036a1086` | 1603 |
| SHOT 02 | `2216f610-77d5-48bc-a05d-fe966874ab58` | 2714 |
| SHOT 03 | `d23abccb-5450-4158-872e-a388adec60cc` | 1374 |
| SHOT 04 | `3309d525-8890-4e25-aad3-a3261cc50f92` | 2601 |
| SHOT 05 | `978127c4-fed2-40a8-ad5d-e7e3920b71cb` | 3832 |
| SHOT 06 | `86d0edad-6efd-46c7-b041-627f3ac78333` | 5137 |
| SHOT 07 | `dc31f24e-ea31-462a-8398-457f780e7f6a` | 4882 |
| SHOT 08 | `9c9e98ca-4ebd-4da9-b7e2-e328a44a9109` | 4690 |
| TOTAL | | **26833** |

SHOT01–07 remained **native LOCKED and QA PASS**, verified in separate post-render audit. SHOT08 remains creative-Director-LOCKED by explicit review, while its DB-native lock is tracked separately in GitHub issue #90.

## Technical assembly detail
Earlier cumulative preview `1fcb24e2-99bc-4e97-85f1-cbafcfc4e94c` contained exactly SHOT01–07 and remains historically intact. When appending approved SHOT08 (original 1280×720) to locked source masters (1920×1080), the CPU worker created a **temporary 1920×1080 visual-normalized copy of only the SHOT08 segment**, then concatenated with seven original lock-approved source videos; no previous master altered. This is delivery-format normalization, not a replacement of the approved SHOT08 review file. Worker change `93da608ac25430fa43f388bd76b58b937524d560` fixed the temporary segment lookup and handled normalized segment logic introduced in `22d2c3ad5ba5970decdfc4188660debc7f2e833a`.

## Next scene

SHOT09 is the new **successful-login Credential Verification** (NOT the obsolete historical slow database/failure version). Source scene `remotion-engine/src/episodes/ep001/live-diagram/Shot09DirectorVoiceV1.tsx`, registered with composition `EP001-Shot09-DirectorVoiceV1`. Four preexisting approved ElevenLabs clips C01–C04 are retained. Separate V1 draft render ID `9427cbd7-7071-4a4c-84a9-f8e94f1aab5e` was QUEUED on 2026-10-25T09:32:03.808Z and was RENDERING at last check. Never append SHOT09 before Director review and explicit LOCK.
