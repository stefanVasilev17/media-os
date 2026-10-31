# EP002 Director Overview — 11 SHOT index restoration (QA only)

**Date:** 2026-11-01 (Europe/Sofia).  
**Episode ID:** `95b8a4a2-728e-47fe-ad4c-a16748773588`  
**Scope:** QA backend only, `EpisodeDirectorOverviewController`; no user media or content writes and no production deployment.  
**Source commit:** `b31ae7ab3553c29ec937e859b901717288e8f8cc`.  
**Deploy:** Railway QA backend deployment `f54ac8a0-b8d4-41dd-b4f0-3bece072634f` — SUCCESS.

## Reported symptom

Director screenshots showed all three native Research, Script, and Scene stages LOCKED while the Director Overview displayed `0 of 0 Voice locked`, `0 of 0 Video locked` and `No shots have been added.`

## Root cause verified in code and QA PostgreSQL

The EP002 approved Script stage stores `timeline[].shotKey = SHOT01, SHOT02, ..., SHOT11` (no space), matching the locked English voice manifest. The old Director Overview backend parser accepted only `SHOT 01` (with space). It silently skipped all the valid Script timeline entries. No separate `studio_shot` row existed to compensate, but that does not mean the Script and Scene assets were absent.

One-time, read-only, non-secret QA PostgreSQL probe verified:
- `SCRIPT` is **LOCKED rev1**, 11 unique shot keys `SHOT01`–`SHOT11`.
- `SCENE` is **LOCKED rev1**, 11 corresponding keys `SHOT01`–`SHOT11`.
- Native Scene `originalSourceGitBlobSha` = `5c43c7fd3bd66b5899f0956a9cfd80bdead834f1`, exact previously Director-approved Visual Pass v1.0 blob.
- The issue was read-model normalization, **not** a lost artifact, missing creative lock, missing narration, or need to create 11 duplicate database SHOT records.

## QA-only code correction

- Accept compact and separated keys through `^SHOT\\s*([0-9]{1,3})$` and normalize output to canonical `SHOT 01` through `SHOT 11`; keep strict bounds and reject unrelated identifiers.
- Derive display-only `startSecond/endSecond` from already-approved `editorialStart/editorialEnd` when integer second fields are absent; pass through approved voiceDirection.
- Enrich matching Script-derived SHOTs with exact `SCENE` `visualPlanMarkdown` **only if native Scene is LOCKED**. Do not create shots from unmatched visual entries.
- Preserve all normal voice/visual approval checks. **Voice/video statuses remain PENDING** until independently verified and approved; no fictitious take/clip or render records are written. `voiceVideoWriteReady` for EP002 remains false (episode-scoped generation is a separate task).

## Checks

- Isolated Maven / JUnit `EpisodeDirectorOverviewControllerTest`: **4 tests, 0 failures, 0 errors**, including compact `SHOT01`, separated `SHOT 01`, invalid keys, and exact approved 00:00–13:30 editorial time parsing.
- No database migration or scripted change to `production_stage`, `voice_shot_workflow`, `voice_clip_workflow` or `studio_shot`.
- Final Railway services: QA backend, QA Postgres and QA Remotion worker all SUCCESS, zero staged/pending changes. Production backend, Postgres and render worker SUCCESS, not deployed in this operation. Temporary CI and read-only database probe services were removed without attached volumes.

## Director acceptance

Open https://qa-media-os-backend-qa.up.railway.app/#/episodes/95b8a4a2-728e-47fe-ad4c-a16748773588/director in the already-logged-in Safari browser and tap **Refresh**. Expected result: **11 SHOT entries** and `0 of 11 Voice locked · 0 of 11 Video locked`. The renderer will show canonical `SHOT 01` through `SHOT 11`, each original approved title/narration and the underlying Scene choreography. Actual authenticated browser visual confirmation is still pending.

**Next genuine production gate:** make EP002 episode-aware Voice Take generation/review actually available rather than calling EP001-only legacy endpoints. The existing EP002 Voice and Video pages explicitly report generation not available yet. Avoid pretending that the native Scene LOCK creates approved audio or makes Remotion production ready.
