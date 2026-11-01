# MediaOS — EP002 VOICE MVP, Remotion-only video workflow

**Date:** 2026-11-01  
**Status:** build-only QA candidate, NOT production deployed. Requires separate Director approval for cutover.

## Current technology decision — source of truth

**Spline is retired from active production. It must not be planned, developed or used for EP002 or future videos.** This overrides older design, render and Spline worker notes. The active plan is:
- **MediaOS** — Research, source-locked Script, Hear/See, episode/SHOT workflow, Director LOCK, Voice and approval.
- **ElevenLabs** — EP002 narration, using identical locked EP001 cloned narrator voice/model and a mandatory listening review for acoustic continuity.
- **Remotion** — future video visuals, animation and rendering after Voice milestone.
- **PostgreSQL** — episode stages, approvals, audio, timing alignment, budget/idempotency ledger.

Old Spline-related database records and endpoints remain legacy compatibility only to preserve EP001. **Do not erase, migrate, relabel, re-render, or overwrite EP001 content**. Legacy code in the main repository does not mean that Spline is still in the production plan.

## Minimal deployable Voice build

- `frontend/src/VoiceMvpApp.tsx`, `frontend/src/voice-main.tsx`, `frontend/voice.html`, and `frontend/vite.voice.config.ts` define a separate EP002-only UI bundle. The entry does not import Spline or render-worker pages. It permits only a genuine episode number `EP002` to open the prepare/director/revision/voice/video screens, blocks EP001 mutation in this UI and leaves native server checks in place.
- `Dockerfile.voice-mvp` packages the dedicated UI and the existing Spring Boot application into a **Java 21 only runtime**. No Chromium, Node render worker, Remotion renderer or Spline runtime is in the resulting runtime filesystem.
- The Spring Boot JAR still includes existing Java controllers and legacy schema: do **not** claim this bundle deletes all Spline-related source/backend routes. It only removes the Spline interface/render binaries from the active Voice deployment image.
- `Dockerfile.qa-ep002-voice-mvp` uses disposable local PostgreSQL 18 to smoke-test the exact Voice UI build, Spring Boot, Flyway V106, anonymous API denial, paid ElevenLabs denial and zero ledger requests. No Google credentials, no production DB and no paid provider calls.
- A full video/render workflow is explicitly *out of scope* for Voice MVP.

## Production cutover constraints

Current production backend is still `main` / Flyway V85, with one EP001 and zero EP002 episode rows at the last direct read-only audit. Draft PR #112 includes a much larger V86–V106 migration. **Do not deploy the new Voice image pointing to the live production database alongside the old backend without an explicit compatibility rehearsal**: Flyway version drift, shared schema and Google worker API routing need a coordinated cutover, not blind dual running.

The already-running production Remotion CPU worker is not automatically compatible with Google Director security when scoped worker auth is disabled; with scoped worker auth enabled, it requires the updated worker source, a valid job-scoped/worker-scoped credential and rotation. The minimal Voice JAR can run independently on a disposable QA database, but **a production deployment must not orphan ongoing EP001 Remotion renders or disrupt API endpoints**. Choose a reviewed routing/separation strategy and rollback before any production database migrations.

## Director-gated sequence

1. Keep production `main` and EP001 unchanged; verify production and QA service health.
2. Complete exact pinned frontend dependency lockfile and security/dependency audit for the Voice image (existing `frontend/package.json` still has floating `latest` values and a build-time legacy Spline dependency; these are *not* runtime UI imports).
3. Rehearse V85→V106 from a fresh production copy, immutable EP001 checksums and rollback. Preserve a fresh external backup.
4. When Director is ready for actual access, configure Google OAuth (not before). Verify credentials, allowed Google subject, SameSite/CSRF, logout and forbidden-user denial.
5. Deploy a protected production build with creation, broad writes and paid voice flags OFF by default. Coordinate old worker routes and source, or use an approved isolated service architecture with no shared-database version conflict.
6. Create EP002 workspace from a real Director session, then review/LOCK Research. Import original Script v4.0 and Hear/See v1.0 drafts, explicitly LOCK them in production; QA approvals are not automatically prod approvals.
7. Only after explicit paid authorization, set EP002-only Voice flag, generate exactly **one** SHOT 01 take through the V106 ledger, compare acoustic identity with the published EP001, then Director approves manually.
8. Remotion visual development starts **after** Voice acceptance, as a separate milestone. No Spline tasks or dependencies should be listed as blockers.

## Honest status

This work provides a **new isolated Voice-only build and a reproducible QA acceptance test**, not a production Voice Studio at a public domain. Until Google, release security and native production locks are complete, the project remains NO-GO for paid EP002 TTS. Even after successful smoke tests, production safety depends on worker routing, DB upgrade/backup, and Director approval.
