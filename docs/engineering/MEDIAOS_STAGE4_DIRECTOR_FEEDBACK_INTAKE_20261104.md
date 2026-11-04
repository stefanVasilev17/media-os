# MediaOS Roadmap Stage 4 — Director Feedback Intake v1

**Date:** 2026-11-04 (Europe/Sofia)
**Scope:** First implemented vertical slice of Stage 4 (Director feedback intake), **not completion of the AI Director Revision Loop**.

## Product decision and current baseline

Director approved and LOCKED EP002 SHOT01 visual v3 (see `MEDIAOS_EP002_SHOT01_VISUAL_DIRECTOR_LOCK_20261104.md`). Preserve all approved EP001 assets, the two SHOT01 TSX source files, the 09:00 TimeRail state, selected Take 2 and its five real ElevenLabs character-timestamp cues. Prior preview remains available. The previous Director-directed coding loop was manually orchestrated in ChatGPT via GitHub/Railway; that is **not yet** an in-app automated agent loop.

Stage 4 requires an in-app request → authorized scoped agent code change → tests → updated MP4 → Director review. This first slice implements request capture with verifiable render provenance, no automatic execution.

## Implemented in this PR

- **PostgreSQL V112 additive migration:** `ep002_director_visual_feedback` stores UUID idempotency ID, EP002/SHOT01, verified source `remotion_render` FK, scene contract, selected voice take, script revision, dependency SHA, area, feedback, lifecycle state, verified Director identity and timestamps.
- **New Director-only API** `GET/POST /api/v1/creative/episodes/EP002/shots/SHOT01/director-feedback`: verifies authenticated Director membership; validates selected current voice and scene contract; requires a **SUCCEEDED render joined to trusted EP002 SHOT01 lineage**; enforces 12–3000 characters, a narrow change-area whitelist, and an explicit understanding of the existing visual LOCK. POST is idempotent on client UUID and checks matching content and actor on replay. Feedback never executes code. List is read-only and scoped to the Director and EP002 SHOT01.
- **Frontend panel:** visible under EP002 SHOT01 Remotion Scene Blueprint. Choose visual change area, enter precise correction, explicitly acknowledge visual LOCK, save request against successful preview, view latest requests/status. A local UUID is retained across uncertain network errors for safe replay. The UI states that saving does **not** invoke OpenAI, GitHub agents, ElevenLabs, Remotion or paid render.
- **Unit tests:** Director visual LOCK acknowledgement, permitted area enumeration and length/bounds, without invoking any external provider. Full Railway backend build executes Maven tests + frontend TypeScript/Vite compilation; integration authorization/query tests require an isolated PostgreSQL test environment and must not be claimed as verified if skipped.

## LOCK and paid-call guards

**Do not** interpret a saved feedback request as an authorization to modify SHOT01, merge a code PR, deploy, produce an MP4 or regenerate voice. It is a ticket **pending separate agent execution and Director source-change authorization**. The status `PENDING_AGENT_REVIEW` is accurate. Keep this a read/write review inbox only.

No GitHub Actions; no new permanent QA infrastructure. No changes to approved SHOT01 files, locked EP001 sources, original EP002 v4.0 script or Visual Pass v1.0. No ElevenLabs or auto-Remotion calls.

## Next Stage 4 increments still required

1. A permission-bounded **agent executor** consuming one validated feedback ticket, resolving target Remotion source and approved visual lock state; propose exact file diffs, never arbitrary shell execution from text.
2. GitHub branch/PR creation with source HEAD checks and immutable provenance; tests and required security/scene contract lint; Director approval before code promotion.
3. Controlled Railway build/deploy of accepted scoped changes; new preview only on explicit Director-approved Railway CPU use. Link proposal commit and render ID back to feedback ticket, preserve history and locked prior versions.
4. Director reviews v2 MP4 in the same panel and explicitly accepts/rejects new scene. Do not declare Stage 4 DONE until an end-to-end in-app execution is independently verified.

**Current visual state:** SHOT01 remains Director-LOCKED. Narrator dialect parity to EP001 remains separately unresolved; no automatic TTS.
