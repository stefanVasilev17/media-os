# MediaOS — Director Start, Git/voice-bound no-dispatch release gate

**Date:** 2026-11-04
**Scope:** production backend + imported EP003+ episode UI; no modifications to EP001/EP002 Remotion source, existing Takes or approved narration.
**Authority:** complements the Director-LOCKED Roadmap v1 and existing FILE → VOICE → BUDGET → PREPARE → VERIFY order.

## Delivered contract

For one prepared EP003+ **whole-episode** job, the Director may record exactly one explicit Start approval after a new server-side **live Git** and **current voice** manifest verification. The approval is an auditable **NO DISPATCH** receipt; it does not invoke an LLM, write a PR, start a render or transition a job to RUNNING. This is an operational release-gate prerequisite, **not yet actual code generation**. The future paid worker must have its own pinned model/pricing, usage reservation, provider reconciliation, exact Git/base recheck and safe PR/compile gate.

The read-only Git + all-SHOT manifest remains PR #173. New endpoint:

- `GET /api/v1/episode-packages/{packageId}/execution-jobs/{jobId}/director-start`: Director-only; 204 when no receipt, or immutable receipt including revocation state. No external paid calls.
- `POST /api/v1/episode-packages/{packageId}/execution-jobs/{jobId}/director-start/approve`: authenticated Director with required `MEDIA_OS_CREATION_PREFLIGHT` audit ID; request UUID, exact `productionInputSha256` and pinned Git commit and two explicit confirmation flags. This re-runs the original live Git verification from PR #173 **on the server** before writing.
- UI: existing Imported Episode → Multi-SHOT Job → Review Reusable Assets & All SHOT Plans → Verify live Git & build batch manifest → Approve exact batch for future AI Start. Actual button is disabled for blocked manifest or a previously recorded receipt.

## Server-side safety

Approval is only allowed if:

1. Prepared job is owned by the authenticated Director, in `PREPARED_NO_DISPATCH`, with matching immutable package/source/readiness SHA and approved episode-local new code directory.
2. Prior single-use Director AI budget grant was consumed by this exact prepared job, is unexpired, and its source/voice hashes match. Absence or exhaustion blocks.
3. No OpenAI attempt is recorded for the job, including reserved or UNCERTAIN attempts.
4. On-demand live Git evidence verifies the exact trusted private repo `main` commit and 15 historical Director-reviewed components, shared files and protected EP002 source hashes.
5. All current voice takes/revisions, measured durations, cue timings, asset identities and file targets match the existing ALL-SHOT manifest. Unknown/new or review-required assets remain **blocked** until a future explicit asset decision mechanism is implemented. A successful Git connector read in ChatGPT is not evidence that Railway has GitHub authorization.
6. The Director request carries the exact current manifest digest + commit and explicit consent; any mismatch yields 409 with **no persisted approval**.

PostgreSQL Flyway **V118** adds immutable `episode_multi_shot_director_start` rows with unique `job_id` and `request_id`, Director actor and audit ID, original source + voice + Git + assets fingerprints, approved SHOT count and `APPROVED_NO_DISPATCH`/ `REVOKED` state. Identical request UUID replay is idempotent; differing IDs/hashes never authorize a second approval. Cancelling the prepared job revokes its receipt in the same transaction.

The job and tasks NEVER transition to `RUNNING`, the provider dispatch configuration and `canStartAgent` remain false, and the existing V117 usage ledger still rejects spending without an independently authorized running worker.

## Known blockers / status boundary

- The repository is private. Railway production backend had no `MEDIA_OS_GITHUB_READ_TOKEN` variable at the previous documented inspection. Without expressly provisioned read-only GitHub permission the live HEAD+blob check fails closed and **no Director Start approval is possible**. Never copy ChatGPT connector credentials into Railway or weaken this gate.
- No actual OpenAI client/model/pricing, code generator, GitHub scene PR, isolated Remotion compile, render or master assembly yet. No new provider spend may be inferred from a recorded approval.
- A source or voice change after this approval must cause the future worker to recheck all hashes and block until new scoped consent. Never let a stored receipt authorize future source drift.
- No unrelated historical `UNCERTAIN` ElevenLabs transaction is changed. Provider call reconciliation remains separate.
- Browser-level Director QA with a real imported episode requires an actual fully voice-ready EP003+ package and server GitHub read permission.
- A controlled build must separately verify Java 21 Maven tests, TypeScript/Vite and V118 migration. Until those checks run, the feature is **committed but NOT build-verified/deployed**.

## Next milestone

Price-pinned, metered Multi-SHOT Code Worker with separate **live paid-dispatch authorization** and exact dependency replay; explicit Director asset decisions for currently unregistered/review-only primitives; generated proposal validation, isolated Remotion TypeScript checks, scope-limited GitHub branch/PR, and controlled Director merge/render review. Do not mark Roadmap Stage 4 or Universal Episode Factory complete based solely on this gate.
