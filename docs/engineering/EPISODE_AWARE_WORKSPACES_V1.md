# MediaOS — Episode-Aware Workspaces v1 (Draft / QA release gate)

**Date:** 2026-10-28  
**Branch:** `feature/episode-aware-workspaces-v1-20261028`  
**Authority:** Director request: EP002–EP005 must have separate memory, scripts, approvals and reuse references. Existing EP001 scene/audio/master/thumbnail LOCKs must never be modified by this transition.

## Architecture

The existing MediaOS schema already has `episode_id` on most creative tables. However, EP001-specific controllers and their async worker routes still use `ProductionOverviewService.EPISODE_ID` as a constant. Replacing every reference at once is dangerous and would incorrectly scope current render jobs.

Therefore the migration is **strangler-style and fail-closed**:

1. Keep the existing `/api/v1/creative`, `/api/v1/voice`, `/api/v1/remotion`, `/api/v1/studio` and Director legacy handlers unchanged and EP001-specific. An explicit EP002 header must be rejected.
2. Create `/api/v1/episodes/{episodeId}/…` with **URL as the trusted episode identity**. If an episode header is also supplied and differs, the global filter blocks it before execution.
3. `POST /api/v1/episodes` is **project-level creation**; it uses the EP001 project audit anchor because the new episode row does not exist yet. It never reuses an EP001 scene or voice ID.
4. Each new episode starts as `DRAFT`, with independent `RESEARCH/SCRIPT/SCENE/VOICE/VISUAL/QA/PUBLISH` stages. No initial locks are inherited.
5. Episode-memory corrections remain tied to the intended episode, whereas canonical project corrections apply across all episodes.
6. Reusing an approved component creates a row in `episode_asset_reference` (reference only, never a copy/replace of locked bytes), requiring the global asset catalog to mark the component `LOCKED`.
7. Every Research/Script/Scene draft uses an expected revision (optimistic concurrency). Director locking additionally requires an explicit approval decision, review note, meaningful artifacts, and locked upstream stage(s). Voice/Visual cannot be locked through these generic routes.
8. New revisions and decisions append to existing `production_stage_revision` and the new `episode_workspace_event` ledger, including preflight audit IDs.

## Default safety

Both settings are **false** by default:

- `MEDIAOS_EPISODES_WRITES_ENABLED=false`: blocks all new workspace changes.
- `MEDIAOS_EPISODES_CREATION_ENABLED=false`: additionally blocks creation of new episodes.

These toggles should stay OFF in production until explicit Director go/no-go, episode-specific paid-AI authorization, worker routing and frontend selection workflows have been tested. Do not assume a new project episode exists just because it appears in a strategy draft.

The new episode navigator `#/episodes` is **read-only**, and explicitly does not redirect the EP001 Script/Voice/Visual editors to newly selected episodes.

## Endpoints

| Verb | Path | Purpose |
|---|---|---|
| GET | `/api/v1/episodes` | Enumerate real episode records |
| GET | `/api/v1/episodes/{id}` | Read episode identity |
| GET | `/api/v1/episodes/{id}/context?scope=ALL` | Effective policy, rules, assets, stages and shot LOCKs |
| GET | `/api/v1/episodes/{id}/stages` | Independent stage/revision status |
| GET | `/api/v1/episodes/{id}/memory` | Only project + that episode's corrections |
| GET | `/api/v1/episodes/{id}/assets` | Assets used in this episode |
| POST | `/api/v1/episodes` | Gated creation of a new DRAFT |
| POST | `/api/v1/episodes/{id}/stages/{research\|script\|scene}/draft` | Write a new reviewed draft revision |
| POST | `/api/v1/episodes/{id}/stages/{research\|script\|scene}/director-lock` | Explicit Director approval with schema/upstream checks |
| POST | `/api/v1/episodes/{id}/assets/{assetKey}/reuse` | Link existing approved Remotion asset |
| POST | `/api/v1/episodes/{id}/memory` | Save episode-specific correction |

Every POST requires the existing audited `GLOBAL_CREATION_PREFLIGHT`. A URL/header mismatch is blocked before the controller. The draft/lock APIs do not generate AI content: AI cost authorization and script/scene agent routing will be a later scoped cutover.

## Current limits (no overclaim)

- Legacy EP001 production flows still use fixed EP001 constants; a second episode cannot safely run on the legacy visual/voice/AI orchestration endpoints. The current global preflight rejects ambiguous legacy writes once a second episode is present. Do not enable episode creation in production until that issue is addressed.
- The initial episode navigator is read-only. It surfaces isolated contexts; it does **not** make the old editors multi-episode.
- Developer-level Director approval is a request shape and audit trail, not strong human authentication. Do **not** enable writes in an untrusted environment until real authorization is applied.
- Research/script/scene structure checks are a prerequisite, not a substitute for actual technical truth checks and editorial QA.
- A generic asset registry may contain source components but cannot prove they are safe to render in an unrelated frame layout; per-shot QA remains required.
- No EP002 source snapshot, locked stage, production video or release plan is created automatically by this PR.

## QA acceptance

1. Java `mvn package` and frontend `npm run build` pass.
2. Run Flyway V86 against an **isolated Postgres 18** clone; confirm V85 history remains intact.
3. With writes disabled, all POST episode mutations fail closed; EP001 context GET remains intact.
4. In QA with toggles enabled, create EP002 DRAFT; assert 7 initial stages, no inherited locked status and no inherited EP001 memory.
5. Write Research draft, reject invalid early Director LOCK, approve complete Research LOCK, write Script draft; reject Script draft until Research LOCK.
6. Reject wrong-header episode identity; block new asset names not present in approved catalog.
7. Check immutable EP001 source/voice/render/thumbnail checksums from its separate Director records, not from new workspace tables.
8. Record QA evidence in PR, do not merge or deploy until Director review.

**Invariant:** every future episode has an independent causal Truth Map, explicit Director decisions, and auditable context before any creative write. No fallback from EP002 to EP001.
