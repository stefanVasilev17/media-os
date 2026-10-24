# EP001 SHOT07 — Premium Auth Service Director Visual Pass v4 (DRAFT)

## Director feedback / approved visual references
The Director approved a premium deep-navy cinematic design for the Auth Service hero, the mini-phone / three validation cards lesson, and the two-card “Submitted → Account facts needed” explanation. This explicitly supersedes the visually rejected previous SHOT07 v3. The references are visual target references, not permission to change narration. The v4 vector composition animates that layout, rather than displaying reference images as fixed screenshots.

## Required direction
- Hero: centered “Auth Service” and subtitle “A login request has arrived. But identity is not proven yet.” Teal Login request and violet “Who is this?” cards equally sized and aligned horizontally; single luminous arrow. Upright and optically centered question mark. No “INSIDE THE SYSTEM / 07” or “NOT VERIFIED” pill.
- Mini phone: fictional alex@example.com, masked secret and recognizable login form; informational replay rather than a second login. Two oversized Account Identifier and Submitted Secret panels.
- Validation: “Is this request usable?”; three visible, evenly aligned high-contrast colored cards. Reveal each on the relevant approved voice anchor: EMPTY_FIELD_EXAMPLE / FORMAT_EXAMPLE / LIMITS_CHECK; smooth upward settle; final bottom line: “The request may be valid in form, while the password is still unproven.” Do not invent a numeric max input length.
- Stored facts: heading “The request passed. But proof still depends on stored account data.” Teal Submitted and violet Account facts needed cards, clean dotted line and perfectly centered upright question mark. Show why account record is still required; no authentication success.
- Handoff: return continuously to existing SHOT06 living map; green Login Request stays in Auth, cyan lookup with account identifier only travels to User Database; no password forwarded as lookup payload.
- Premium visual standards: dark navy, teal / blue / violet accents, >=2px visible card borders, large text and deliberate spacing, avoid visual ghosts and overcrowding.

## Implementation
- `remotion-engine/src/episodes/ep001/live-diagram/AuthServiceTier2V4YoutubePreview.tsx` is the v4 visual composition; `VoiceSyncedShot.tsx` chooses only this implementation for SHOT07.
- `V76__shot07_director_v4_visual_pass.sql` upgrades the separate un-locked Visual Contract's visual descriptions while preserving five original HEAR strings and voice clip timing.
- `ops/shot07/render_director_review_once.py` only requests a new isolated preview after the exact v4 Visual Contract appears in production and the immutable voice pack, word alignment and storage safety are checked.
- Previous v3 render `8fcc80df-4299-42ce-b458-8b1d1d4b7373` is not the v4 result and must remain preserved for comparison.

## Director gate
The images were approved as aesthetic references. The produced v4 motion picture is NOT Director LOCKED; its visual fidelity, legibility, timing and continuity must be reviewed as actual motion by Director before native Visual QA and LOCK. Do not edit voice C01–C05, SHOT01–06, or any existing locked artifacts.
