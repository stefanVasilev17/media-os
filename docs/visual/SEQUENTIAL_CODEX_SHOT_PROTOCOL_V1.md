# Architectural Thinking — Sequential Codex Remotion SHOT Protocol v1

**Director decision:** 2026-11-05. Newer execution-granularity instruction supersedes 2026-11-04 preference for a **single Codex code-generation pass for the whole episode**. It does NOT undo the approved **one-file episode intake**, **whole-episode voice preparation**, **single all-SHOT planning manifest**, incremental reuse or automatic final assembly.
**Status:** Approved workflow direction; code-level execution gating in MediaOS is NOT implemented merely by writing this document.
**Agents:** Codex Cloud may work on Remotion visual code ONLY. ChatGPT + GitHub handle Java/React/PostgreSQL/infrastructure. Director retains visual approval.

## The key distinction: whole-episode PLAN, one-SHOT CODE DELIVERY

Episode Package is produced once after Director locks Script + HEAR→SEE. MediaOS prepares all voice tasks together. Director selects/approves every current-revision Take, with real timings. One complete episode-wide story, source, asset inventory and continuity map are created. **This global plan remains in force** so adjacent scenes are parts of the same world.

Then visual code proceeds **one SHOT at a time, in narrative order**. For EP002, preserve Director-LOCKED SHOT01. Start with SHOT02 and progress to SHOT11. Never ask Codex to write all ten new scenes in a single speculative generation step. The model receives only one target SHOT, small adjacent continuity context, approved source references and exact inherited visual rules. Focus Codex usage on a constrained task that can be carefully checked.

**Mandatory living architecture recipe before visual planning (AT-VIS-0019):** **Mandatory global visual quality floor for architecture storytelling.** EP004 SHOT14 V1 is a Director-LOCKED reference for visibly living, dynamic architecture. The Director explicitly praised the real rendered video: “Перфектно!!! Много добре! Ей това е раздвижена архитектура! Много ми харесва! Запиши си правилата в това видео!!! Локваме”. Make motion communicate engineering causality, not decoration. Keep a persistent recognizable map with stable component identities and connected ports. Reveal a new dependency geometrically on its actual spoken cue, animate traffic along the causal path, show a changing workload through packet frequency, and show successful responses only after modeled successful completion; blocked traffic waits rather than masquerading as success. Use distinct but coherent phases: inherited live state, earned overview, sequential causal landmarks, real failure propagation and recovery, simultaneous local-versus-system outcomes where the lesson requires them, then a motivated handoff. Keep subtle server activity and traffic alive during readable holds, reduce intensity for reflection, avoid arbitrary object shaking, repeated zoom loops, decorative particles, frozen maps and full-diagram dissolves. Keep labels short and physically anchored; preserve adequate spacing and legibility at the final camera pose. Reuse the SHOT14 motion recipe, not its topology, coordinates, fixed number of events or cue timing. A genuinely quiet narrative moment may remain quiet. AT-VIS-0019 strengthens, never replaces, AT-VIS-0014/0015/0017/0018, exact decoded predecessor continuity, approved Take/cues, factual accuracy, security and Director approval. Do not present schematic counts or topology as verified production measurements. Validate bounded camera progress, correct temporal event order, causal traffic and response gating, local/global contrast where applicable, final geometry and actual motion before rendering; actual MP4 acceptance remains Director-owned.

**Immutable approved reference:** EP004 SHOT14 — The Architecture Paradox, production commit `e1158d874c63205bffb55e4ea6e0e011e667ea75`, render `404832c1-0b7d-4de7-a95b-1971445d9a4d`, 2018 frames / 67.2667 s / 1920×1080 at 30 FPS, 3,842,133 bytes. Authenticated POST `/film/locks/SHOT14` returned HTTP 200; worker reported real selected Take mux PASS, exact locked SHOT13 SHA/decoded-frame preflight PASS, seam PSNR 44.41 dB and 30 distinct opening frames. Original 9 beats and 20 real event anchors verified; `ready=true`, `blockers=[]`. Backend and Worker SUCCESS at the exact source SHA. Canonical code: `remotion-engine/src/episodes/ep004/Shot14ProductionScene.tsx` (ParadoxWorld), `remotion-engine/src/components/architectural-thinking/EP004Shot14ProductionWorld.mjs` (shot14State, flow, phase, routeFor), `remotion-engine/ep004-shot14-production.test.mjs`. See `docs/visual/EP004_SHOT14_ARCHITECTURE_PARADOX_20261126.md` for the reusable recipe and real cue clock.

**Mandatory transition recipe before visual planning (AT-VIS-0018):** inspect the pinned SHOT12 V2 reference and choose a persistent-world reframe for shared-architecture diagram changes. Plan the spoken focus cue separately from the later engineering action; default to a fast 12-frame local focus transition, with readable holds, no full-diagram crossfade. Test the exact predecessor seam, camera bounds, stable object identities, and absence of overlapping full-diagram fades. For genuinely distinct views, motivate the spatial transition or clean cut by narration. See [approved recipe](EP004_SHOT12_V2_DIRECTOR_FEEDBACK_20261126.md) and the Constitution.

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

## Director no-manual-Codex requirement (2026-11-06)

The production UX must not ask the Director to paste or type prompts, manually open Codex Cloud tasks, transfer code or manage task IDs. MediaOS dispatches each one-SHOT Remotion task and observes its lifecycle through a **supported authorized integration** once voice/cues/policy/asset preflight passes. Use the official Codex Cloud CLI only if cloud environment compatibility is actually verified; otherwise evaluate officially supported subscription-backed Codex app-server on a managed cloud host only after required OAuth eligibility, remote-host consent and security checks. A self-hosted Codex worker is **not Codex Cloud**. No internal ChatGPT API scraping or credential harvesting. If no permitted subscription-connected path is operational, keep fail-closed and report a product blocker; do not substitute paid OpenAI API or a manual copy/paste workflow as success.

Director retains audio approval, real visual acceptance and separate resource/cost grants, but **never task-prompt entry**. One approved global continuity map, one Codex Remotion scene at a time, cumulative Director lessons and versioned reusable primitives remain unchanged.

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
