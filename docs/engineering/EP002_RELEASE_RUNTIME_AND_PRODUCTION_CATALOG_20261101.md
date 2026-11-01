# EP002 Voice Production Cutover — runtime and live catalog evidence (2026-11-01)

## Decision and boundary

**Status: production release is NOT APPROVED / NO-GO.** The existing production backend on `main` remains online. Do not merge Draft PR #112 into `main`, activate Google OAuth, set `MEDIAOS_EP002_VOICE_WRITES_ENABLED=true`, migrate the live database, create episode rows or spend ElevenLabs credits until the Director gives a separate explicit cutover authorization with working login. Google configuration is deliberately deferred by Director.

## Verified candidate runtime — isolated environment

The build-only QA test image packages the **actual EP002 release Java + frontend sources**, boots the backend against its own disposable PostgreSQL 18, and tests the following HTTP and DB results with no provider credentials or production data:

| Test | Result |
|---|---|
| Spring Boot health returns 200/UP | PASS |
| Embedded PostgreSQL Flyway migrations finish at V106 | PASS |
| Compiled frontend index returns 200 | PASS |
| Anonymous `GET /api/v1/episodes` | 403, PASS |
| Anonymous `POST /api/v1/episodes/{id}/shot-revisions/SHOT%2001/voice/generate` | 403, PASS |
| `ep002_voice_generation_ledger` row count | 0, PASS |
| Real Google OAuth sign-in / paid ElevenLabs execution | NOT TESTED, not configured |

The current independent Java and frontend suites previously passed (246 Java tests with 1 opt-in clone skip, 16 frontend tests), and a V85→V106 production-copy rehearsal with EP001 checksum invariants passed earlier. The current runtime image uses no network calls to providers. Initial build failed because this repository does not ship an npm lockfile and `npm ci` is unsupported; the corrected image uses `npm install` like the current production backend. The corrected runtime test passed all markers.

## Verified LIVE production catalog — private read-only SQL only

One-time private Railway production-project service used references to the existing PostgreSQL database, enforced read-only transactions and short timeouts, then queried counts and schema version without printing any episode content, identifiers, secrets or media:
- `PRODUCTION_EP001_COUNT=1`
- `PRODUCTION_EP002_COUNT=0`
- `PRODUCTION_FLYWAY_VERSION=85`
- `PRODUCTION_EP002_CATALOG_READ_ONLY=PASS`

Consequences: **production does not yet have EP002** and cannot be described as running a production EP002 Voice Studio. QA has a genuine Director-reviewed/LOCKED EP002 episode with 11 Script shots, 11 Scene shots, 59 visual beats and truthful preflight/audit lineage; QA locks are **not automatically production locks**.

## Shortest safe execution order

1. **Keep current main running** and review the large PR #112 diff (258 changed files, 540 candidate commits ahead, 2 commits behind main at this audit). Reconcile the two main-only commits. Pin tested commit and worker compatibility; do not blindly merge.
2. At cutover, verify a fresh retained production database backup and ability to restore it. Previous private Railway recovery object is a verified recovery point, not automatically scheduled PITR or off-platform.
3. Create Google Cloud OAuth **Web application** client only when Director is ready. Put ID, secret, approved email and optionally pinned Google subject into Railway secrets without publishing them. Test HTTPS callback, Safari, unauthorized-account denial, CSRF, session/logout and worker routes in preproduction.
4. Stage the exact backend+frontend commit with ephemeral or isolated QA PostgreSQL V106 and verify a real authenticated episode read. Do not use a JWT mock or empty login as substitute for real Google sign-in.
5. Obtain Director authorization for a controlled production release, with inactive episode writes and paid generation by default. Deploy, confirm Flyway V106, EP001 invariants, health and role-based data access.
6. Verify **no existing EP002** before creating it. Create exactly one EP002 workspace via the reviewed Director API with an approved episode brief. Never synthesize Research/Script/Scene LOCKs from QA audit records.
7. Research: bring validated technical facts and explicit scope boundaries into a real production DRAFT, then Director reviews and locks it. Script v4.0 and approved Visual Pass v1.0 are already source-exact import assets in frontend; they are usable against a production EP002 UUID (not QA UUID), only on the correct unlocked upstream stage, and require separate Director native LOCK. **No new AI generation needed.**
8. Keep broad `MEDIAOS_EPISODES_WRITES_ENABLED=false`. Enable `MEDIAOS_EP002_VOICE_WRITES_ENABLED` only after authentication + exact scoped paid approval. The new PostgreSQL ledger refuses duplicate/uncertain requests and limits three stored takes per SHOT.
9. Generate one EP002 SHOT 01 voice take, compare EP001 published narration accent/timbre/pacing, approve manually, refresh and replay. No automatic approval and no EP001 writes.

## Hard blockers / stop conditions

- Google credentials absent by Director choice: **no public paid voice writes**, no production cutover.
- Production currently V85, EP002 count zero: **production workspace not yet created**.
- Worker scoped identity and CPU/GPU compatibility not signed off; release dependency/Remotion advisory review incomplete; pending Director-approved live voice E2E; native stage locks and final Director GO absent from **production**.
- One-time runtime test checks disabled-auth fail-closed, **not** an authenticated Google or live ElevenLabs integration. It does not prove that the full large candidate is safe to merge blindly.
- This workflow does not need Remotion GPU render to generate the first voice take, but any global release must avoid breaking current production worker routes.

**Evidence sources:** PR #112 release gate, child PRs #113–#116, isolated QA runtime build and one-time production read-only SQL logs. No production writes, account bootstrap, paid calls or EP001 modifications were made during this check.
