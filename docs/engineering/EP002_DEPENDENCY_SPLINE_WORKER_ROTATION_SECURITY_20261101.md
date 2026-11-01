# EP002 production security review — dependency, legacy Spline GPU and worker rotation

Date: 2026-11-01. **Candidate QA only. NO production deployment, OAuth activation or paid ElevenLabs generation is authorized.**

## Confirmed security findings and fixes

**Bouncy Castle**: `backend/pom.xml` explicitly requested `bcprov-jdk18on:1.78.1`. The Bouncy Castle 1.85 vendor security release fixed multiple 2025–2026 CVEs affecting earlier versions, including CVE-2026-12185 and CVE-2026-8763. Upgrade the isolated release candidate to **1.86**; do not apply this directly to the running production. Regress all Java/PG18 tests and the actual Google TOTP/crypto code before GO. Vendor reference: https://www.bouncycastle.org/resources/new-release-bouncy-castle-java-1-85/ .

**Spline GPU**: V22 legacy `spline_shot_render` links a `production_job` via `shot_id` and **does not store episode_id**. Before this fix, `GlobalCreationPreflightFilter` rejected ambiguous Spline GPU `start` / `complete` / `fail` callbacks once EP002 was created, potentially interrupting already running EP001 jobs. The new branch resolves the render ID in PostgreSQL (same project), confirms its `production_job.task_type='CREATE_RUNTIME_SHOT_V1'`, and preflights explicitly as legacy **EP001 only**. A missing/unknown render or an EP002 header fails closed. This retains existing EP001 Spline GPU jobs under two-episode conditions without pretending to support EP002 Spline workflows. New episode-aware Spline GPU production will require a separate job provenance design and Director approval; do not silently treat legacy jobs as EP002.

**CPU worker token rollover**: existing `WorkloadCredentialOfflineAdmin` issues scoped, audited tokens with maximum validity of 24 hours and explicit external change ticket. The Remotion CPU worker now supports an optional staged `MEDIA_OS_REMOTION_CPU_WORKLOAD_TOKEN_NEXT` along with the existing `MEDIA_OS_REMOTION_CPU_WORKLOAD_TOKEN`. If, and **only if**, an outgoing request authenticated with the current scoped token receives HTTP `401`, the worker retries that one request once with the next token. If this response succeeds, future requests use the next token. **No automatic retries** on `403`, `409`, `429`, `500` or a successful response; especially no duplicate video uploads after an uncertain success. The legacy `MEDIA_OS_RENDER_WORKER_KEY` remains required by the CPU callback controller. A pure Node test proves the rollover/no-retry behavior. No token values are logged or committed.

## Critical limitation: rollover does not mint or schedule credentials

There is **no implemented background credential issuer/rotator**. The 24-hour maximum remains. Production cannot claim unattended self-renewal from this change. A trusted scheduled operator or external secret-management process must:
1. Generate a new independent high-entropy scoped token; use a managed secret store, never chat or GitHub.
2. Call existing offline `WorkloadCredentialOfflineAdmin.issue(..., "REMOTION_CPU", ..., lifetime <=24h, approvedChangeTicket)` in an audited transaction. Use the exact stable `MEDIA_OS_REMOTION_WORKER_ID` configured on worker; the current generated replica ID is unsuitable for a renewal strategy unless pinned.
3. Stage the new secret in Railway under `MEDIA_OS_REMOTION_CPU_WORKLOAD_TOKEN_NEXT` using staged / controlled rollout, not an uncontrolled redeploy. Validate old + new credentials overlap for the same worker identity and scope.
4. At next `401`, permit a **single** safe worker rollover, verify claim/progress/complete/fail and absence of Director privileges, then promote the staged new token to primary and revoke the old DB credential under a separate change ticket. Reconfigure next token in preparation for the following rotation.
5. Alert if no valid replacement exists well before 24 hours. Keep a reproducible rollback to previously authorized worker configuration. Failing over to anonymous or broad Director access is forbidden.

Until a trusted rotation scheduler, Railway secret handoff, expiry warning and rollback are implemented and QA proven, **automated long-running worker authentication remains NO-GO**. This does not prohibit developing EP002 Voice-only features in QA; it does block a full production cutover that turns on enforced scoped worker auth without renewal.

## Other remaining dependency gates

- `frontend/package.json` relies on floating `latest` versions and has no checked-in lockfile. Production builds cannot be assumed reproducible. Pin reviewed dependency versions and commit a verified lockfile before final deployment.
- `remotion-engine/package.json` pins Remotion `4.0.532`; its transitive dependency advisory status and end-to-end EP001 rendering regression are **not cleared** by the Java/Node checks in this PR. Run an actual npm audit plus rendering acceptance against the exact resolved dependency graph.
- Spring Boot parent currently `3.5.6`. Spring Security and Spring Data advisories need an exact resolved-transitive-version check; no sweeping version upgrade is authorized solely by generic advisory lists.
- Actual Google browser login, Safari session/CSRF, ElevenLabs SHOT 01 and live Remotion worker token provisioning remain untested. Director has explicitly deferred Google credentials to the end.
- Do not merge release PR #112 or set EP002 Voice paid flag. Keep EP001 LOCKED.

## QA acceptance evidence to attach

- Java 21 / PostgreSQL 18 all tests including `LegacySplineGpuEpisodePreflightTest` and existing EP001 checksum tests.
- Frontend tests.
- Node `worker-token-rotation.test.mjs`: one 401 rollover only; no retry after 2xx/4xx (other than 401) or 5xx; no alternate/no valid primary refuses retry.
- Repeat production-copy V85→V106 rehearsal unchanged; **no new database migration in this PR**.
