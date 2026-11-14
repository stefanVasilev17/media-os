# Architectural Thinking — Director P0: TEXT DWELL OR OMIT (NO FLASHING CONTAINERS)

**Director rule issued 2026-11-14** for EP003 SHOT01 and **every future video/SHOT/agent**. Priority P0. This supplements [Global Visual and Motion Constitution](AT_DIRECTOR_P0_GLOBAL_VISUAL_MOTION_AND_QA_20261113.md), [Content-Fit and Readability](AT_CONTENT_FIT_AND_VISUAL_READABILITY_DIRECTOR_RULE_20261111.md), and [Exact Cross-SHOT Continuity](AT_DIRECTOR_P0_INVISIBLE_CROSS_SHOT_CONTINUITY_20261113.md).

**Original Director correction:** “излизат малки контейнери с текст, които МНОГО БЪРЗО ИЗЧЕЗВАТ и дори не можем да ги прочетем. Оправи ги. Ако времето не стига, просто не ги създавай!” This is the canonical rule, not a suggestion.

## Required visual behavior — every new video

- **Human-readable dwell is mandatory.** A text card, pill, caption, or technical-status panel may appear only when the full content has enough uninterrupted visible, fully opaque time for ordinary viewers to read it on a smaller YouTube player while listening to narration. Merely rendering a title for 1 second is NOT usable. Do NOT increase reading speed by shortening/narrowing the existing narration.
- **Omit instead of flash.** If real HEAR→SEE cue spacing, architecture motion, panel collision protection, or camera timing cannot accommodate a readable hold, OMIT that panel entirely. Show the engineering meaning through the existing animation or voice. Never substitute unreadably tiny text, fast blinking cards or rapid rotating overlays to satisfy an asset count.
- **Concrete initial floor for new two-line cards:** total visible allocation should be at least **5.5 seconds** at 30 fps (165 frames), with extra time based on actual displayed word count (initial planning: 1.8 seconds orientation + 2.6 words per second reading). At least around **4 seconds of fully opaque, stable content** must normally be preserved after fade-in and before fade-out. Longer/dense copy needs more time. These numbers are *minimum engineering gates*, not a reason to rotate cards every 5.5 seconds; prefer much longer, voice-linked dwell where it helps. Director visual review on the actual MP4 remains authoritative.
- **Fade envelope test is mandatory.** The entrance opacity must rise from zero to one, stay *fully visible over the middle of its cue window*, then decline near the next true cue; never use an inverted next-cue fade condition that hides the card for most of its logical window. Test the exact start, midpoint, full-opacity hold and end, not only the existence of a cue or first/last frame.
- **Use actual timestamps and real frame budget.** Derive cue frames from the selected saved locked ElevenLabs Take, not guessed timings; account for incoming/outgoing visual transition duration and time remaining in the SHOT. Reject/omit panels with insufficient actual on-screen time. A new panel must never cover existing infrastructure, live paths, packet particles or other cards, or cause content overflow.
- **No scene/pacing regression.** The whole Remotion Living Architecture World, all request particles following source geometry, typography/color system, and P0 preceding-last-to-next-first frame handoff are invariant. This rule must never modify or regenerate Director-LOCKED narration, existing approved audio, prior locked episodes, or previous approved MP4s.
- **Evidence gate:** automated tests must count real source labels, check their pixel content fit/collision clearance, calculate real cue-to-cue intervals, ensure every rendered label has enough time, test opacity at its midpoint and any fade, assert short cue cards render as null, and inspect the candidate MP4. Source-level tests alone do NOT guarantee the final video is visually readable; Director personally reviews real rendered output before LOCK.

## EP003 SHOT01 — cause and regression fix

**Observed actual bug in candidate V1 source** [EP003 SHOT01 render PR #275](https://github.com/stefanVasilev17/media-os/pull/275): `ContentCard` used:

```text
ease(since,0,22) * (next ? 1-ease(until,0,21) : 1)
```

For most of the interval before the next cue, `until` exceeds 21 frames and `ease(until,0,21)` is 1. The factor `1-ease(...)` therefore forces opacity to **zero during almost the entire cue window**, briefly showing the label just before it switches. This explains the Director's objection and is a logic bug, not a voice pacing problem.

**Corrective implementation in a new versioned EP003 SHOT01 render candidate:** stable full-window opacity, a short smooth entrance and exit, and `ep003CardIsReadable(...)` as a fail-closed gate. Keep exact EP002 ending frame input, shared source-derived paths, approved 83.28 s Slow Natural Take, original cue timestamps, geometry and no collateral animation changes. New MP4 MUST be rendered and checked separately. Never overwrite the original V1 candidate, and never call either candidate Director-LOCKED without human approval.

**Rule in one sentence:** **If the viewer cannot comfortably read a card before it disappears, do not render that card.**

## Permanent agent checklist

- [ ] Genuine audio-linked cue start/end and full actual SHOT duration available
- [ ] Every card has comfortable reading budget for its displayed words
- [ ] Opacity=1 across most of its middle window; no inverted fade bug
- [ ] Cards with too-short windows are omitted completely
- [ ] No overlay-to-overlay / overlay-to-node / overlay-to-path collision
- [ ] No overflow, tiny copy, jitter or fast topic switching
- [ ] Actual MP4 reviewed at reduced YouTube player size
- [ ] Existing prior frame/voice/SHOT locks preserved
- [ ] Director explicitly accepts the **new** exact output before any SHOT LOCK

**State distinction:** `POLICY_DOCUMENTED` is not `IMPLEMENTATION_TESTED`, `RENDER_SAVED` or `DIRECTOR_LOCKED`. Do not conflate them.
