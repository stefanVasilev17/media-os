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


## Director-observed correction AT-VIS-0002 — EP003 SHOT08 V1 shard and replica readability (2026-11-15)

- **ID:** AT-VIS-0002.
- **Date / Director decision:** 2026-11-15. Director requested three changes after viewing real V1 MP4. V2 correction is **PROPOSED / UNDER REVIEW**. **Not Director-accepted or LOCKED**.
- **Scope:** SERIES preventive design preflight. EP003 SHOT08. Shared visual principles for all next Architectural Thinking SHOTs.
- **Context:** Real saved SHOT08 V1 MP4 render `02dbdec4-167f-4d44-9780-74dc1f0aa0a5`. Same original selected Slow Natural voice take `368c239c-a93b-437e-a833-2f955fa51803`. 5372 frames. Screenshot of shard owners and read replicas supplied directly by Director.
- **Problem observed:** Two duplicate `ACCOUNT OWNER` labels overlapped each other beneath adjacent Shard A and B. Replica A/B icon and title were not completely contained within each replica card boundary, especially near the lower edge. `REPLICATION VS SHARDING` explained the difference with an ambiguous fragment `Copies of data. Different data owners.`, rather than naming both mechanisms.
- **Proposed correction:** Increase shard x-spacing to 165px. Relabel `OWNER A` and `OWNER B`, preserving established visual world and actual Login packet paths. Put each replica icon and text fully inside its existing card by moving title baseline from top+111 to top+98 and scaling icon to .92, eased smoothly during the early V2 frames. Display the clearer two-line definition `Replication copies the same data.` and `Sharding splits data between owners.`. Each line independently measured at 26px and card height adjusted to165px. All on-screen sentences use periods, not semicolons.
- **Preventive rule:** Before a render, check adjacent-node label widths against *neighbor label widths* with actual spacing margin, and check each icon and label bounding box against its **own container border** at all animated scales. For comparison cards, explicitly name both concepts in separate readable sentences with independent text-fit measurement. Keep requests on their physical paths and preserve exact previous decoded last frame in the new SHOT.
- **Affected assets / dependencies:** `remotion-engine/src/episodes/ep003/Shot08WhenCopiesAreNotEnoughV2.tsx`, `remotion-engine/ep003-shot08-sharding-v2-p0.test.mjs`, `remotion-engine/ep003-shot08-sharding-v2-render-once.mjs`, and V2 review frontend. Existing V1 and all Director-LOCKED SHOT01–07 unchanged.
- **Evidence:** Screenshot and three explicit corrections in this conversation; V2 code commit `61b7aa1827ab15920f56031fcff9118375cfcedd`; [draft PR #302](https://github.com/stefanVasilev17/media-os/pull/302). Pre-render first-frame still matched original last frame at 100 dB.
- **Verification:** V2 Remotion scene tests **4/4 pass**, bundle built, selected original voice, 29 real anchors and exact P0 still verified. Final encoded MP4 and Director visual review **NOT_VERIFIED** at time of entry. Do not claim corrected appearance is accepted until Director watches V2.
- **Promotion:** Proposed series-wide layout guard. Preserve as observed incident but do not declare implementation LOCKED until explicit Director approval.
- **Supersedes:** None.

