# MediaOS EP002 — Production Release Candidate Gate (2026-11-01)

**Decision: NO-GO — preparation only.** This document is an engineering gate, not a Director approval to merge or deploy. The candidate is `release/mediaos-ep002-prod-readiness-20261101`, derived from the QA branch after PR #111 was merged. Target is `main`; production is the Railway `MediaOS` project and must not be changed until all gates below pass.

## Immutable invariants
- EP001 is immutable: original episode data, SCRIPT/SCENE/Voice/Video Director LOCKs, audio, video, Remotion assets, render history and production memory are not to be rewritten, unlocked or replaced.
- EP002 work is episode-scoped; no implicit EP001 fallback, synthetic Director approval, silently recreated LOCK, automatic paid-generation or fake voice take.
- Release is pinned to an exact tested commit. No auto-merge or unreviewed production deploy. All credentials remain in the secret store, never source, logs, GitHub comments or chat.
- QA/staging and production databases are distinct. A test migration on a disposable DB does not prove production upgrade safety.

## Evidence collected on 2026-11-01

| Check | Evidence | Status |
|---|---|---|
| Existing Flyway files | Compared all 85 migration blob SHA values against `main`: 85 identical, none removed or edited | PASS (source integrity only) |
| Added migrations | Exactly V86 through V105, 20 new SQL files; initial source review finds additive tables/columns, no explicit data-rewrite statements | SOURCE REVIEW ONLY |
| Railway production | Backend online, last deployment `7d9a4a6e-db69-4f1b-9ddd-d8c9db86165c`, source `main`, no staged patch | PASS (baseline availability only) |
| Railway QA | Backend/worker/Postgres online and separate; QA EP002 Voice 409 regression resolved (PR #111) | PASS for observed QA page |
| Current release diff | QA candidate versus `main`: 519 ahead, 2 behind, 225 changed files at kickoff; final exact PR diff must be rechecked | REVIEW REQUIRED |
| Unit tests | Previous isolated QA Docker build for Voice fix: 226 Java tests, 0 failures/errors, 28 skipped; frontend 15 passed | PRIOR EVIDENCE ONLY |
| Production Director login | Production backend environment contains no `MEDIAOS_LOCAL_AUTH_ENABLED` or `MEDIAOS_DIRECTOR_SECURITY_ENABLED` | BLOCKED |
| Production recovery snapshot | Read-only production dump uploaded to private Railway S3 bucket, downloaded back and SHA-256 verified; isolated PostgreSQL 18 restore and V85→V105 Flyway validation PASS; 817,308,076 bytes | PASS (one-time recovery copy) |
| Scoped render workers | Prior QA temporary credential documented to expire 2026-11-01 07:40 UTC; no proven sustainable production rotation | BLOCKED |
| Remotion package audit | Earlier audit reported ten high-severity package entries (not confirmed exploitability); remediation or reviewed acceptance missing | BLOCKED |
| Real Director-approved HTTP render | Java synthetic fixture and independent MP4 smoke are not a full live QA approved render | BLOCKED |
| Real-device auth | Browser login screenshots exist, but full Safari cookie/CSRF/expiry/revocation acceptance not signed | BLOCKED |

## Mandatory release gates — execute in this order

1. **Release branch / dependencies.** Review the 225-file scope, both `main`-only commits, stacked PR #100–#110 dependencies, merged QA PR #111, and changes to legacy EP001 paths. Resolve conflicts without replacing any existing LOCK or media. Tag/pin the candidate.
2. **Director identity & CSRF.** Choose the supported **local Director password+TOTP session** mode or OIDC, then prove exclusive correct activation on a disposable preproduction service. Local mode requires secure initial account provisioning, encrypted TOTP seed key, login throttle, session persistence, origin/CSRF checks, safe emergency recovery and protected offline rotation. A missing flag means *all API calls are denied* by `DirectorSecurityConfiguration.lockedWithoutIdentity`; simply deploying the app would break production.
3. **Machine identities.** Demonstrate the complete worker client compatibility matrix. Rotate scoped short-lived CPU/GPU credentials using the audited issuance/revocation flow, with stable worker ID and matching legacy key, without logging token material. Prove credential renewal before expiry; an expired QA token is not a passing production plan.
4. **Production-schema-copy migration.** Obtain a secured backup through a controlled procedure, restore into a separate restricted database, compare pre-upgrade `flyway_schema_history`, apply V86–V105 with the exact candidate artifact, run `flyway validate`, and verify EP001 episode counts, LOCK rows and checksums/assets pre/post. Explicitly verify V95/V96 ALTER columns, V99 JDBC session tables, V104 owner-claim table, and application compatibility. Do not run this against live production as a rehearsal.
5. **Backup & rollback.** Test restoring the **copy** and record restore duration and integrity; keep the encrypted live backup. Code rollback must preserve forward-compatible additive schema; database downgrade is **not** assumed possible. Document the production rollback target commit/deployment and the exact conditions to stop.
6. **QA release-candidate tests.** Java 21 full test suite with isolated PostgreSQL (no skips due to missing `CI_POSTGRES_URL`), Node22 TypeScript/Vite/Vitest, relevant Remotion tests, negative security boundaries. Then test a disposable approved EP002+ shot via authenticated Director → Voice (explicit paid authorization or Director-approved preexisting audio) → worker claim/progress/MP4 completion → authenticated retrieval and Video approval. This cannot be replaced by a synthetic Director LOCK in a persistent database.
7. **Supply-chain review.** Triage Remotion advisories against the exact running versions and runtime exposure; patch compatible dependencies and rerun render/EP001 regressions, or record an explicit security acceptance by Director.
8. **Director GO/NO-GO.** Present exact commit, DB backup location/restore evidence (without secrets), production secrets/feature flag **names**, QA proof and known residual risks. Require specific approval before changing production source, auth flags, worker identity or episode write/premium generation settings.
9. **Controlled deployment.** Keep paid AI, Voice, rendering and episode mutations disabled except the separately approved scope; deploy compatible components in planned order. Verify authenticated Director login, EP001 immutable checks, EP002 read model, worker identities, errors, health, cost ledger, then monitor and document rollback.

## Startup configuration checklist (names only, no values)

- Required identity (choose exactly one): `MEDIAOS_LOCAL_AUTH_ENABLED=true` with `MEDIAOS_DIRECTOR_SECURITY_ENABLED=false`, or approved OIDC `MEDIAOS_DIRECTOR_SECURITY_ENABLED=true` with `MEDIAOS_LOCAL_AUTH_ENABLED=false` and trusted issuer/JWKS/audience.
- Local mode: reviewed Director bootstrap / claim plan, `MEDIAOS_LOCAL_AUTH_TOTP_ENCRYPTION_KEY` and a secure recovery path. Do not enable bootstrap by default.
- Workers: `MEDIAOS_WORKER_AUTH_ENABLED` and matching audited scoped identities/legacy keys; do not activate a worker route without both pieces.
- New episode writes: `MEDIAOS_EPISODES_CREATION_ENABLED`, `MEDIAOS_EPISODES_WRITES_ENABLED`, `MEDIAOS_EPISODE_RESEARCH_ENABLED`, `MEDIAOS_LEARNING_PROMOTION_ENABLED` remain OFF until separately reviewed.
- Paid operations and rendering: OFF by default. Production `ELEVENLABS_*`, `OPENAI_API_KEY`, `RUNPOD_*` already exist as variable **names**, not proof of validated external operation or permission to spend.

## Current next engineering task

The isolated Java/PG18 candidate build, actual production-schema-copy V85→V105 migration, and a retained private S3 dump with re-download SHA-256/restore checks have passed. Next: native PITR or independent off-platform protection, Director identity provisioning and Safari acceptance, secure workload token rotation, complete Director-approved video/voice E2E acceptance, security advisory triage and final release GO. Full rollout remains NO-GO while any mandatory item is incomplete.

**Do not merge this Draft PR into `main` or stage changes in the Railway production environment based on a green build alone.**

## Production-copy upgrade rehearsal — PASS (2026-11-01)

A temporary **private, no-public-domain Railway production-project service** used credential *references* to perform only a read-only `pg_dump` from the existing production PostgreSQL 18. No production backend/database source, environment flags, media or rows were changed. Its volatile dump was restored inside the temporary container to a separate PostgreSQL 18 database at `127.0.0.1`; there was no Flyway connection to the live production database.

The guarded `ProductionCloneUpgradeAcceptanceTest` verified the restored Flyway baseline was exactly **V85** before applying V86–V105. After `migrate` and `validate`, version **V105** was verified with all 20 new migrations successful. Checksums of the existing EP001 episode row, studio shots, studio audio/narration, clip revision history and visual revision history matched the pre-upgrade copy. Runtime evidence from the one-time service:
- `READ_ONLY_SOURCE_BACKUP=PASS`
- `PRODUCTION_COPY_RESTORED_TO_ISOLATED_POSTGRES18=PASS`
- `Tests run: 1, Failures: 0, Errors: 0, Skipped: 0`
- `LOCAL_CLONE_UPGRADE_V85_TO_V105_AND_EP001_HASHES=PASS`

A first isolated attempt stopped **after** successful read-only backup, before restore, due to an ephemeral directory ownership error. The script was corrected and the second pass above completed successfully. The first temporary service was deleted, and the second must also be removed after recording evidence. There is **no persistent copy** from this rehearsal; the script securely restricts local backup permissions and deletes its volatile dump on exit. This is **not** a disaster-recovery backup or proof of rollback time. No EP001 rows were written or modified in production.

**Production release still NO-GO** until a separately retained encrypted backup with verified restore, production Director identity and emergency recovery, worker credential rotation, genuine Director-approved media workflow, advisories review, and final Director authorization for the exact release candidate.

## Later superseding update — retained private recovery backup, 2026-11-01

The earlier passage about an ephemeral-only dump records the **prior** rehearsal. A second, separately executed production read-only backup has now been uploaded into the private Railway `mediaos-production-recovery` bucket and retained. The archive was independently downloaded and SHA-256 verified (**817,308,076 bytes; SHA-256 `784be788d64f9103e2f2c571d99353d348dd3d4721b0a8f9d61024add612c101`**), restored to disposable PostgreSQL 18 and passed the same guarded V85→V105 / EP001 content-invariance test. One-time helper deleted; durable bucket retained. See `MEDIAOS_PRODUCTION_RECOVERY_BACKUP_EVIDENCE_20261101.md`.

This confirms **one** successfully restored recovery point. The bucket is private and platform AES-256 encrypted at rest, but not client-side encrypted, externally replicated, object-locked or automatically versioned. **Do not conflate the S3 backup with native Postgres PITR, off-platform recovery or proven low-downtime production cutover.** Scheduled backups, restore runbooks, release-time snapshots, independent credential recovery and actual actor onboarding remain separate operational controls. Production auth/worker/paid-operation settings and `main` were not changed. **PR #112 remains DRAFT/NO-GO.**
