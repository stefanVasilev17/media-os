# EP002 Sequential Codex Visual Preflight — engineering handoff

**Date:** 2026-11-05
**Status:** Draft code-only slice on a branch based on PR #187. Not merged, not tested in a Java/Maven runner, not deployed.
**Policy dependency:** Draft PR #188 adds the versioned visual constitution, append-only lessons ledger and sequential visual protocol. These documents must exist in the checked-out trusted Git SHA before any Codex code-generation task may be used.

## Director decision

MediaOS continues the **one-file episode intake → all-SHOT Voice Studio preparation → whole-episode visual plan → auto final assembly** strategy. Only the Codex **Remotion coding unit** changes from all SHOTs at once to **one SHOT at a time**. Code handoff must read the same visual style and latest accepted corrections before every SHOT. Codex may not consume quota for normal Java/React/PostgreSQL MediaOS engineering.

## Implemented in this draft

- GET /api/v1/creative/episodes/EP002/visual-codex-preflight, Director-authenticated through the existing identity guard, no mutation.
- An immutable read-only view of EP002 factory readiness from PR #187, existing Director-LOCKED SHOT01 as the first visual reference, and SHOT02 as the **only** next candidate. It includes exact output path, approved EP002 visual beats, camera and continuity guidance, current narration revision/hash, selected Take ID and frame count only if measured.
- Six mandatory source references: AGENTS.md, constitution, accepted correction ledger, sequential protocol, original EP002 script and visual pass. Codex must re-read the current copies and report real blob SHAs in its future preflight before code.
- A tested-in-source **pure sequential decision** rejects missing SHOT01 approval, skipped intermediate SHOTs, unknown accepted IDs, mutated protected paths, beat count drift and invalid source snapshots. The *live* endpoint only supplies SHOT01 as accepted because SHOT02+ does not yet have a persisted evidence-backed Director approval record.
- The EP002 Library page shows next candidate, prior accepted visual, follow-on SHOT, all rule references, visual beat details and exact blockers. Refresh is read-only.

## Deliberate blocks

This is a **preflight**, not the final generator. All executable task and dispatch flags are false; executableCodexPrompt is null. Why:
1. Original EP002 HEAR→SEE beats are editorial; actual full-episode confirmed cue frames are not yet present in the EP002 factory bridge.
2. PR #188 policy and ledger blob SHA have not been authenticated by the MediaOS backend (private GitHub access is still a separate consent issue).
3. The next-SHOT Director acceptance ledger is not yet persisted. Files existing in Git are not Director visual approval.
4. V119/V120 Cloud and Worker paths still explicitly protect EP002 from EP003+ factory execution. This PR does NOT change those guards or claim EP002 Remotion generation.

No Codex Cloud task, OpenAI API call, ElevenLabs charge, GitHub Action, Railway CPU render/deploy, code merge, protected component edit or arbitrary auto-advance.

## Review and acceptance required

1. Run Java21 Maven unit tests: Ep002SequentialVisualPreflightServiceTest + Ep002FactoryReadinessBridgeServiceTest + existing EP002 batch tests. Run full backend Spring application-context tests and frontend TypeScript/Vite build using isolated test databases. **NOT RUN here**, because the available connector cannot execute the private repository in a runner.
2. Check authenticated Director GET and reject viewer / anonymous requests; confirm no mutating APIs are exposed.
3. Inspect Git diff: no EP001 assets, EP002 SHOT01 source, protected script/Visual Pass, Remotion engine or Railway production config changed.
4. Review and merge policy PR #188, then merge PR #187 only after its own tests; the branch PR based on #187 needs a compatible rebase onto main before merging. No automatic PR merges.
5. Next implementation: evidence-backed per-SHOT Director approval and immutable source/voice/visual-policy SHA; typed cue anchors verified against selected real ElevenLabs character timing; actual Codex **one SHOT only** prompt from trusted rule files; restricted single-SHOT PR audit and worker registry with Director CPU gates. Do not call these done until real E2E tests pass.

## Safe future workflow

*SHOT02 proposed* → check live policy/ledger SHA and sources → real voice and cue readiness → build short exact Codex Cloud task for SHOT02 only → actual code PR with tests → separately authorized CPU preview → Director approved SHOT02 → append Director-confirmed correction(s) to versioned ledger → SHOT03 reads latest accepted lessons and SHOT02 continuity → repeat through SHOT11 → Master + three Shorts.

The goal is improved visual consistency and reduced expensive rework. Sequential tasks can consume more prompt context than a single batch, so keep mandatory context compact and reuse existing deterministic Remotion primitives first.
