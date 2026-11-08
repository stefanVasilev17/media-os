# Architectural Thinking — Visual Corrections & Lessons Ledger v1

**Scope:** Git-versioned, reviewable, append-only memory for Remotion visual corrections across ALL Architectural Thinking episodes and related series.
**Status:** Empty historical-incident ledger at initialization. Existing source-of-truth style failures are listed in AT_REMOTION_VISUAL_CONSTITUTION_V1.md; they are NOT falsely attributed to individual prior Director reviews.

## Why this exists

A Codex Cloud conversation is **not** the production memory. Cloud sessions, model context, usage limits and one-off corrections may be lost. Every Director-confirmed correction must live in the repository and be read before the next SHOT. The same mistake should not have to be rediscovered in SHOT03, EP003 or EP010.

## Two independent layers

1. **Core style contract** in AT_REMOTION_VISUAL_CONSTITUTION_V1.md: stable brand-wide geometry, layout, colors, focus states, camera and motion grammar, voice-driven timing, engineering truth and locked components. Do not scatter contradictory global rules in isolated SHOT prompts.
2. **Corrections ledger** in this document: specific incidents, reasons, applied fix, scope, link to real reviewed preview/code evidence, Director approval, and whether the lesson is promoted into a reusable component or the core style contract. Keep the full history even when superseded.

## Required correction entry

After a real Director comment, add an append-only entry **on an isolated docs/code PR** using the exact fields below. A Codex proposal is unverified until the Director accepts it.

- **ID:** AT-VIS-0001, AT-VIS-0002, ... (monotonically increasing, never reused).
- **Date and Director decision:** yyyy-mm-dd, APPROVED / PROPOSED / REJECTED / SUPERSEDED.
- **Scope:** GLOBAL / SERIES / EPISODE / SHOT / COMPONENT, and exact episode+SHOT keys when applicable.
- **Context / original expectation:** narration anchor, visual beat, current source commit/contract/voice Take version.
- **Problem observed:** what actually looked wrong or was inaccurate, not an invented lesson.
- **Approved correction:** precise visual or technical change; before/after state and design tokens where applicable.
- **Preventive rule:** one short check that can be applied **before** coding the next SHOT.
- **Affected assets / dependencies:** exact existing component paths and next-SHOT continuity effects.
- **Evidence:** Director feedback ID or review URL, PR/commit, still-frame/MP4 render IDs if available.
- **Verification:** what actual test/preview/director observation proved the fix. If not verified, say NOT_VERIFIED.
- **Promotion:** none / new recipe / new reusable component / amended constitution, plus PR.
- **Supersedes:** older rule ID, if a later Director decision intentionally changes it.

Do not encode credentials, private voice audio, production secrets or user personal data here. Reference immutable IDs where relevant; never fabricate timestamps or screenshot observations. Director acceptance must never be synthesized by an agent.

### Example shape — NOT A REAL INCIDENT

AT-VIS-0000 is a **template, not a recorded correction**:
- Date / decision: N/A / TEMPLATE_ONLY.
- Scope: EPISODE / SHOT.
- Problem: [state what was actually observed after a real review].
- Approved change: [exact adjustment accepted by Director].
- Prevention: [preflight question].
- Evidence: [real verified PR or Director approval].
- Verification: NOT_VERIFIED until a review occurs.

## Active accepted corrections

**None imported yet.** The historical official style failure modes are enforced by the constitution. It would be inaccurate to invent a past corrections log based on general visual advice. Backfill only where an exact Director-approved conversation/screenshot and its referenced result are available.

## Director-observed correction AT-VIS-0001 — SHOT02 comprehension pacing (2026-11-07)

- **ID:** AT-VIS-0001.
- **Date / Director decision:** 2026-11-07; Director REJECTED the V2 speed/readability and requested correction. New V3 implementation is PROPOSED, **not yet Director-accepted**.
- **Scope:** SERIES acceptance gate; concrete first failure EP002 SHOT02.
- **Context:** production V2 MP4 render `eba3a449-574e-4b99-8007-080e4c496e5c`, 1205 frames at 30 fps (40.17 seconds), approved current ElevenLabs Take and real 5 beat / 7 term anchors.
- **Problem observed:** Director reports some main architecture objects are only visible for approximately one second, making the content hard to understand. In V2 code, focus fades after as little as ~21 frames past the named term and the node's enlarged interior disappears with it.
- **Proposed correction:** keep each primary named node's enlarged interior visible for 120 frames (4 seconds) when the actual video has space; slow reveal, repeated Login clicks and arrival ramp; reject ultra-short camera focus windows and preserve actual spoken term onsets. Keep SHOT01/EP001 sources protected and do not change narration alignment.
- **Preventive rule:** if an architectural object cannot be clearly read in a steady, meaningful 3–4 second window, it must not be treated as review-ready. If the unchanged voice forces a shorter window, flag an audio pacing/re-alignment requirement rather than faking timestamps.
- **Affected assets:** `Shot02DirectorPacing.ts`, `Shot02GeneratedScene.tsx`, `shot02-director-v2.test.mjs`, series visual constitution. No protected shared components modified.
- **Evidence:** Director feedback in this conversation, V2 render ID above; proposed fix on Draft PR #192.
- **Verification:** 18/18 isolated pure source-test bodies passed against updated GitHub source, including camera bounds and minimum interior visibility; **V3 Remotion production build, frame QA, audible-pauses revision and MP4 Director review NOT VERIFIED**.
- **Promotion:** visual constitution updated as rejection/prevention rule, without claiming new V3 visual acceptance.
- **Supersedes:** the former interpretation that a 0.7-second post-word visual hold is sufficient.

## Director instruction AT-VIS-0002 — Tier++ V5→V7 language becomes series-wide benchmark (2026-11-08)

- **ID:** AT-VIS-0002.
- **Date / Director decision:** 2026-11-08; **APPROVED GLOBAL STYLE DIRECTION** and instruction to preserve it in source files and monitor every future render. **NOT** independent MP4 approval for SHOT02 V7.
- **Scope:** GLOBAL / SERIES; exact reference EP002 SHOT02 V5, V6, V7; all future SHOTs/components.
- **Context:** Director earlier saw the actual V5 SHOT02 MP4 and requested corrections for hero timer, button, live throughput, counter, end title, particle size, database state. V7 approved source/reference is [Draft PR #197](https://github.com/stefanVasilev17/media-os/pull/197), tested exact Worker source `be142b2573b190e3f70fab5586da6825a7a479d2`; V5 actual MP4 render ID `272a2217-aa43-469f-ad8d-fbc84f2fbf03`.
- **Problems observed:** blurry/time-ambiguous `09:00`; overlapped or clipped lower conclusion; different size/glow packets per hop; late-arriving DB lookup traffic; warning-orange DB before the spoken stress explanation; overly subtle or short button press; node/card nesting and cropped camera subjects in earlier versions.
- **Director-approved cross-series correction:** Tier++ cinematic, readable, connected, causal living-map design. One readable architecture object per semantic entity; high-contrast clear card/edges; accurate replica routing; identical packet appearance at all hops; visible requests from first user action including normal healthy Database access; warning color only at narrated pressure/failure; meaningful continuous user interaction; legible hero title; safe spatial counter/title repositioning; camera and voice timing exact. **See `AT_TIER_PLUS_PLUS_VISUAL_RENDER_STANDARD_V1.md`.**
- **Preventive rule:** before every SHOT render require a **shot-specific Tier++ preflight** confirming semantic flow, common particle token, actual voice cue/states, no clipping/collision and Director-readable title; machine-check source and actual media separately, human-review frames before LOCKED.
- **Affected assets:** `Shot02DirectorVisualV5.tsx`, `Shot02PressureVisuals.ts`, `Shot02PressurePhone.tsx`, `Shot02PremiumLayout.ts`, `shot02-v7-final-caption-and-flow.test.mjs`, `AGENTS.md`, `AT_REMOTION_VISUAL_CONSTITUTION_V1.md`, future SceneSpec generators and visual registry.
- **Evidence:** Director's 2026-11-08 instruction “За такова ниво се борим!... High Level Tier++ video rendering... всяка една част...”, Draft PRs #195/#196/#197, V5 completed render ID above, V7 verified Railway Worker release `060b73e6-f88c-4ae4-a1a1-46d6bdbe1f38` and Backend `1d6404b1-e201-4dd7-b724-1d50e004f798`.
- **Verification:** V7 Node tests/build and pinned Worker startup verified. **V7 rendered MP4 and Director final on-screen acceptance NOT VERIFIED** in current evidence. New series-wide monitoring/gate source requires its own QA before release. Style direction accepted; visual implementation evaluation ongoing.
- **Promotion:** Global constitution amendment, canonical Tier++ standard and a reusable rendering QA policy/receipt. Episode-local exact coordinates/timings remain scoped to SHOT02; no indiscriminate propagation to unrelated shots.
- **Supersedes:** any interpretation that a technically passing or visually decorative / nested / inconsistent shot is sufficient for release.

## Mandatory per-SHOT read and filter

Before working on each SHOT, Codex must read this **entire short ledger** and:
1. Apply every current GLOBAL/SERIES entry.
2. Apply all entries targeting the episode, current SHOT, its dependent component or adjacent shared transitions.
3. Check superseded entries for conflicts without reapplying obsolete behavior.
4. Output the relevant correction IDs and a one-sentence prevention statement in its preflight report.
5. If source/evidence is missing, mark the correction UNVERIFIED and request review; do not treat it as established truth.

After Director gives feedback and an approved code/preview exists, capture the accepted lesson **before the next SHOT is generated**. A correction for one isolated shot is not an automatic global style change. Propose promotion when the same pattern is reusable.

## Small change workflow

Director feedback → scoped code correction → QA and screenshot/preview comparison → Director confirmation → append evidence-backed ledger entry → targeted code recipe/component extraction if useful → commit/PR review → next SHOT preflight reads latest ledger.

**Version control is the persistent memory.** No dependence on hidden model memory, previous Codex chat, generic embedding retrieval or an unreviewed text generation.
