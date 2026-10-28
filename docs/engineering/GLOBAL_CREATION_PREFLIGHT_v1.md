# MediaOS Global Creation Preflight v1 — Operational Contract

**Date:** 2026-10-28
**Implementation branch:** feature/global-creation-preflight-v1-20261028
**Purpose:** The Director requires MediaOS to consult known rules, engineering best practices, approved work and durable project memory *before creating anything*, so past mistakes do not recur.

## Source of authority and precedence

1. Explicit Director LOCKs and the approved episode-specific Truth Map / scope.
2. Canonical Remotion-first creation rules in `project_creative_policy.payload.canonicalCreationRules`.
3. Required project-level and correctly scoped episode Production Memory rules.
4. Already approved reusable components, voice assets, shots, maps and camera/motion grammar.
5. Current review proposals / DRAFT notes (useful context, **not** permission to supersede a LOCK).

This is a **precondition and context loading gate**, not an assertion that generative model output is semantically correct. Script validation, visual QA, director review and media-level QA remain mandatory.

## Covered operations

- A global `OncePerRequestFilter` runs on all state-changing `/api/v1/**` endpoints (POST, PUT, PATCH, DELETE), including editor, Director, creation, render-queue and memory writes.
- `ProductionMemoryService.preflight(scope, action, episodeId)` checks the required global rule, current canonical policy overlay, matching episode row, approved Remotion asset catalog and Director shot locks; it writes `production_preflight_audit` with the result.
- Background `EpisodeBuildService` stages re-run preflight on each scheduled TRUTH, SCRIPT, SCENE and HANDOFF step, even if their initial HTTP request was audited earlier.
- Script/Scene/Director and autonomous Topic/Truth Agent contexts include current policy and appropriate Production Memory (not merely a copy of the last conversation).
- Stage-specific existing lock rules, source Truth Map, voice alignment, deterministic Remotion validation and Director approval remain separate gates.
- No existing EP001 LOCKED asset is modified by this rollout. Key EP001 locks are now queryable as runtime memory through V83.

## Fail-closed behavior

- A missing or malformed canonical policy, missing required global rule, invalid episode, failed DB read or failed audit write blocks the operation.
- API responses use HTTP 409 for policy/context conflicts or HTTP 503 when required context cannot be retrieved.
- An `X-MediaOS-Preflight` response header identifies the audit record for permitted writes.
- A `CONTEXT_READY` result means the rules and memory were loaded. It is **not** `SEMANTICALLY_APPROVED`; the latter would require separate type-specific artifact validation.
- Explicit `X-MediaOS-Episode-Id` values different from the currently hardcoded EP001 ID are rejected rather than accidentally applying EP001 memory while writing another episode.

## Known limitations / release blockers

1. **Episode scoping:** Several existing APIs still use static EP001 IDs. This v1 intentionally **rejects** explicit cross-episode API writes instead of pretending EP002 is supported. A true EP002–EP005 episode-aware data model and endpoint migration is a separate prerequisite before using those legacy routes for additional episodes. Once a second episode exists, implicit EP001 routing is denied.
2. **Semantic compliance:** Neither a filter nor an AI prompt can mathematically prove arbitrary script/diagram correctness. Dedicated artifact-level validators and Director approval remain necessary; a rules-loaded audit is not a quality verdict.
3. **Full historical ingestion:** V83 seeds key Director decisions into runtime memory. Not every historical GitHub production event has been transformed into structured DB rules; those events must remain consulted during specific episode planning and be indexed/validated over time.
4. **External agents and direct writes:** The filter covers backend HTTP entry points and the known autonomous EpisodeBuild runner. It does not cover undocumented external GitHub or DB mutations. Any external direct database writes, standalone GitHub operations or future worker creation routes must be instrumented separately, and must not be declared covered without tests.
5. **Deploy:** The implementation must pass Maven CI and Director review before merging/deploying. Flyway V82–V85 will run at backend deployment; verify DB policy, audit records and API behavior in staging before production. Preserve a tested rollback for backend code; Flyway migrations are forward-only.

## Pre-production verification

- [ ] GitHub Actions Java 21 `mvn clean verify` passes, including 8 filter tests, the isolated PostgreSQL migration test and both static registry/memory-ID consistency checks.
- [ ] Run the automated isolated-Postgres-18 integration test (full Flyway V1–V85 history), followed by a separate staging migration dry-run from current production version V81. Verify V82–V85 complete.
- [ ] POST creation with canonical policy and memory returns success and a valid audit id, with `passed=true`.
- [ ] Disable required global memory rule in staging; verify HTTP 409 and audit `passed=false`.
- [ ] Remove the canonical overlay in staging; verify fail-closed HTTP 409.
- [ ] Simulate a DB outage; verify HTTP 503 rather than unaudited creation.
- [ ] Attempt an explicit EP002 write via legacy EP001 routes; verify HTTP 409.
- [ ] Test an autonomous EpisodeBuild step after the initial HTTP request; verify a distinct preflight audit.
- [ ] Check original EP001 render IDs, video hashes, narration and thumbnail against Director locks.
- [ ] Confirm planned UI requests / worker callbacks are not inadvertently blocked by CORS or lifecycle changes.
- [ ] Review per-artifact semantic QA outputs and approve rollout explicitly.

## Director-level invariant

**NO AUDITED, CURRENT CANONICAL CONTEXT → NO NEW PRODUCTION ARTIFACT.**

The current implementation enforces context readiness; no one should confuse that with a guarantee of no errors in model-generated content.
