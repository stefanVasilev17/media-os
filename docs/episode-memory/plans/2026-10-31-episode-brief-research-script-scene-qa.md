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
- Staging security review required before enablement (authentication, CSRF/origin, rate limits, audit identity).
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
