# MediaOS QA Remotion CPU Credential — Execution and Expiry Audit

**Date:** 2026-10-31. **Environment:** Railway `MediaOS-Shot-QA-20261031` / `qa` only. **Status:** Scoped QA credential **ISSUED**, backend+CPU claim confirmation pending subsequent request / no production go-live.

## Background

The isolated QA backend at PR #110 commit `2731837df1ebb0f3fee07bdf01bb6ae188870870` had 103 validated Flyway migrations and active worker-auth security, but Remotion CPU worker polling returned 401. The earlier read-only diagnostic found zero rows in `mediaos_worker_credential`.

## Execution / verified results

1. Inspected Java credential contract (`WorkloadCredentialService.verify` and `WorkloadCredentialOfflineAdmin.issue`): a SHA-256 ASCII digest for a 43–128-char token, exactly matching worker ID, scoped `REMOTION_CPU`, active flag and valid expiry; append-only `ISSUED` audit with change ticket.
2. Confirmed using **one-time QA read-only Railway Function** with pre-existing private environment variable references: configured worker token is valid shape, configured stable worker ID is valid, QA database configured. No tokens or passwords were printed. Read-only query returned `CREDENTIAL_COUNTS=[]`, `RENDER_STATUS_COUNTS=[]` (no render rows/jobs), and schema migrations present.
3. A narrowly scoped **one-time QA issuer** ran in a single SQL transaction against disposable QA Postgres, checked exactly one QA episode row and **zero render jobs** and **zero prior credentials** before allowing the write, then inserted **one** `REMOTION_CPU` active hashed credential and the matching `mediaos_worker_credential_audit` `ISSUED` event with ticket `QA_WORKER_20261031`. No existing EP001 row was updated; no token was returned in logs. Errors roll back the transaction.
4. Railway deploy log confirmed `QA_ISSUER_SUCCESS scope=REMOTION_CPU`, audit `ISSUED`, zero jobs and expiry at **2026-11-01 07:40:36.667504 UTC**. **12-hour temporary lifetime**, not a durable production rotation mechanism.
5. The ephemeral QA Railway Function was **deleted immediately** after success, including its temporary environment-variable references. No production Railway variable, service, database, GitHub branch `main`, EP001 locked asset or voice was changed.

## What is NOT yet proved

- Ingestion of new worker claim calls **after** the issue timestamp: the prior latest observed `401` was **19:40:18 UTC**, before credential issuance (19:40:36 UTC); it is not a regression result. Observe the next worker claim after 19:40:36 UTC and require an allowed `204` / empty job or other expected authorized response before declaring the worker path fixed.
- Real claim → progress → complete/fail: no queued renders exist, so this requires a separately approved disposable QA episode/render fixture and controlled execution.
- Real HTTPS iPhone Safari and session/login lifecycle, production-schema-copy migration rehearsal and final EP002 voice routing: separate gates.
- Credential expires 2026-11-01 07:40:36 UTC. A 12-hour token is **not** production-ready. Define credential rotation/renewal without echoing secrets, preferably using the audited Java offline CLI on an operator-controlled terminal with database backup, worker halt and secure recovery. This trial used an isolated temporary QA transaction with matching validation/audit but does **not** claim an execution of `WorkloadCredentialOfflineCli` or full offline maintenance runbook.
- No production deploy was made. PR #110 remains Draft/NO-GO until all remaining release requirements are met.

## Immediate QA continuation

Read the QA backend HTTP log for `POST /api/v1/remotion/renders/worker/claim` after the issuance time and the worker runtime log. If the claim is no longer 401, mark credential contract proven for an *empty queue*. Then separately prepare an authentic one-shot QA render fixture and expiry/rotation test; do not use EP001 assets.

**Operational caution:** credential metadata in QA is auditable and short-lived, but do not copy QA credentials to production, don't commit them to GitHub or chat, and do not weaken the default-deny Spring Security rules.

## Live QA root cause and configuration correction — 2026-10-31

- After initial issuance, the first worker poll still returned HTTP **401**. A separate **read-only database SHA-256 / worker ID** comparison proved the stored active `REMOTION_CPU` credential's token digest and worker ID both match the current QA worker environment references. The worker ID is `mediaos-qa-cpu-worker-01`; the credential remains unexpired and has exactly one `ISSUED` audit entry.
- A secure comparison of the two QA legacy worker keys returned **MATCH** without displaying either secret.
- The decisive QA backend configuration finding was **`MEDIAOS_WORKER_AUTH_ENABLED=false`**, while local Director auth was true and external Director security false. Under these settings `WorkloadSecurityConfiguration` is inactive and the local session filter does not authorize the CPU worker endpoint. This explains why a valid credential by itself did not end the 401s.
- Updated **only the isolated QA worker** to reference the QA backend's existing legacy key via Railway reference; its new deployment `6415a3e5-4e09-4594-9e97-c6f5b0ddc411` reached SUCCESS, with existing authentication still intact.
- Staged and committed the QA backend configuration change **`MEDIAOS_WORKER_AUTH_ENABLED=true`**; deployment `ea0324b8-c1dc-4792-854b-146a5a2718b5` was triggered. **Do not mark fixed until the new deployment is SUCCESS and at least one *post-deploy* CPU `/claim` request returns its expected successful empty-queue response.**
- Refrain from using prior `401` samples as evidence against the new backend because they were recorded before the new runtime became live. No security guard was removed or disabled.
- This operation is **QA-only**, never production, and does not authorize EP002 media generation or a production release. The temporary 12-hour QA credential expires on 2026-11-01 at 07:40:36 UTC; renewal/rotation and genuine disposable render QA remain open gates.
