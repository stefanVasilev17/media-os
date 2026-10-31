# MediaOS EP002+ — Episode Brief → Research → Script → Scene

## Purpose
Provide an episode-scoped intake that connects a Director-written brief to the EXISTING MediaOS hybrid deterministic/AI agents, rather than extending the legacy EP001-only automatic build service. The backend owns process logic, OpenAI generates proposals, deterministic rules validate structural outputs and the Director alone LOCKs.

## User journey
1. Open **Episodes** (descending order); choose **+ New Episode**. Only title, idea/brief and optional source notes. No noisy metadata, tags or nested cards.
2. Next number is proposed from project episodes; the backend rechecks unique episode number. Director clicks **Create Episode**. Backend writes a separate Episode Brief plus standard Research/Script/Scene/Voice/Visual/QA/Publish stages and isolated agent threads. Existing lesson-review gate stays in force.
3. New episode opens **#/episodes/{uuid}/prepare**. Episode Brief is editable with optimistic revision, only BEFORE Research has any draft. Legacy EP001 brief/approvals cannot be changed.
4. **Research & Truth**: Zero-token Preview, then explicit paid Generate DRAFT with one-use preview token; correct episode UUID and first-pass rules are mandatory. OpenAI proposes a Truth Map, not verified facts. Supplied sources remain labeled unverified.
5. Director reviews Research, attaches missing technical sources manually without another paid generation if needed, and explicitly locks Research with a meaningful note. Sources are still NOT automatically fact-checked; Director must verify them. Existing Research lock requires centralQuestion, viewerPromise, 3+ truthMap entries, outOfScope and technicalSources.
6. **Script**: Reuse existing episode-scoped Script Agent. It cannot run until THIS episode's Research is LOCKED. Zero-token preview, explicit paid run, deterministic schema checks, Director review + LOCK.
7. **Scene / Video Plan**: Reuse existing episode-scoped Scene Agent. It cannot run until THIS episode's Script is LOCKED. Produces SHOT-by-SHOT production plan as DRAFT; Director LOCK follows. No Remotion render, ElevenLabs call or automatic asset creation.
8. Episode Selector continues to show only Episodes descending, with green border when all stages and all shot voice/video are LOCKED (already existing behavior in PR #108).

## Code
- V93 creates `episode_brief`, one source brief per new episode with revision, source notes and traceability.
- `EpisodeWorkspaceService`: validated idea/sources, next-number suggestion, transactional create, controlled brief revision, rejects legacy EP001 edits.
- `EpisodeWorkspaceController`: `GET /episodes/next-number`, expanded POST Create, `GET/PUT /episodes/{id}/brief`.
- `EpisodeBuildAgentClient.auditTruthForEpisode`: reuse existing strict TruthAudit JSON and rules, but for requested EP002+ UUID rather than hardcoded legacy EP001.
- `EpisodeResearchAgentService`: gated with `mediaos.episode-research.enabled=false`, audited preview token, one paid Research call and AI usage ledger, normal DRAFT only. Tokens bound to brief SHA, brief revision, Research draft revision and first-pass fingerprint.
- `EpisodeResearchAgentController`: scoped preview/run and no-token audited manual source corrections.
- `EpisodeNewPage`, `EpisodePreparationPage`, episode preparation API, navigation and quiet CSS.
- Script/Scene implementation is reused, NOT cloned.

## Security / operational gates
- **Draft PR only**; no deployment, no DB migration, no live OpenAI requests.
- `mediaos.episodes.creation-enabled=false`, `mediaos.episodes.writes-enabled=false` and `mediaos.episode-research.enabled=false` by default. Paid AI OFF is an additional independent safeguard.
- A global preflight audits all writes and binds the URL episode to actual episode context. RESEARCH run additionally requires a valid single-use authorization from preview (5-minute expiry), live first-pass hash and ledger capture; no paid reruns/repairs.
- Research preflight never uses `EpisodeBuildService.startCurrentEpisode`; that service remains EP001-only.
- Staging security review required before enablement (authentication, CSRF/origin, rate limits, audit identity). GitHub Actions will not be used for this project unless the Director later explicitly changes that decision.
- Source URL strings are unverified Director-supplied leads; OpenAI is **not** browsing the web, and source verification is **not** performed by this PR. Director must inspect references and resolve uncertainties before approving truth.
- No automatic generation of Voice, no Remotion build, no new asset creation, no Director auto-LOCK.

## Verification requirements before merge
1. Build Java 21 Maven backend and frontend TypeScript/Vite; Flyway V93 against PostgreSQL staging.
2. Create EP003 from a valid 20+ character idea; check title, GUID isolation, initial stages, source/version, complete absence of EP001 mutations.
3. Duplicate episode numbers fail with 409. Brief updates succeed only at the matching revision before Research starts.
4. Paid AI OFF causes Research Preview to return no token; run is rejected. No AI usage charge on a failed preflight.
5. Research preview token cannot be reused or transferred to another episode, brief revision, Research revision or memory rules fingerprint.
6. Research output with missing fields cannot be silently locked; no AI-created or fabricated technical citations.
7. Add sources manually to a Research DRAFT; ensure it increments revision, blocks stale tokens, does not call OpenAI and requires renewed Director review.
8. Director LOCK Research enables existing Script Agent Preview; Script LOCK enables existing Scene Agent Preview; no downstream generation from an unlocked upstream.
9. Existing and newly locked EP001/EP002 scripts, voice takes, images and Remotion renders remain unchanged.
10. Do not interpret lexical overlap or inherited rule presence as semantic verification of truth.
11. Regression tests for EP001 protection, default-off gates, source provenance, brief validation, stage dependencies and UI episode isolation.
12. Smoke test clean UI visually at 1440px and mobile: no badges, microcopy, noisy panels or hidden primary action.

## Known limitations
- The new episode number is suggested from the database but not allocated under a global monotonic lock; concurrent requests are controlled by the existing unique constraint, with a conflict response.
- Historical EP001 does not get a new Brief retroactively.
- Source notes supplied later amend Research DRAFT only, not the original Brief. Both are versioned.
- Actual proof-of-source retrieval, technical citation checking, end-to-end autonomous multi-stage chaining and fully automatic Voice/Remotion production are separate future steps. This version intentionally preserves Director approval between Research/Script/Scene.

## 2026-10-31 QA execution status — source review and regression additions

**Executed so far:** GitHub repository/source review, API-contract inspection, structural consistency checks on modified files, and commit of new backend and frontend regression test cases. **NOT executed:** Maven `verify`, TypeScript/Vite build, Flyway V93 on PostgreSQL, browser rendering, integration tests or a real API model request. There were no recorded GitHub Actions runs for this draft head when checked. Do not present this draft as QA-passed or deployment-ready.

**Critical findings fixed in draft:**
1. `EpisodeWorkspaceService` was accidentally duplicated and contained malformed SQL during early development. Rebuilt from the clean parent branch, preserving one copy of preexisting workflow methods. Full compile remains needed to verify.
2. Research Preview compiled one First-Pass rule package but the paid agent recomputed it with a different subject. Now the identical preview-bound appendix is passed unchanged into the OpenAI request, so selection and fingerprint correspond.
3. Research could finish an OpenAI call after the Director modified the source brief, saving stale facts. New `draftResearchForBrief` holds a database row lock and refuses a mismatched brief revision in the same transaction as writing the Research DRAFT.
4. An AI Research proposal with an empty out-of-scope boundary, or with no source references, could leave Director LOCK blocked. The UI now supports no-token, Director-authored boundaries and references before a new LOCK attempt.
5. The initial Script/Scene preparation UI offered fresh generation and lock but not scoped revisions. It now uses the existing REVISE mode, explicit original-correction text, independent Preview and paid confirmation.
6. Added Vitest tests for episode isolation, scoped agent routes and exact Preview/run messages, and Java tests for default-off write guards, brief validation and no unverified citations presented as verified.

**Remaining blockers before any deployment:**
- GitHub Actions are deliberately not in use by Director decision. Do not trigger or recommend them. Verify Java 21/Maven, Node 22/TypeScript/Vite/Vitest and PostgreSQL/Flyway using local or explicitly authorized isolated QA tooling.
- Authenticate Director operations with real user identity; global creation preflight is not authentication. Add rate-limits, CSRF/origin enforcement and director review audit identity.
- Validate that Java 21 compilation and all dependent Draft PRs #100–#108 are compatible, especially prompt assembly and Production Memory migrations.
- Confirm live database schema supports V93 and that the new FK and table are created in migration order.
- Research has **no trusted live source retrieval**. A human must independently verify every reference before locking; a source string and model confidence are not proof.
- Research correction and Script/Scene revision drafts must be inspected visually and QA-checked for semantics; structure alone does not guarantee truthful content.
- Avoid testing by enabling paid AI in production. Use isolated, disposable staging episode IDs only after the owner approves budget and access controls.

**Release decision: BLOCKED — retain Draft status.** Neither prior LOCKed media nor production PostgreSQL is touched by this QA review.

## 2026-10-31 additional QA findings / run blocker

- Episode listing now emits `hasBrief`; older EP001/EP002 rows without the new V93 brief are routed to their Director Overview rather than opening a broken new-episode preparation page. New episodes use the new preparation route only when the V93 source brief exists.
- Three-field legacy `EpisodeWorkspaceService.create(number,title,auditId)` keeps its default-off write gate and rejects creation without a Director Brief. No empty-brief rows are permitted.
- A simple Research artifact or a list of source URLs is NOT fact-checking. The Director must inspect evidence and explicitly LOCK. Revision source changes are checked transactionally.
- Director explicitly declined GitHub Actions on 2026-10-31. The temporary branch-specific `push` filters were reverted, leaving workflow files identical to the parent branch. Do not enable GitHub Actions, add CI triggers, or request manual workflow runs for this MediaOS work.
- Validation must use alternatives **without GitHub Actions**: Java 21/Maven local or isolated runner, Node 22/npm build and Vitest, PostgreSQL/Flyway against disposable local/QA database, then isolated end-to-end checks. Do not deploy to Railway or run paid OpenAI calls unless the Director authorizes them.
- Railway project `MediaOS-Preflight-QA-20261028` was inspected read-only; it does not expose a deploy-ready backend QA service for this branch. No Railway resources were created, changed, deployed, restarted, or billed by this QA review.
- Release remains **BLOCKED** pending successful Java21/Maven tests, TypeScript/Vite build, Flyway migration and isolated staging end-to-end validation; ensure no live OpenAI use, production DB mutation or Director LOCK updates while evaluating.

## Director QA policy — no GitHub Actions

The Director explicitly does not want to enable or use GitHub Actions. **No GitHub Actions activation or CI run is required, expected or recommended**. The same quality gates apply via alternative execution: compile Java 21, run Maven tests, compile TypeScript/Vite, run Vitest, and verify Flyway migrations against a disposable PostgreSQL database, all with no production writes. Until those checks execute, the PR stays DRAFT and release stays BLOCKED. Do not create or modify infrastructure without Director approval.
