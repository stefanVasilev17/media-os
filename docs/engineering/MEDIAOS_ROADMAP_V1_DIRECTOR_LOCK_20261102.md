# MediaOS — Roadmap v1 (Director-LOCKED)

**Decision date:** 2026-11-02
**Decision:** Director approved the ten-stage roadmap for a production-ready, reusable **AI-powered Video Production Studio** for Architectural Thinking.
**Authority:** This file records the current product direction and priorities. It does **not** claim that proposed stages are implemented.
**Scope:** MediaOS, AI-assisted coding/production workflow, ElevenLabs and Remotion, with no separate editing application.

## Product mission

**Creator-directed, agent-executed.** Director supplies ideas, edits narration and HEAR → SEE, chooses voice takes, reviews previews, requests changes and approves final outputs. Agents create or change Remotion source code, perform technical verification, render affected media, assemble the full episode and return preview results in MediaOS.

Example Director request: "In SHOT03 slow down the camera by 30%, enlarge the Redis server by 20%, and make the warning more visible. Preserve everything else."

The target is a scoped versioned code change, validated render and new preview **without regenerating unrelated SHOTs**. Shared assets and transitions must be included when their dependencies change. The **AI Director Revision Loop** is a core product capability, not a future optional enhancement.

## Confirmed foundations — not outstanding stages

- Production MediaOS with React/TypeScript, Java 21/Spring Boot, PostgreSQL/Flyway, verified Director access, audit and Railway.
- Existing Remotion engine and CPU Render Worker with prior EP001 composition work. These are primarily EP001-specific, not proof of universal EP002 scene generation.
- Per-SHOT Edit → Save → optional explicitly confirmed paid ElevenLabs Generate/Regenerate. Keep prior script versions and takes. No forced creative LOCK/UNLOCK.
- Voice playback, preferred take selection, and Voice ↔ HEAR → SEE synchronization: **Director-reported confirmed on 2026-11-02**. Consume them; do not rebuild without evidence of a missing dependency.
- EP001: protected successful-login 12-SHOT current creative cut; earlier 16-SHOT screenplay is historical only.
- EP002: original Director-locked English Script v4.0 with 11 SHOTs; separately approved *new* Visual Pass v1.0 with 59 beats; editable Creative Drafts remain separate and do not rewrite either original source.

## Ten remaining stages — ordered roadmap

| Stage | Name | Required outcome / acceptance evidence |
|---|---|---|
| **1** | **Unified Production Data** | One version-aware contract joins current saved narration, selected voice take and actual audio duration, HEAR → SEE beat plan, render lineage and dependencies by episode/SHOT. No conflicting current states. |
| **2** | **Remotion Scene Contract** | Typed and validated per-SHOT contract converts visual beats into Remotion components, assets, camera instructions and timings; defines explicit allowed agent modifications. |
| **3** | **Automated SHOT Builder** | Real EP002 SHOT01 Remotion composition with selected voice take, actual end-to-end playable MP4 preview and traceable code revision. |
| **4** | **AI Director Revision Loop v1** | Director enters feedback in MediaOS; agent makes a targeted, authorized Remotion code change; passes build/tests; renders updated SHOT01 preview; returns it on the same page for Director review. |
| **5** | **Revision History & Rollback** | Persist Director feedback, visual code revision, timing, audio/assets and preview per version; restore prior revision or selectively reuse earlier camera/effect settings. |
| **6** | **Incremental Rendering** | Render only changed SHOTs and affected transitions; reuse unmodified outputs; invalidate assembly on relevant audio, timing, asset or dependency changes. |
| **7** | **Automatic Episode Assembly** | Automatically combine all 11 EP002 SHOTs with selected audio, measured durations and transitions into a complete playable review master. No manual editing. |
| **8** | **Director Review & Quality Gates** | Full film preview, technical QA (audio, duration, frame count, sync, assets), explicit final approval, reproducible export and rollback. |
| **9** | **Automatic Shorts Production** | At least three suitable standalone Shorts/Reels per finished episode, with vertical layouts, previews and Director review. |
| **10** | **Universal Episode Factory** | EP003 onward reuse the same episode-agnostic production contracts without per-episode infrastructure; monitoring, cost protection, retries, render status and audit included. |

These are **remaining** stages, not a claim of 0% progress for the overall project.

## Milestone gates

- **After Stage 4:** EP002 SHOT01 is the first full AI Director Studio slice: generated scene → synchronized preview → Director feedback → revised code → updated preview.
- **After Stage 7:** EP002 can be automatically assembled into a complete review film using existing unchanged SHOT renders.
- **After Stage 10:** General-purpose production-ready workflow for regular episodes and Shorts.

## Implementation rules for all agents

1. **One operating system:** use existing MediaOS, GitHub-managed Remotion code, ElevenLabs, PostgreSQL and Render Worker. No parallel voice agent or manual editing pipeline.
2. **Creative flexibility:** scripts and direction can be revised freely. Saving must never trigger paid calls without separate confirmation; retain all old text and media versions.
3. **Director owns taste:** automated QA is technical; do not claim automated creative sign-off or publish a film without approval.
4. **Protect canon:** EP001 locked assets stay protected. EP002 original Script v4.0 and Visual Pass v1.0 remain immutable references; production editing creates new versioned artifacts.
5. **Safe generated code:** agent changes require scoped permissions, controlled GitHub workflow, build/tests, review gates and rollback, not raw unreviewed production execution.
6. **Render incrementally:** reuse unchanged SHOTs, while detecting cross-SHOT and shared asset/transition dependencies.
7. **Evidence-based status:** report DONE only after actual end-to-end verification; distinguish prototypes, implemented APIs and finished functionality.
8. **Director-centric UI:** work with narration, voice, HEAR → SEE, render preview and revision feedback in one connected SHOT experience.
9. **Current production technology:** fully programmatic Remotion rendering and automated video/audio assembly. Do not propose legacy scene editors or manual editing software.
10. **Plan governance:** only explicit Director approval changes priorities or roadmap version. Individual creative edits do **not** require roadmap locks.

## Immediate next task

**Stage 1 — Unified Production Data.** Define and validate the canonical episode/SHOT identity, script revision, preferred voice take, actual duration, approved HEAR → SEE beats and render provenance for EP002 SHOT01. Then advance to the Stage 2–4 vertical slice. Do not require repeated verification of the Director-confirmed Voice and HEAR → SEE functions.

## Source-of-truth precedence

For future agent planning, this Roadmap v1 supersedes outdated product tooling statements in the original README and historical planning documents. Historical files are retained for audit but must not dictate the current technical stack. Original episode sources govern their own editorial content; this roadmap governs **future product architecture**.
