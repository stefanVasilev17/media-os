# EP001 SHOT 12 — Voice-Synced V3 Director Review — VERIFIED READY

Date: 2026-10-27
Status: DIRECTOR REVIEW DRAFT / MP4 TECHNICAL QA PASSED / NOT DIRECTOR LOCKED

## Director approved V2 visual continuity

Director: "Харесва ми. Приложи и звука."
All four V2 visual layout corrections preserved; V2 scene itself and older SHOT01–11 Director-locked masters remain untouched. Separate V3 composition is a playback speed/timeline retime of V2 to align recorded C01–C03 voices.

- V3 source: `remotion-engine/src/episodes/ep001/live-diagram/Shot12CompleteLoginRecapV3.tsx`
- Composition ID: `EP001-Shot12-CompleteLoginRecapV3`
- Visual duration: 2400 frames = 80 seconds @ 30fps; mapped V2 visual timeline 3150 frames / 105s into the 80s composition, preserving node placement/diagram choreography.
- Comp registration in `remotion-engine/src/Root.tsx` and backend allowlist `RemotionRenderController.java`
- Render provider engine version `AT_REMOTION_c33b922d8197_20261027100314`, source commit `c33b922d819749d96f376f9efb412edd33e720e8`.

## Director selected narrator text and generated voices

Director-selected exact C01–C03 narration is still in `docs/episode-memory/plans/2026-10-27-ep001-shot12-director-selected-recap-DRAFT.md`.
No words edited or regenerated unnecessarily.
- C01 52 words, original Studio clip `f236a048-b1b2-43a6-a6a5-3248eb2010ac`, measured 18.3118 sec.
- C02 56 words, Studio clip `ef99636a-4cbf-4845-8ccc-658f793d9c66`, measured 21.1069 sec.
- C03 84 words, Studio clip `e8446fb7-f108-475e-81b7-10db75eb55fc`, measured 28.2122 sec.
- Total speech = 67.6309 seconds; audio frame starts 27, 700, 1410, respective sequence lengths 585, 660, 880 frames. Actual sound not time-stretched; Remotion V2 animation retimed to 80 seconds.
- Studio `approvedAt` still unset for all three voice drafts. Script-level technical `lockedAt` was set as a prerequisite for generation. **No Director final audio/visual LOCK claimed**.
- Known issue: Studio's `durationSeconds` field returns zero due unrecognized ElevenLabs returned alignment shape; actual MP3 durations were independently verified by reading MPEG audio frames. No need to regenerate the three recorded files merely due Studio's zero.

## New rendered MP4 with voice-over

- Render UUID: `694bfb89-b3c2-41a3-b134-47396cb73a8e`
- Director preview: https://media-os-backend-production.up.railway.app/api/v1/remotion/renders/694bfb89-b3c2-41a3-b134-47396cb73a8e/video
- Actual backend status `READY`, 1280x720 FAST_PREVIEW, 2400 frames, 30fps, duration 80s.
- Video size 4,836,650 bytes, `video/mp4` container.
- Technical QA: HTTP partial range returns 206 and valid `ftyp` MP4 header. Separate full-file Railway QA of 4,836,650-byte download verified `ftyp`, `vide` video track, `soun` audio track, AAC `mp4a` audio sample description, H.264 `avc1` video codec; `verified=true`.
- The recording is technically embedded into final MP4. This does not mean subjective musical/voice quality was approved or that the animation was viewed frame by frame; Director must watch and approve.
- NO edits to SHOT01–11, V1, or V2 source. New work isolated to V3 and registration.

Next: Director listens/watches voice-synced V3, returns desired changes or issues explicit voice and visual LOCK. Any final master 1920x1080 REVIEW render needs separate review/gate.
