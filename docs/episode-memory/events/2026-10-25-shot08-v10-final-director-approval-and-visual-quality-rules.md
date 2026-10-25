# EP001 — SHOT 08 v10 — FINAL DIRECTOR APPROVAL AND VISUAL QUALITY RULES

**Date:** 2026-10-25
**Project:** Architectural Thinking / MediaOS
**Decision:** `SHOT08_V10_DIRECTOR_CREATIVE_LOCKED`
**Status distinction:** Director's creative approval is final for the exact reviewed render listed below. MediaOS database-native `visual_shot_lock` and formal `visual_shot_qa` PASS are separate operational states that must be checked and reported honestly. This document is NOT evidence by itself of a database-native lock or cumulative episode build.

## Explicit Director sign-off

After watching the corrected v10 MP4, the Director wrote (in Bulgarian):

> "Локваме! Много ми хареса. Запомни корекциите и продължавай в същия дух!"

That is explicit creative approval. Do not change the approved SHOT 08 video, timings, animation, look, wording or voice without an explicit Director unlock or replacement authorization.

## Exact approved review artifact

- **Composition:** `EP001-Shot08-DirectorVoiceV10`.
- **Director-reviewed MP4 render ID:** `9c9e98ca-4ebd-4da9-b7e2-e328a44a9109`.
- **Video:** https://media-os-backend-production.up.railway.app/api/v1/remotion/renders/9c9e98ca-4ebd-4da9-b7e2-e328a44a9109/video
- **Format:** MP4, `FAST_PREVIEW`, 1280×720, 30 fps, 4690 frames = 156.333 s, 11,133,500 bytes, generated from deployed commit `14fb626f0385594be1165a3b905c7b5c00883e55`.
- **Render worker:** completion confirmed in Railway at `2026-10-25T09:06:21.303Z`.
- **Voice:** exact **four existing Director-approved ElevenLabs clips** `SHOT 08-C01`, `C02`, `C03`, `C04`; generation revision 1; durations 31.621 s, 32.42 s, 55.701 s, 31.7 s; starts at frames 18, 982, 1972, 3659. No voice regeneration, re-recording, rewriting, or replacement.
- **Scene sources:** `remotion-engine/src/episodes/ep001/live-diagram/UserDatabaseV8Premium.tsx`, `remotion-engine/src/episodes/ep001/live-diagram/Shot08ApprovedVoiceV10.tsx`.
- **Final fixes commits:** `2250b024050198e1e7024a51f685afe796f3db90` (email lookup table) and `14fb626f0385594be1165a3b905c7b5c00883e55` (credential typography/labels).
- Historical pre-fix v10 video `7f6a7858-ba77-4e21-aea7-d7a678886c97` is **NOT** the approved final render; never substitute or relock it.

## Quality rules extracted from Director's correction cycle — REUSE IN SHOT 09+

1. **Typography must fit the actual visual container at every animated state.** Measure long values against the smallest active box at the final output resolution; never allow text to spill into neighboring cells or overlapping panel content.
2. **Column geometry and row geometry come first.** Explicit consistent column centers, aligned header/value baselines, sufficient gutters between the last table row and downstream detail strips. Highlight/scan overlays must share the updated row coordinates, never legacy positions.
3. **Center chip/card labels within their bounding boxes** using actual centers (`textAnchor=middle` / equivalent) when the component calls for centered layout. Avoid off-center optical balance after adding icons, pills, borders or glowing states.
4. **Use viewer-comprehensible labels aligned with the approved narration.** Do not introduce unexplained implementation jargon in onscreen labels. In this shot, remove `KDF` and `Argon2id` from on-screen visual copy; convey the spoken concept with plain language such as `ONE-WAY HASH`, `PASSWORD HASHING`, `ONE-WAY PROCESS`, `PROTECTED HASH`, `SALT`, `DIGEST` where appropriate. This does **not** authorize changes to narration or factual claims.
5. **Never fix a label by making it microscopic.** If a term will not fit, choose a tighter truthful label, widen the component, or redesign its geometry. Keep readable visual hierarchy for a 1280×720 preview and later 1920×1080 release.
6. **QA must target all phases of an animation**, not just its opening frame: inactive/static, transitions, highlighted row, selected account, handoff, camera focus and the ending shot. Look for collisions, clipped text, stray temporary elements, unwanted vocabulary and framing.
7. **Preserve audio and locked visual work.** Corrections were layout/onscreen-text-only; the four approved original voices were untouched. All previously Director-LOCKED SHOT 01–07 outputs must remain exactly as approved.
8. **Production responsibility:** Assistant/agents implement through GitHub and Railway and present a new playable MP4 for Director review; Director decides creative LOCK. Do not merely give editing instructions to the Director where automation can safely execute; do not claim QA/LOCK or ready MP4 without checking real state.

## Scope and follow-on

- **Director-approved baseline**: the corrected v10 MP4 above, no further speculative edits.
- **SHOT 08 remains the current exact artifact.** Native MediaOS QA/LOCK if applicable must reference this exact reviewed artifact or explicitly distinguish an unreviewed higher-resolution derivative. Native QA at the time of this approval was designed around a 1920×1080 frame and only mapped SHOT 01–07; do not claim an identical 720p SHOT 08 has passed that gate without evidence and a separately verified native update.
- Any later combined EP001 video must preserve the original locked segments SHOT 01–07 and include **this exact Director-approved SHOT 08**, rather than quietly replacing it with an older v10.
