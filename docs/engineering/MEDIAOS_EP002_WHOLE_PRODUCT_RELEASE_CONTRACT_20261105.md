# MediaOS — EP002 Whole-Product Release and Director Acceptance Contract

Date: 2026-11-05
State: **UNVERIFIED DEVELOPMENT CANDIDATE** — no merge, no Railway deployment, no real end-to-end EP002 production.

## Product definition

MediaOS is one Director-operated product, not separate unconnected prototypes. The long-term supported workflow is:

1. Director + ChatGPT finish English Script and complete HEAR → SEE visual storyline; the Director LOCKs the source.
2. Export **one Episode Package** file into MediaOS; MediaOS prepares every SHOT and the editable working narration and Voice Studio work queue.
3. Director uses ElevenLabs to generate/review/approve each current Take. The platform stores measured audio duration and genuine alignment (or explicitly reviewed, separately consented alignment recovery) for all corresponding visual beats.
4. MediaOS builds **one episode-wide visual continuity and reuse plan** with canonical Architectural Thinking world/style, approved shared assets, history of corrections, and per-SHOT current voice fingerprints.
5. Codex Cloud subscription is used **ONLY to implement Remotion visuals**, with **one SHOT per task**. Every task must read the latest trusted Visual Constitution, reviewed Lessons Ledger, adjacent accepted scene and exact selected audio cues before coding. EP002 begins at SHOT02 and preserves original SHOT01.
6. Each code task produces one narrowly scoped GitHub PR. MediaOS verifies the actual merged file and source SHA against trusted GitHub main, checks matching compiled Worker inventory, then after **separate CPU approval** queues a real synchronized preview. The Director watches the actual 1920×1080 MP4, requests local corrections if needed and explicitly accepts the finished SHOT. Only then is the next SHOT eligible.
7. MediaOS assembles the genuine full Master from the accepted SHOT renders and creates at least three 1080×1920 Shorts, with correct audio and deliberate reframing. Final master/shorts review, durable downloadable storage and Director approval are required before COMPLETE.

The product is not accepted until **one real EP002 episode** completes all seven steps with real source/voice/render artifacts, all required review evidence, and no invented successes or unauthorized spending.

## What the integrated EP002 development branch contains

- Existing EP002 voice-first whole-episode readiness (#187) + sequential SHOT preflight (#189).
- Existing Visual Constitution + append-only approved-lessons policy (#188).
- Audited source-bound Director correction notes in PostgreSQL V121 (#190).
- New PostgreSQL V122 for individual SHOT02+ Director review evidence. SHOT01 remains immutable and is not re-generated or re-approved via V122.
- Source/policy GitHub verifier: checks exactly ONE EP002-generated TSX diff, trusted merged PR, current main blob and latest four rule files. Fail closed if private GitHub access is absent.
- Accepted-SHOT guard: checks actual current voice, narration dependency SHA, real measured cue frames, matching Worker build and source SHA, an actual successful readable Remotion MP4, and two explicit Director review acknowledgments before any SHOT approval can be written.
- Sequential preflight now reads recorded accepted SHOTs from the DB and advances one slot only when source/MP4-bound reviews exist.
- Single tabbed **EP002 Production Factory Console** replaces multiple disconnected dashboard panels: Episode+Voice, Next Remotion SHOT, Director Corrections, Verified Preview Acceptance.
- Unit/security/isolated-PostgreSQL migration tests have been authored, but **NOT executed**. GitHub Actions are disabled and no source runner is available via the active GitHub connector.

## Unfinished release blockers — mandatory, not optional

1. **Real EP002 voice-cue bridge**. The original Visual Pass v1.0 has 59 approved editorial beat directions, not 59 verified exact spoken anchors. The current EP002 readiness deliberately returns zero fully verified timed SHOTs. Implement and QA Director-reviewed cue-anchor capture and real ElevenLabs selected-Take verification; never invent timestamps, reuse stale recordings, or retry the unresolved historical paid alignment.
2. **Actual EP002 one-SHOT Codex task/envelope**. The deployed V119 whole-episode Codex workflow is EP003+ only. Build a bounded episode-local SHOT task, with exact rule SHA, selected Take and verified cue frames, and a scoped PR review. Codex cannot be triggered programmatically by MediaOS using the ChatGPT subscription; the Director submits tasks in Codex Cloud.
3. **Actual EP002 SHA-pinned scene worker**. Factory worker currently reports scenes=0 for EP003+ and does not compile the new EP002 SHOT02..11. Provide protected mixed legacy SHOT01 reuse plus generated scene registry for SHOT02..11, with continuity, authentic voice and non-bypassable render claims. Do not edit approved SHOT01.
4. **Real asset-safe CPU-controlled preview**. New V122 approval deliberately fails closed until Worker and render input props include the expected Git commit, code blob and policy digest; current V120 worker is not proof that EP002 has this support.
5. **Durable large-video storage** for genuine 1080p long-form Master and three Shorts, with Director-approved cost/security and access. The current 256 MB per-render PostgreSQL BYTEA cap is not adequate for production long-form deliverables.
6. **Real test and release evidence**. Java21 Maven test suite + isolated PostgreSQL migration + frontend TypeScript/Vite + Remotion/Node checks, independent source SHA inspection, then approved Railway deployment and authenticated Director browser QA. No GitHub Actions, no paid provider calls without separate authorization.

## Invariants

- EP001 original successful-login 12 SHOTs, EP002 Script v4.0, approved Visual Pass v1.0 and protected SHOT01 v3 are immutable.
- No false claim that a created branch, a PR, an approved voice, an MP4 render, or an imported file is a finished video.
- Do not enable Railway worker render claims, deploy, merge, issue API credits or modify protected media without applicable Director authorization.
- Do not spend Codex quota on Java/Spring Boot/React/SQL tasks.
- All correction memory becomes globally authoritative only after Director accepts the actual evidenced visual fix; never automatically promote unverified agent feedback.
- An accepted SHOT alone does not publish any YouTube output.
- A source or selected Take change must stale its relevant dependent output or prompt. Earlier accepted unrelated renders should be reused only with verified dependency fingerprints.

## Review order

Test unified branch in independent Java/Node/Postgres runner, validate all dependent PRs' behavior together, and resolve failures before any merge. Treat the consolidated PR as the preferred review candidate; older stacked Draft PRs are historical development increments, not separate product releases. Do not update PROJECT_STATE.md with a completed milestone until real tests and deployment QA exist.

The **product**, not the PR count, is the unit of acceptance.
