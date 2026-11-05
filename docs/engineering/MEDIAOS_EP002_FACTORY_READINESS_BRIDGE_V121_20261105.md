# EP002 → Unified Factory: Voice-first Readiness Bridge v121

**Date:** 2026-11-05
**State:** DRAFT PR implementation. Not merged, not deployed, not end-to-end tested.
**Director objective:** EP002, not EP003, is the first real all-episode MediaOS production acceptance target. Preserve the existing Director-LOCKED SHOT01 and original approved materials.

## Verified canonical inputs

- EP002 English Script v4.0 is DIRECTOR_LOCKED: 11 SHOTs, 810 seconds **editorial** duration (not measured audio).
- EP002 Visual Pass v1.0 is DIRECTOR_APPROVED_GITHUB: 59 editorial HEAR → SEE beats across the same 11 SHOTs. Its pinned historical Git blob is the existing Ep002ProductionContractService.VISUAL_SHA.
- Ep002EpisodeBatchPlanService already resolves current saved working revisions, Director-preferred Takes, measured durations where stored, and valid SHOT01 render lineage. It has no source-code executor and cannot generate a film.
- The existing SHOT01 Remotion source and supporting readable-phone component remain protected. No script, approved visual or Remotion source is modified here.

## New read-only integration boundary

- Director-only GET /api/v1/creative/episodes/EP002/factory-bridge.
- Ep002FactoryReadinessBridgeService takes one repeatable-read snapshot of the existing EP002 Batch Planner, re-reads exactly matching current working narration revisions and hashes, loads the locked original script and Visual Pass, and validates all 11 ordered SHOTs, 59 beats, 810-second editorial plan, one protected visual and ten proposed scenes.
- Each SHOT returns the original approved visual instructions/beat list, current working narration and voice direction, exact active narration SHA, selected current-revision Take ID (if one exists), saved measured duration, *provisional frame count only when measured*, render/reuse status and explicit blockers.
- SHOT01 has existingScenePath but **no** proposed source path. SHOT02–SHOT11 have proposal-only exact paths under remotion-engine/src/episodes/ep002/ShotNNGeneratedScene.tsx. No code is written.
- Existing IN_FLIGHT or UNCERTAIN ElevenLabs requests are surfaced as blockers. No new voice, forced alignment, Codex task, API spending, render, deployment or GitHub Action occurs.
- **Fail closed on HEAR → SEE:** the Director-approved visual beats are editorial free-form directions without a measured cue-anchor mapping. A chosen Take or an alignment JSON blob alone is not enough to assert timed beats are verified. This v1 bridge intentionally sets verifiedTimedShots=0, eligibleForCodexCloud=false, canRender=false.
- New read-only panel is visible at EP002 Source Library, immediately after the existing whole-episode Batch Planner, with per-SHOT details and manual refresh. The original EP002 Creative Voice and Batch Planner UI remains available and unchanged.

## Scope and safety boundaries

This is an **intake/readiness bridge**, not the complete production adapter. It does not bypass V120's EP003+ guard or invent an EP002 package ID; it does not register EP002 candidate scene files with the worker and does not route EP002 rendering through V120. This separation is intentional until the protected SHOT01 reuse contract, actual voice timing, GH-scoped audit and real Worker build evidence can be verified.

Review/test checklist for the draft PR:

1. Run Java21 Maven unit tests, including Ep002FactoryReadinessBridgeServiceTest, and the existing EP002 Batch Planner tests. Verify full Spring Boot ApplicationContext startup and frontend TypeScript/Vite build. These tests have **not** been run by this PR author in the available connector runtime.
2. Authenticated Director GET on a non-production test deployment: 11 SHOTs/59 beats, unchanged original source, no saved voice fabricated, and all statuses reflect live PostgreSQL. An unauthenticated/non-Director GET must be denied.
3. Verify that changing current narration between reads fails with HTTP 409, and an unresolved voice ledger state is blocked rather than replayed.
4. Confirm the EP002 source files, Remotion components, EP001 assets, original visual plan, and runtime worker/CPU variables have no diff.

## Next integrated implementation gates

1. **Verified voice and cue map:** move from free-form editorial beats to Director-reviewed cue anchors with actual approved ElevenLabs character timestamps for EP002 SHOT02–SHOT11. Reuse the existing SHOT01 timed-beat logic where the current selected recording supports it; never invent timestamps or retry an unresolved paid alignment.
2. **Protected batch Codex bridge:** one scope-checked Codex Cloud task for ten missing EP002 SHOTs, with immutable batch/source/voice/cue fingerprint and strictly read-only SHOT01. Any generated code needs separate review, tests and PR verification. The existing EP003+ producer may be generalized only with explicit EP002 protections.
3. **Actual film acceptance:** a SHA-verified worker capable of compiling ten new scenes, separate bounded CPU authorization for incremental SHOT renders, confirmed SHOT01 preview reuse, Director review, safe high-capacity media storage, complete 1080p Master and three individually reviewed Shorts. EP003+ remains the later universality test.

Do **not** mark MediaOS end-to-end DONE or update a completed milestone in PROJECT_STATE.md until actual tests, deployment where authorized, and real Director QA pass.
