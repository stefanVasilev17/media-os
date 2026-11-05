# Architectural Thinking — Sequential Codex Remotion SHOT Protocol v1

**Director decision:** 2026-11-05. Newer execution-granularity instruction supersedes 2026-11-04 preference for a **single Codex code-generation pass for the whole episode**. It does NOT undo the approved **one-file episode intake**, **whole-episode voice preparation**, **single all-SHOT planning manifest**, incremental reuse or automatic final assembly.
**Status:** Approved workflow direction; code-level execution gating in MediaOS is NOT implemented merely by writing this document.
**Agents:** Codex Cloud may work on Remotion visual code ONLY. ChatGPT + GitHub handle Java/React/PostgreSQL/infrastructure. Director retains visual approval.

## The key distinction: whole-episode PLAN, one-SHOT CODE DELIVERY

Episode Package is produced once after Director locks Script + HEAR→SEE. MediaOS prepares all voice tasks together. Director selects/approves every current-revision Take, with real timings. One complete episode-wide story, source, asset inventory and continuity map are created. **This global plan remains in force** so adjacent scenes are parts of the same world.

Then visual code proceeds **one SHOT at a time, in narrative order**. For EP002, preserve Director-LOCKED SHOT01. Start with SHOT02 and progress to SHOT11. Never ask Codex to write all ten new scenes in a single speculative generation step. The model receives only one target SHOT, small adjacent continuity context, approved source references and exact inherited visual rules. Focus Codex usage on a constrained task that can be carefully checked.

Each shot uses this loop:

1. **Preflight before coding.** Read current AGENTS.md, AT_REMOTION_VISUAL_CONSTITUTION_V1.md, CODEX_VISUAL_LESSONS_LEDGER.md and this file; read exact Script + visual beats + *selected* voice/cues for the target SHOT; inspect Git-pinned shared components, last approved adjacent SHOT, known asset gaps and established geography. Compare base Git SHA and the Director-approved hashes. If any required evidence is missing, stop with a blocker. Never invent voice timing or materialize protected EP001/EP002 assets for editing.
2. **Write a short PRE-SHOT VISUAL CHECK.** Declare the chosen target key, source/voice SHA, read rules and relevant ledger IDs, spatial continuity, intended camera states, scene component reuse list, missing primitives, expected semantic beats and likely failure modes. This is a decision artifact, not a license to run render or spend tokens beyond the chosen Codex task.
3. **Deterministic-first attempt.** If existing scene specs, components and presets can express this SHOT, prefer their composition without new creative AI proposals. For required new Remotion work, Codex writes **only the selected SHOT's episode-local TSX/helper files** and focused tests. No unrelated full-episode edit, no shared component changes, no Root.tsx changes, no autonomous new paid calls.
4. **Code QA.** Check safe imports, allowed episode-local paths, TypeScript and Remotion bundle, deterministic voice event mapping, no unreviewed geometry drift or component replacements. GitHub Actions stays disabled. A bundle passing does NOT prove a video is visually correct.
5. **Preview QA.** MediaOS render is allowed only after a separate bounded Director CPU confirmation. Review both full-frame and key sampled frames and compare camera/focus/labels/semantic states against approved baseline and adjacent SHOT. Check the real voice sync. A source-only PR without a rendered preview stays VISUAL_NOT_VERIFIED.
6. **Feedback + lesson.** On Director correction, change **only the selected SHOT and affected dependencies**, repeat relevant tests/preview, and append an evidence-backed ledger entry only after Director accepts the correction. Reusable new primitive/recipe needs explicit separate Director review and versioning.
7. **Advance to next SHOT.** The next Codex task must read latest approved ledger and previous accepted scene continuity. An automatic next-SHOT action is allowed only when the quality gate is satisfied and the configured Director review policy permits it; do not auto-approve visual quality. Preserve all earlier accepted SHOTs and renders.

**One visualization = one narrative SHOT delivery unit**, not one fresh global scene invented without the adjacent geography. Multiple HEAR→SEE beats exist inside a SHOT and are implemented together for coherent motion. If a SHOT is unusually long or contains several distinct visual micro-worlds, it may be broken into **internal code subtasks** while remaining one SHOT for Director approval.

## Required state model (target future MediaOS implementation)

- EPISODE_SOURCE_LOCKED / VOICE_TASKS_PREPARED: episode planning, no paid execution.
- ALL_VOICE_TAKES_APPROVED: current narration revisions, measured actual durations and timed cues for every SHOT.
- EPISODE_VISUAL_PLAN_READY: canonical shared map and asset decision list.
- SHOT_PENDING → SHOT_PREFLIGHT_PASSED → SHOT_CODE_PROPOSED → SHOT_CODE_VERIFIED → SHOT_RENDER_AWAITING_CPU_APPROVAL → SHOT_PREVIEW_READY → SHOT_DIRECTOR_ACCEPTED.
- SHOT_REWORK_REQUESTED loops back to scoped code+preview verification; rejected drafts are not future canonical references.
- On all needed SHOTs accepted, assemble 1080p Master and ≥3 reviewed Shorts with separate CPU/storage authorization and Director final approval.

This is a **target contract**, not a claim the live database/UI currently has these states. Existing V119/V120 support only EP003+ whole-episode Codex handoff and render pipeline; EP002 is being adapted. Do not silently weaken current V120 voice/source/asset guards to expedite this workflow.

## Codex task budget rule

Never send the entire repository history or every unneeded historical asset prompt. Prefer:
- canonical 3 visual docs + AGENTS.md;
- one exact SHOT narration and timed visual beats;
- authoritative short adjacent/episode continuity snapshot;
- reviewed component catalog/import paths and locked/source blob SHAs;
- targeted prior correction IDs;
- exact deliverable filename, QA acceptance and restriction on external operations.

One SHOT per Codex Cloud task keeps code review and corrections precise. It does **not guarantee** fewer total Codex usage units; repeated startup context can consume more allowance. To keep usage controlled, cache concise versioned preflight inputs, prioritize deterministic reusable components and do not rerun fully approved scenes without a relevant changed dependency. We choose visual consistency and reduced expensive rework over speculative one-pass speed.

## EP002 protection & transitions

- EP002: 11 total SHOTs, 59 approved editorial beats, Script v4.0 and Visual Pass v1.0.
- SHOT01 v3 visually Director-LOCKED: treat as the **initial approved visual reference**, not a code-generation target.
- Generate SHOT02 first, with the spatial and narrative handoff from SHOT01; after acceptance continue SHOT03 to SHOT11 in order.
- Approved original Voice Takes and archival script/visual documents are immutable; working revisions remain independently versioned.
- Only the current measured voice timing can set final frame counts. Existing unresolved ElevenLabs charge state is a hard blocker for retries, not an invitation to regenerate.
- Existing Visual Pass and its original beat descriptions remain approved; if they lack exact spoken cue anchors, collect and verify anchors rather than hallucinating them.

## End-to-end invariants

Scene code is a proposed production artifact, not a user approval. A Codex PR is not an automatic merge. Worker bundle evidence must match actual Git source SHA. A rendered SHOT is not automatically visually accepted. A completed Master does not publish anything. Director always controls cost gates, final quality and release.

**This newer decision should be implemented as a next-SHOT queue on top of a single episode-wide manifest, not ten isolated episodes or disconnected scenes.** The goal is one stable style, one consistent architecture map, high-quality per-SHOT construction and fully automated final assembly.
