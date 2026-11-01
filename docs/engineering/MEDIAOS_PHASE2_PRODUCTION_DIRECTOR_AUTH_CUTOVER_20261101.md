# MediaOS — Production Director Authentication Cutover Runbook

**Date:** 2026-11-01. **State:** PREPARATION ONLY / NO PRODUCTION AUTH ACTIVATION.
**Release:** Draft PR #112 / `release/mediaos-ep002-prod-readiness-20261101`.

## Chosen candidate

Use existing **local Director HTTPS password + TOTP** authentication, already used in isolated QA. Do not combine local mode with OIDC mode. Production currently has no `MEDIAOS_LOCAL_AUTH_ENABLED` / `MEDIAOS_DIRECTOR_SECURITY_ENABLED` variable names; the newer security configuration denies `/api/v1/**` if neither mode is enabled. A healthy Spring Boot actuator is not evidence that the Director can use the app.

## Prerequisites before real production activation

1. Finish PostgreSQL 18 *production-copy* V85→V105 rehearsal and independently restore a retained, encrypted production backup; compare EP001 LOCKED data and media checksums.
2. Verify encryption key handling and recovery outside the application. `MEDIAOS_LOCAL_AUTH_TOTP_ENCRYPTION_KEY` must decode to **exactly 32 random bytes** (Base64). If this key is lost, saved TOTP secrets cannot be decrypted. Never regenerate it casually during deploy or rollback.
3. Decide the approved Director account username, independent high-entropy password (minimum 16 chars per backend), and valid TOTP secret. Transfer them only through a secure secret manager or in-person authenticator enrollment; never issue them from chatbot text, commit history or application logs.
4. A native production Director is not automatically created. `LocalDirectorBootstrap` runs only with an explicit one-time flag and refuses an existing Director account. Never leave bootstrap password/TOTP variables permanently active. Alternative claim/activation paths must be separately reviewed.
5. Ensure full rollback uses an application-compatible **forward-migrated** schema. Do not assume a Flyway database downgrade is supported.
6. Validate account recovery, TOTP rotation, session revocation, HTTPS and CSRF on an isolated release-candidate instance, including actual iPhone Safari test. QA screenshots are not a complete session-expiry/recovery acceptance.

## Approved variable names (values deliberately omitted)

| Name | Approved production value/condition |
|---|---|
| `MEDIAOS_LOCAL_AUTH_ENABLED` | `true` only at controlled cutover |
| `MEDIAOS_DIRECTOR_SECURITY_ENABLED` | `false` in local mode |
| `MEDIAOS_LOCAL_AUTH_TOTP_ENCRYPTION_KEY` | Valid pre-provisioned 32-byte Base64 secret, never logged |
| `MEDIAOS_LOCAL_AUTH_BOOTSTRAP_ENABLED` | `false` by default; one-time enrollment needs explicit authorization |
| `MEDIAOS_LOCAL_AUTH_BOOTSTRAP_USERNAME` | Secure value only if enrollment is explicitly authorized |
| `MEDIAOS_LOCAL_AUTH_BOOTSTRAP_PASSWORD` | Secure value only if enrollment is explicitly authorized; remove after |
| `MEDIAOS_LOCAL_AUTH_BOOTSTRAP_TOTP_SECRET` | Secure value only if enrollment is explicitly authorized; remove after |
| `MEDIAOS_LOCAL_AUTH_CLAIM_ENABLED` | `false` unless a separately reviewed activation procedure is used |
| `MEDIAOS_EPISODES_CREATION_ENABLED` | `false` until authorized |
| `MEDIAOS_EPISODES_WRITES_ENABLED` | `false` until authorized |
| `MEDIAOS_EPISODE_RESEARCH_ENABLED` | `false` until authorized |
| `MEDIAOS_LEARNING_PROMOTION_ENABLED` | `false` until authorized |
| `MEDIAOS_WORKER_AUTH_ENABLED` | `false` until a valid scoped rotating worker identity is provisioned |

Production `ELEVENLABS_*`, `OPENAI_API_KEY` and `RUNPOD_*` existing variables are *not* spending authorization. Do not initiate any paid generation during migration/auth tests.

## Acceptance matrix (run against release candidate, not EP001 mutations)

| Case | Expected |
|---|---|
| `GET /actuator/health` | 200 |
| `GET /api/v1/auth/mode` | 200, local=true, requiresTotp=true |
| `GET /api/v1/auth/csrf` | 200, secure CSRF cookie |
| Anonymous `GET /api/v1/episodes` | 401 |
| Anonymous worker `POST /api/v1/remotion/renders/worker/claim` | 401 |
| Login without CSRF | 403 |
| Invalid password or TOTP | 401; excessive attempts throttled |
| Correct password + TOTP + CSRF | 200, new opaque session |
| Authenticated read of episode index and approved Voice read | 200, no generation |
| Authenticated mutation to nonexistent episode without CSRF | 403 |
| Logout, then replay same cookie | 401 |
| Disable account, then replay old session | 401 |
| Reopen Safari and exercise 30-min idle / opt-in Remember Device | Actual expiry and revocation must be demonstrated |

**Cutover sequence:** final backup → configuration/identity readiness → exact-candidate deployment with clear rollback target → authenticated Safari smoke → negative security boundaries → EP001 immutable data audit → explicit Director approval for any additional write/Voice/Video flags. Keep the service protected from new requests if login fails; never disable security to obtain a passing health check.

## Open production blocker

Production service variables do not currently include local/OIDC authentication activation and the Director has not authorized production credential enrollment. DO NOT stage these variables or provision an account as part of read-only database rehearsal. A separate operator GO and secure secret provisioning are required.
