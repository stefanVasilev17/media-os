# MediaOS — PR #110 Production Readiness / NO-GO — Live QA Evidence

**Checked:** 2026-10-31  
**Scope:** latest security/episode-aware application `feature/mediaos-prod-mvp-security-20261031`, pinned QA commit `2731837df1ebb0f3fee07bdf01bb6ae188870870`; Railway QA `MediaOS-Shot-QA-20261031`; current production `MediaOS`.  
**Director intent:** prepare a safe production release so EP002 can use its own MediaOS ElevenLabs voice workflow, with EP001 immutable.  
**Release decision:** **NO-GO** for production at this point. This is a technical release gate, not an objection to the Director's explicit desire to deploy.

## Read-only verified environment observations

| Area | Fact verified by connected GitHub/Railway tools |
|---|---|
| Production backend | `media-os-backend` is SUCCESS from `main`, last successful application build commit `e6d1520b4551926c61780c475a01e4e8b8562cd2` (2026-10-28). |
| Production DB and renderer | PostgreSQL and `media-os-render-worker` deployment statuses SUCCESS; no pending Railway production patch. No new release was deployed. |
| QA backend | `qa-media-os-backend` SUCCESS at pinned PR #110 commit `2731837df1ebb0f3fee07bdf01bb6ae188870870` with separate `qa-postgres` (PostgreSQL 16.15). |
| QA schema | Backend startup log validates **103 Flyway migrations**, current schema version 103 and no pending migration. |
| QA auth surface | HTTP access logs show `GET /api/v1/auth/mode` and `GET /api/v1/auth/csrf` returning 200, and some QA login/session test requests returning both expected 401 and successful 200. This does NOT certify real mobile Safari, actor approval, or session lifetime. |
| QA CPU render worker | Existing `qa-remotion-cpu-worker` is deployed, but `POST /api/v1/remotion/renders/worker/claim` returned **401 Unauthorized 273 times** in the retrieved Railway HTTP log window; two 403 and one 502 were also visible. This is not a passing live render workflow. |
| QA scoped workload identities | One-time **read-only** SQL transaction in QA PostgreSQL returned `QA_AUDIT_CREDENTIAL_COUNTS []` and `QA_AUDIT_REMOTION_CPU_METADATA []`. No rows existed in `mediaos_worker_credential`. The endpoint demands a valid scoped worker token + matching worker ID plus legacy worker key; merely placing a client environment-variable name cannot create a matching database credential. |
| QA content | The same read-only query returned only `episode_number=EP001`, `status=IN_PRODUCTION`; no QA EP002 episode had been created. |
| Temporary diagnostic tool | One-time QA read-only Railway Function was deleted after verification; **no QA database writes**, and no production configuration or GitHub source code were changed by the diagnostic. |

## Security conclusion

The QA backend is healthy, schema is up-to-date and local authentication endpoints respond; nevertheless the **worker path fails in practice** because scoped credential provisioning is missing. **Do not fix this by weakening the worker security filter, deleting authorization checks, bypassing the Director gate, exposing secrets in GitHub, hard-coding an unrestricted worker bearer token, or reverting EP001 locks.**

No real production release should be attempted merely by pointing the current production backend to PR #110 or redeploying the existing older `main` build. The former would publish a still-unaudited worker/auth system; the latter would not deliver the EP002 workflow.

## Remaining gates in exact recommended order

1. **QA worker identity issuance (isolated QA only).** Use the existing `WorkloadCredentialOfflineAdmin.issue` in an audited transactional administration procedure; use an independently generated high-entropy token, matching stable worker ID, `REMOTION_CPU` scope and controlled expiration (5 min–24 h), no plaintext token in source/history/logs. Distribute the token through the QA secret store, ensure both current legacy key and scoped identity match, and prove `claim → progress → complete/fail`. A token's configured variable *name* is not evidence of an issued active credential. Because the maximum credential validity is 24 hours, define secure rotation/renewal for long-running production workers before go-live. Do not provision an operator identity from chat.
2. **Director authentication acceptance.** Using a separate disposable Director account and never real EP001/production credentials, run real HTTPS mobile Safari, CSRF and session persistence/expiry flows. Existing automated tests do not replace this acceptance gate. Verify negative access and revocation.
3. **EP002-only complete workflow acceptance.** Generate a disposable EP002-like episode, import/verify the already Director-LOCKED original script instead of paying to re-create it, preserve all 11 versions and exact narration, test one approved shot Voice take and native audio metadata, then test new-episode render callback and human Video acceptance without using EP001 media. Do not spend ElevenLabs credits until separately authorized for the specific isolated test.
4. **Production release candidate.** Review stacked PRs #100–#110 and exact commit with a clean build, production-schema-copy Flyway V94–V103 rehearsal, backup/restore rehearsal, EP001 immutable asset and DB checks, explicit secrets/flags matrix and actual rollback steps for the application's code; additive migrations must be accounted for.
5. **Director release GO/NO-GO.** Obtain explicit approval of the tested release candidate and sensitive configuration. Merge/promote only that tested commit. Deploy backend/UI and CPU worker in compatible order, verify new production Director session, verify worker claim operations, and preserve EP001 locked outputs. Keep Paid AI and media generation flags off until independently approved.

## Separate Director creative truth

EP002 `Why Login Fails Even When the Server Is Healthy` has a **GitHub Director FINAL SCRIPT LOCK**, eleven individual SHOT LOCKs and approved original English narration in branch `feature/ep002-director-shot11-script-lock-package-20261031`. This editorial LOCK must **not** be mistaken for MediaOS production database-stage LOCK. The production MediaOS episode table previously contained only EP001; no automatic import or episode creation occurred.

## Prohibited assertions

- Do not say PR #110 is deployed to **production**; it is pinned in a separate **QA** environment.
- Do not say one successful QA backend startup proves real video/voice rendering.
- Do not say Flyway V1–V103 in QA is equivalent to a production schema-copy migration rehearsal.
- Do not claim a completed iPhone test, a registered scoped worker credential, a production EP002 row, generated EP002 audio, or a passing CPU render workflow.
- Do not change production Railway source, environment flags, credentials, or database until the blockers above are satisfied.

**Present outcome:** root cause of worker 401 is concretely diagnosed; QA and production remain isolated; **NO production deploy performed**.

## Verified QA follow-up — 2026-10-31, after scoped worker-auth activation

**Progress: QA CPU worker empty-queue authentication is now PASS.** New QA backend deployment `ea0324b8-c1dc-4792-854b-146a5a2718b5` reached **SUCCESS**, with the QA worker `6415a3e5-4e09-4594-9e97-c6f5b0ddc411` also **SUCCESS**. Backend HTTP logs show **ten successive `POST /api/v1/remotion/renders/worker/claim` responses of `204 No Content` from 20:00 to 20:09 UTC**, compared with previous `401` responses before deployment. This verifies machine authentication and empty queue polling; no render job or video was created.

**Cause and correction:** The scoped credential token hash, worker ID and QA backend/worker legacy keys had matched, but `MEDIAOS_WORKER_AUTH_ENABLED` was `false`. A QA-only change enabled it, while keeping `MEDIAOS_LOCAL_AUTH_ENABLED=true` and `MEDIAOS_DIRECTOR_SECURITY_ENABLED=false`. An audit-linked, short-lived `REMOTION_CPU` QA token was already issued with the correct scope/ID; it expires at **2026-11-01 07:40 UTC** and is NOT a sustainable production rotation scheme. No filter/allowlist was weakened. QA worker's legacy key now uses a Railway reference to the QA backend's existing variable.

**Independent public HTTPS negative probe results (QA only):** `GET /actuator/health` **200**, `GET /api/v1/auth/mode` **200**, `GET /api/v1/auth/csrf` **200**; anonymous `GET /api/v1/security/session` **401**, anonymous `GET /api/v1/episodes` **401**, anonymous `POST /api/v1/remotion/renders/worker/claim` **401**, and anonymous `POST /api/v1/episodes/{id}/shot-revisions/SHOT01/render-qa` **401**. This establishes basic public security boundaries, **not** a completed authenticated iPhone/TOTP/CSRF/session lifecycle test.

**Remaining blocker before real CPU-render acceptance:** the documented `AT-EpisodeShot-QA` storyboard intake requires a **separate, disposable EP002+ episode** with properly Director-approved Script/Scene stages, locked current shot revision and approved voice take. QA currently has no such ready fixture. Never run a legacy EP001-bound composition as a substitute or bypass Director-gated creation and voice approval by inserting ad hoc production records. Test the approved intake route and CPU `claim → progress → complete → secured retrieval` only after the disposable episode has passed those gates. Voice generation could use ElevenLabs credits and needs its own approved test authorization.

**Release decision remains NO-GO** for production pending genuine disposable render, secure worker credential rotation beyond 24 hours, HTTPS real-device Director acceptance, production-schema-copy migration rehearsal with rollback, and final Director release approval. All temporary Railway QA diagnostic/probe functions were deleted. Production services and EP001 protected assets remain unchanged.

## Additional verified QA — Director login, true video rendering and backup/restore (2026-10-31)

**Scope guard:** This section describes three isolated real tests. It does **not** claim full MediaOS Director-approved E2E media pipeline acceptance, production migration replay, iPhone Safari acceptance or production release.

### Real QA Director HTTPS login and CSRF smoke — PASS

- A disposable Railway QA-only Function made real HTTPS calls to the running local Director implementation using **existing QA bootstrap account credentials/TOTP via private Railway variable references**. No password, TOTP secret, TOTP code, cookie value, CSRF token or session identifier was logged or committed.
- Results: `GET /api/v1/auth/csrf` **200**, `XSRF-TOKEN` cookie present, `GET /api/v1/security/session` before login **401**, password+TOTP `POST /api/v1/auth/login` **200**, authenticated `GET /api/v1/security/session` **200**, authenticated `GET /api/v1/episodes` **200**, authenticated `PUT` to an intentionally **nonexistent episode ID** without CSRF header **403**, `POST /api/v1/auth/logout` **200**, session after logout **401**.
- The negative write path targeted a nonexistent UUID deliberately, so it could not accidentally modify an episode even in the event of a CSRF regression. No content creation occurred. Function deleted following verification.
- **Not verified:** real iPhone/Safari cookies/UI, idle timeout expiry, account lockout and offline recovery/rotation.

### Real Remotion independent MP4 smoke — PASS

- Independent disposable Railway QA **build-only** service from isolated Git branch `qa/ep002-render-engine-smoke-20261031` at commit `af91a70b61da134083738daa1bbc0da12a4ab9ff`; build deployment `d3231842-9ebb-4bfd-8b0e-b65b0feafe28`.
- Its `Dockerfile.episode-qa-render-smoke` bundles the source, invokes real Chromium/Remotion H.264 renderer on the new `AT-EpisodeShot-QA` composition with *synthetic* new-episode props, then probes the output file with **FFprobe**, checking every metric before logging `QA_RENDER_SMOKE_COMPLETE=PASS`.
- Verified: `QA_RENDER_SMOKE_COMPOSITION=PASS`, `QA_RENDER_SMOKE_MP4=PASS`, H.264, 1280×720, **150 video frames at 30 fps = 5 seconds**, **36,059 bytes**. Generated MP4 was deleted in the build. The temporary Railway service was deleted after reading passing build logs; this did **not** write an EP001/EP002 media asset or call the backend, voice provider, or database.
- **Security triage:** the image's npm prune output included **“10 high severity vulnerabilities”** from installed Node dependencies. This is not an exploit assessment; an audited dependency report is required before production release. No dependency modifications were automatically made.
- **Not verified:** actual authenticated MediaOS episode-scoped queue submission, CPU `claim → progress → complete` on a real queued task, authenticated video retrieval, or final EP002 creative output. The existing episode-aware `render-qa` contract requires an authenticated Director, explicit QA flag, native Script+Scene+Shot LOCK and an approved source voice take. Do not bypass these with ad hoc rows in the persistent QA app or invent Director voice approval.

### PostgreSQL QA backup/restore rehearsal — PASS

- A one-time **QA-only** PostgreSQL 16 client container connected to `qa-postgres.railway.internal` with QA secret references, explicitly refused any unexpected source DB name/host, and used `pg_dump -Fc` to snapshot `media_os_qa` without modifying it.
- Restored into independently created `qa_restore_smoke_20261031` database, verified identical **episode count=1** and Flyway `max(installed_rank)=103`. Logged `QA_DB_RESTORE_DUMP=PASS`, `QA_DB_RESTORE_IMPORT=PASS`, `QA_DB_RESTORE_VERIFY=PASS`, `QA_DB_RESTORE_SMOKE_COMPLETE=PASS`.
- Temporary database was dropped via exit cleanup, and a separate read-only SQL verifier returned `QA_RESTORE_TEMP_DATABASE_ABSENT=true`. Both temporary Railway services were deleted. The active QA database, production database, production services and EP001 assets were not modified.
- **Not verified:** actual *production-schema-copy* upgrade from prior live Flyway state (e.g. V93) to V103, production backup restoration, production cutover rollback or permission tests on the production dataset.

### Updated release gate

**QA auth and standalone technical renderer are PASS. Production remains NO-GO.** The remaining critical work is (1) native end-to-end Director-approved disposable episode QA render/secure retrieval with no false LOCKs; (2) sustainable secure worker credential issuance/rotation (temporary token expiry 2026-11-01 07:40:36 UTC); (3) real-device iPhone Safari Director auth acceptance; (4) isolated **production-copy** Flyway V94–V103 migration + rollback rehearsal and backup validation; (5) npm dependency advisory triage and (6) explicit tested-release Director approval. No PR merge or production deployment was performed in these QA tests.
