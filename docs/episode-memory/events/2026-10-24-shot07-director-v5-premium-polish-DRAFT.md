# EP001 — SHOT 07 — Director Premium Polish v5 (DRAFT)

**Date:** 2026-10-24  
**Director feedback source:** Render v4 screenshots: malformed secret icon, stacked/uneven black-blue backdrops and stray grid seams, overlapping `USER LOOKUP CREATED` icon/text, and frozen large-map section while approved narration continued. The previous v4 render is a reference only and **not** Director LOCKED.

## Goals and strict invariants

The Director owns creative approval. The AI production implementation must use approved visual references as an art-direction target but render clean, editable Remotion vector animation, not AI-style flattened screenshots. This file records a **DRAFT**, not authorization to lock anything.

- Do **not** change already Director-LOCKED EP001 Script revision 3, SHOT 07 original approved C01–C05 narration/audio, their timestamp alignments, SHOT 01–06, or SHOT 08/09 voices.
- No footage replacing the exact Director-approved SHOT 06 v5. Native SHOT 06 QA/LOCK remains a separate open issue (#89).
- Preserve distinct mint original Login Request and cyan User Lookup, and keep passwords out of database lookup requests. Do not visually imply authentication success.
- Keep the same 1920×1080 @30fps composition and five separate original voice recordings; keep no automated Director LOCK.

## C01 / C02 — hero and visible submitted fields

- Dark cinematic navy 16:9 screen, precisely centered approved `Auth Service` typography and a single clean subtitle; no chapter label or `NOT VERIFIED` UI pill.
- Two large balanced cards for login request vs. identity question, with upright centered question mark. Keep enough negative space for readable narration-to-visual correlation.
- Mini phone uses fictional `alex@example.com` with a password rendered only as bullets. Two separate field tiles show `ACCOUNT IDENTIFIER` and `SUBMITTED SECRET`. Replace defective path icon in secret tile with a small closed geometric **padlock** matching the user-icon stroke weight. No weird floating strokes.

## C03 — validation

- Exactly three large validation cards with visible borders and clean margins, revealed **sequentially** at approved audio anchors `EMPTY_FIELD_EXAMPLE`, `FORMAT_EXAMPLE`, and `LIMITS_CHECK`, with small settle motion and never an all-at-once entrance.
- No invented input-size maximum. `Is this request usable?` is an educational presentation, not a login-success screen.
- Final proof reminder: `The request may be valid in form, while the password is still unproven.`

## C04 — stored facts and badge

- The two-card `Submitted` versus `Account facts needed` teaching diagram is optically centered and legible. Center question mark glyph, use clean one-line hierarchy.
- Remove overlapping cyan search graphic from the `USER LOOKUP CREATED` badge. Use a 490px capsule with a small isolated cyan status dot and text safely centered to its right. All elements must remain inside pill at 1280x720 viewing size.
- Badge appears only at approved `LOOKUP_BORN` anchor. Voice and words are immutable.

## C05 — animated map return, not static listening

- **Root cause / fix:** previous frame mixed the underlying Map opacity `1-entered*.7+mapIn*.7` with semi-transparent premium background. This produced obvious black/blue seams, stripes and ghosted architecture behind Auth scene. Keep the original map mounted underneath **unchanged**. Place a single completely opaque Auth scene backdrop above it when inside. Fade the *entire group* once as the camera returns to the existing architecture map. No nested semi-transparent duplicated background.
- Use positions grounded by Director-approved SHOT 06 end-frame (rendered map; 1920×1080 basis): Auth node approximately x1363..1594, y507..714; User Database approximately x1622..1847, y507..714; route near y613. These are overlay targets to verify against rendered SHOT 07 frame, not independent architectural replacements.
- Stagger meaningful reactions at the **six C05 original voice anchors**, preserving spoken exact sequence:
  1. `ORIGINAL_STAYS` → mint steady waiting pulse inside Auth Service (original Login Request remains there).
  2. `LOOKUP_TRAVELS` → cyan lookup tracer travels once along Auth→User Database route; mint request remains stationary.
  3. `NOT_SECOND_LOGIN` → readable distinction: `This is an internal account query — not a second login.`
  4. `SERVICE_QUESTION` → User Database border begins a gentle pulsing focus, not fictitious data return.
  5. `LOOKUP_ACCOUNT` → show identifier-only `alex@example.com` lookup card; no password in payload.
  6. `INFORMATION_FOR_VERIFY` → replace query caption with `STORED ACCOUNT FACTS REQUESTED`; leave identity unverified for SHOT 08.
- All six beats must move or change meaningfully during narration; do not let the last minute remain a static map.

## Implementation references

- New isolated revision: `remotion-engine/src/episodes/ep001/live-diagram/AuthServiceTier2V5YoutubePreview.tsx`.
- Existing voice-bound dispatcher: `VoiceSyncedShot.tsx` points exclusively SHOT07 at v5; SHOT 01–06 imports remain unmodified.
- Flyway `V77__shot07_premium_visual_v5_polish.sql` upgrades only the still-DRAFT visual `SEE` summaries after SHA and no-lock checks.
- `ops/shot07/render_director_review_once.py`: requires the exact `DIRECTOR_TIER_PLUS_PLUS_V5_2026_10_24` visual source and checks every locked C01–C05 clip, word-level anchors, and storage health; old v3/v4 IDs are explicitly treated as legacy rather than new results.
- `.github/workflows/shot07-director-draft-once.yml`: waits for v5 contract and requests one isolated `EP001-Shot07-VoiceSynced` REVIEW MP4, **never** QA PASS or Director LOCK.

## Director visual QA (mandatory before approval)

1. Inspect screenshots of transitions into/out of Auth screen at **early/half/fully-visible** frames: no black side bars, duplicate backgrounds, clipped gridlines or ghosted map objects. Intentionally small traces on background are stylistic; discontinuous seams are defects.
2. Check closed padlock and `USER LOOKUP CREATED` pill at full 1080p *and* scaled 720p: no crossed icon strokes, overlap or lost text.
3. Watch last C05 uninterrupted with voice: mint pending vs cyan internal request visually distinct; lookup moves on original architecture map; six audio events produce six coherent visual reactions. Confirm final frame hands off to User Database without showing a data response or login success.
4. Verify **five unchanged audio clips** and full duration by inspection and metadata; do not treat successful render as Director approval.
5. Director reviews complete video, requests additional polish if needed, then native Visual QA/LOCK can occur by separate explicit action.
