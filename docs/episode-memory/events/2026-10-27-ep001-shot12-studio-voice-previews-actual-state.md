# EP001 SHOT 12 — live production state after Director go-ahead (2026-10-27)

**Creative/editorial status:** Director selected the exact C01–C03 narration and said to begin production. No Director approval of the generated voice or final video yet.

## Existing Studio record — DO NOT DUPLICATE
An earlier production Studio SHOT12 already existed. Our V81 migration `V81__ep001_shot12_successful_login_recap_studio_draft.sql` was intentionally non-destructive and its insert for shot_number=12 was a no-op due to existing row. Do **not** use the migration UUIDs for the real shot.
- Studio shot id: `55df6c1a-605c-40ad-8cf3-3d4278ba7878`; shot number 12; title "The Final Reveal / Successful Login Recap"; legacy source null; independent draft.
- C01: `f236a048-b1b2-43a6-a6a5-3248eb2010ac`
- C02: `ef99636a-4cbf-4845-8ccc-658f793d9c66`
- C03: `e8446fb7-f108-475e-81b7-10db75eb55fc`

All three narration texts have been overwritten **only because their existing studio_clip drafts were unlocked and unapproved**, and then verified to exactly equal the Director's chosen 52/56/84 word C01–C03 texts in `docs/episode-memory/plans/2026-10-27-ep001-shot12-director-selected-recap-DRAFT.md`. Do not alter the Director wording. Voice direction drafted but generative TTS endpoint has a hardcoded delivery direction, so compare actual voice quality.

## Voice state observed through LIVE Studio API
- C01 locked_at populated, generated=true, generation_revision=1, approved=false.
- C01 source audio GET/HEAD returns **HTTP 200, audio/mpeg, Content-Length 293032 bytes**.
- C01 Studio durationSeconds is **0** even though generated audio exists. This is a serious timing/alignment QA issue, not evidence of a silent or zero-byte MP3. `ShotStudioController.voiceDuration()` requires `alignment.character_end_times` or `normalized_alignment.character_end_times`, neither is recognized from the current generated_alignment JSON. Inspect root keys and MP3 duration or use forced alignment, validate before approval.
- C02 and C03 narration updated successfully, currently locked=false, generated=false, approved=false.
- C01 playback URL: https://media-os-backend-production.up.railway.app/api/v1/studio/clips/f236a048-b1b2-43a6-a6a5-3248eb2010ac/audio

**Caution:** An early one-shot TTS runner incorrectly assumed any generated clip must have a positive Studio alignmentDuration and exited after C01 despite valid audio storage. Do not blindly regenerate C01 and spend another TTS credit. Future generation must keep individual clip idempotency and validate the audio independently from timestamp alignment.

## Silent Remotion V1
- Source: `remotion-engine/src/episodes/ep001/live-diagram/Shot12CompleteLoginRecapV1.tsx`.
- Root registration and backend allowlist now both contain composition `EP001-Shot12-CompleteLoginRecapV1`.
- Renderer registration commit `834520fdf04c1c05237b56db8b1a7f87b0509b7d` successfully deployed on Railway backend.
- Silent render UUID `4641805d-22b1-4d95-889c-115b2969e05b`, 3150 frames at 30fps, 1280×720 FAST_PREVIEW, 105 sec; QUEUED then RENDERING at 9% when checked; **not yet verified READY**.
- Conditional URL after READY: https://media-os-backend-production.up.railway.app/api/v1/remotion/renders/4641805d-22b1-4d95-889c-115b2969e05b/video
- Only call it a playable video after live READY status / MP4 header and picture-frame QA.

## Immutable assets
SHOT01–11 Director LOCKED masters and their voice files untouched. Old EP001 16-shot/failure plan remains superseded by Oct 21 successful-login-only editorial lock. SHOT12 visual preview not Director-approved.

## Next production actions
1. Inspect C01 audio quality and identify/fix zero-duration alignment without costly redundant TTS.
2. Generate C02 and C03 draft audio **once each** using existing Studio clip IDs, validating nonempty MP3; keep unapproved for Director audition.
3. Check silent render status, visual continuity, and rendering QA. Do not report READY without verification.
4. Map measured durations/word alignment onto visual choreography, render a new *voice-synced* SHOT12 preview for Director review.
5. Only Director may issue final audio/video LOCK.
