# EP002 Voice — isolated production canary / cutover contract (2026-11-01)

**State:** safety implementation + QA negative tests only. **NOT DEPLOYED**, no auth credentials, paid ElevenLabs requests, EP001 edits, live production database migrations or Director LOCK actions.

## Why this is the safe architecture

Live MediaOS and its Remotion CPU worker must remain on their current known-good backend and V85 PostgreSQL. Production currently has one EP001 and no EP002. **Never attach the V106 Voice JAR to the live EP001 PostgreSQL**. Its Flyway auto-migration would change the live schema before the new application's authentication could be tested. Upgrading both the backend and worker in place is not required to produce EP002 narration.

Instead, provision a **distinct PostgreSQL 18 instance + distinct private Voice-only Java service**. Copy existing production data once with read-only `pg_dump`, restore to this new empty database and independently migrate the clone V85→V106. The new Voice app reads the approved EP001 voice reference in that copy but never writes EP001. All EP002 writes, approvals, generated takes and the cost ledger reside on the isolated copy. The pre-existing EP001 backend, database, published public domain, and Remotion worker continue running exactly as before. Only after separate verified Google Director login does the Voice service get its own public URL.

## Mandatory pre-start fail-closed gate

`Dockerfile.voice-mvp-isolated` is the only approved canary image. Its entrypoint `ops/release/ep002-voice-isolated-entrypoint.sh` uses read-only PostgreSQL to validate **before starting Java and Flyway**:
- `MEDIAOS_VOICE_CLONE_CANARY_ENABLED=true` and the target host, port, database, username and password are all configured.
- The exact application `DATABASE_URL` matches the dedicated `MEDIAOS_VOICE_TARGET_PGHOST`, `MEDIAOS_VOICE_TARGET_PGPORT`, `MEDIAOS_VOICE_TARGET_PGDATABASE`. The separately configured `MEDIAOS_LIVE_EP001_PGHOST` is different. Do **not** accept an alias or point the canary at `Postgres.PGHOST`.
- A 64-character randomly generated lowercase hex secret `MEDIAOS_VOICE_DB_MARKER` matches exactly one row in `mediaos_voice_isolated_bootstrap` inside the target database; that bootstrap marker **must not exist on live EP001**.
- Exactly one EP001 reference episode exists on the target clone.
- The canary cannot enable worker authentication. Paid EP002 Voice writes, episode creation, and broad episode writes are all refused unless Google Director login has explicitly been enabled.
- Missing or mismatched configuration stops the process before Flyway can run.

**Important:** the temporary bootstrap SQL file is run *only* on the fresh restored copy after verifying `EP001=1`, `EP002=0`, Flyway V85. It is not a Flyway migration and must **never** be executed on the live production database. This creates a one-time marker on the clone before Flyway V106; use a newly generated random 32-byte marker secret, passed via Railway sealed variables / controlled private job, not GitHub or chat. PostgreSQL 18 stores it in a single-row dedicated table. Before final activation, confirm the connection endpoint using Railway's service reference and source target name.

## Strict phased procedure and stop rules

1. **Inventory / freeze.** Record the current live backend and worker deployment IDs, source commit and callback compatibility, Railway service variables **by name only**, production Postgres V85 / EP001=1 / EP002=0, and any queued or running EP001 renders. Do not modify existing services. Existing Railway recovery bucket was present in the earlier audit, but a bucket alone does not prove current recoverability.
2. **Recovery evidence.** Capture a *fresh*, private read-only source `pg_dump --format=custom`; upload to existing recovery bucket, re-download, verify SHA-256, and restore-test on a disposable PostgreSQL 18 instance. Do not print secrets or episode contents. A backup must remain accessible even if the new canary is deleted.
3. **Separate destination.** Provision a *different* Postgres 18 service/volume with a new database and new credentials. Require an empty target, no public TCP endpoint, and no shared volume with live EP001. Verify source and target hosts are distinct and privately resolvable.
4. **Clone without writes to source.** Use a read-only source session with `default_transaction_read_only=on`; restore the dump **only to the empty target**, verify original EP001 voice/model metadata and immutable hashes, and ensure EP002 does not yet exist.
5. **Bootstrap & migrate target.** Create the isolated database marker on target only via `ep002-voice-clone-bootstrap.sql`, then use the protected Voice-only image to apply Flyway V85→V106 **on the target only**. Confirm V106, EP001 checksums, no EP001 changes, no unexpected EP002 row and zero cost-ledger rows. Do not run Flyway against the live source.
6. **Private, no-auth smoke.** Keep the Voice service without a public domain initially; leave `MEDIAOS_GOOGLE_AUTH_ENABLED=false`, `MEDIAOS_EP002_VOICE_WRITES_ENABLED=false`, `MEDIAOS_EPISODES_CREATION_ENABLED=false`, `MEDIAOS_EPISODES_WRITES_ENABLED=false`, and `MEDIAOS_WORKER_AUTH_ENABLED=false`. Verify private `/actuator/health` returns UP, static Voice UI works, all anonymous API reads and paid writes deny, and original backend/worker still render normally.
7. **Google Director access — final interactive step.** When the Director is ready, create an OAuth Web Application in Google Cloud with the new canary's HTTPS callback URL. Pin approved email and stable OIDC subject, store OAuth client ID/secret via Railway secrets only. Test an approved Google account, rejected account, session restoration, CSRF on POST, logout, and Safari. Enabling Google auth before this step will make the Voice service fail startup if credentials are absent.
8. **Create & review.** Create exactly one EP002 workspace in the **cloned** target DB from authenticated Director session; use reviewed EP002 brief, validated Research sources, source-verbatim Script v4.0 (11 SHOTs) and Hear/See v1.0 (11 SHOTs/59 beats). These are DRAFT imports. **The Director must separately approve each stage on the new environment; do not transplant or forge QA LOCK events.** Scope temporary episode creation/write permissions to this controlled phase and turn broad writes back OFF afterwards.
9. **One paid shot.** Keep `MEDIAOS_EP002_VOICE_WRITES_ENABLED=false` until an explicit paid-generation approval. Verify the approved EP001 voice/model IDs match the ElevenLabs runtime. Generate **only SHOT 01** with a new request UUID and durable V106 ledger, listen and compare to EP001. Uncertain paid results must never be auto-retried. Only Director can approve.
10. **Rollback.** If any guard, login, audio parity, resource or safety check fails: disable the isolated Voice service or remove its standalone domain. **Do not downgrade/migrate/restore the live EP001 database**, do not restart the old worker, do not merge release PR #112 to `main`. Retain the isolated DB and ledger for paid request reconciliation; destroy only with separate data-retention approval.

## What staging does and does not mean

A Railway *staged* new service has **no running instance or cost** until staged changes are committed; it is not production deployment or GO. Never commit pending changes automatically. Before accepting any staged changes, verify they do **not update** `media-os-backend`, `media-os-render-worker`, `Postgres` or the existing recovery bucket; only a new dedicated Voice canary and dedicated PostgreSQL resources are permitted.

## Release acceptance — absolute blockers

- New standalone PostgreSQL provisioned, populated **from a verified fresh backup**, and marker bootstrapped; database endpoint proven distinct.
- Protected canary service deployed privately at a pinned tested SHA; V106 and EP001 invariants passed without touching source.
- Verified Google Director login and successful CSRF/session regression.
- Real Director-approved Research → Script → Scene in the isolated production Voice workspace.
- Explicit paid authorization and SHOT 01 A/B acoustic listening review.
- No pending unknown ElevenLabs charges or unapproved wide episode writes.

**Technology scope:** Spline is retired; do not implement Spline features. Remotion video comes later, and the existing production Remotion service remains unchanged throughout this Voice MVP.
