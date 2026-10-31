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
| Production database | Live Flyway version, backup/restore, schema-copy migration and EP001 hash baseline not yet inspected | BLOCKED |
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

Prepare a clean, isolated preproduction test of candidate backend + PostgreSQL and a source-inventory/CI package. A production-schema-copy migration needs approved backup handling; a temporary blank PostgreSQL build verifies compilation and migration naming but **does not** clear that gate. Full rollout remains NO-GO while any mandatory item is incomplete.

**Do not merge this Draft PR into `main` or stage changes in the Railway production environment based on a green build alone.**
