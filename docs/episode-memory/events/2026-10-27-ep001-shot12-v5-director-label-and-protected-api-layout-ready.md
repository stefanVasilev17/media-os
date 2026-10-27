# EP001 — SHOT 12 V5 Director correction render verified

Date 2026-10-27.
Status: **MP4 TECHNICAL READY — Director review required — NOT LOCKED**.

## Director requested changes
Based on user-uploaded image IMG_4894.jpeg:
- "credentials proof" / `CREDENTIALS VERIFIED` text still extends outside pill bounds. Reduce size and enforce pill containment.
- `Protected API` plus icon too large; title/caption positioned too low. Reduce icon and center both text lines inside card.

## Actual source changes
- New isolated Remotion composition: `remotion-engine/src/episodes/ep001/live-diagram/Shot12CompleteLoginRecapV5.tsx`, commit `d1f5ceb08e747ce8d2cf91c94dc147b2c3e8905b`. All previous V1–V4 code/assets retained.
- The `CREDENTIALS VERIFIED` 234px pill now uses fontSize 15px with explicit SVG `textLength=192` and `lengthAdjust=spacingAndGlyphs`, x-center 1435. Text thus stays inside pill with 21px left/right inset.
- `Protected API` is x=122, y=768, width=280, height=127; it remains centered below the Phone. Its plus icon shrunk from 44×44 to 30×30, centered at x=262 and y=796. Title baseline moved to node y+79, caption to node y+105, both horizontally centered. Tiny activity-status dot radius 3.1.
- Other nodes, paths, voice clips and V4 smootherstep animation timings unchanged.
- `Root.tsx` composition registration commit `8aee2b72fc8eb37160557bcc653ccb6904f14f40`; backend registry commit `df751fb1a80ef04500825be7d48f018d0a7c8d97`.

## Render and verification
- Composition `EP001-Shot12-CompleteLoginRecapV5`, backend engine `AT_REMOTION_df751fb1a80e_20261027132158`.
- Render UUID `5d8c7db2-b34e-4781-af1a-2aa236691ea5`
- URL https://media-os-backend-production.up.railway.app/api/v1/remotion/renders/5d8c7db2-b34e-4781-af1a-2aa236691ea5/video
- Worker: COMPLETED 4,879,699 bytes. Runner verification: `READY`, 1280×720 FAST_PREVIEW, 30fps, 2400 frames (80s), MP4 ftyp, vide track, soun track and mp4a AAC track, `passed=true`.
- Three pre-existing C01/C02/C03 voice-over MP3 clips reused unchanged; no additional ElevenLabs voice generation; approved locked masters SHOT01–11 untouched.
- Technical QA is not a claim of full frame-by-frame subjective review. Director should inspect rendered label/typography at video scale and explicitly approve or request correction. V5 remains unlocked until Director says LOCK.

## Next step
Director watches V5, checks `CREDENTIALS VERIFIED` and `Protected API` layout, and optionally issues Director LOCK. Do not assume locking from technical pass.
