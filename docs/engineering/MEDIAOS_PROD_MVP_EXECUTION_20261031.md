# MediaOS Production MVP — execution and release gates

**Status:** IN PROGRESS — NOT RELEASE-READY
**Working branch:** `feature/mediaos-prod-mvp-security-20261031`, based on Draft PR #109.
**Director instruction:** EP001 is COMPLETE and IMMUTABLE for this effort. Do not modify EP001 media, scripts, approval records, Remotion compositions, database rows, assets or rendered output.
**Deployment:** No merge to production; no paid AI, ElevenLabs or Remotion generation during security work. No GitHub Actions.

## Step 1 — Authenticated isolated QA

### Started in this branch
- Default-off Episode flags are checked at startup: creation/writes/research cannot be enabled without `mediaos.director-security.enabled=true`.
- Spring Security OAuth2 Resource Server skeleton verifies signed JWTs using trusted JWKS, HTTPS issuer, `aud`, `exp`, `nbf`, and nonempty subject.
- Project roles come only from a locally controlled active membership record, never untrusted `X-Role`, `X-User`, request JSON, or JWT self-assigned roles.
- `V94__director_identity_membership.sql` defines initially empty memberships. No automatic Director bootstrap.
- HTTP API is denied when OIDC security is disabled. When enabled, project reads require a membership and mutations require DIRECTOR. This temporarily stricter rule remains until every endpoint has an explicit permission decision.
- Unit tests added for startup-write gate, missing identity configuration, and role allowlist.

### Release blockers
- Connect an approved OIDC provider with MFA, provision a trusted Director membership via an admin-only procedure, and build React login/session expiry flow. Do not put bearer tokens in localStorage, URLs or logs.
- Add identity-derived actor audit for every privileged approval and AI spend operation. No client-supplied reviewer attribution.
- Close all privileged endpoint/service-layer bypasses, including legacy Director decisions, learning approvals and global policy changes; implement workload identity for worker callbacks.
- Review origin/CSRF model (stateless bearer vs HttpOnly cookie); set secure origin policy and rate limits, especially paid AI and write endpoints.
- Add negative HTTP tests for bad/expired/wrong-audience JWTs, VIEWER/EDITOR denial, inactive membership, actor spoofing and protected EP001 invariants.
- Confirm the authentication security chain will not break existing Read-only QA, then use a disposable isolated QA service/database to validate V94 before switching flags.
- Run Java 21 Maven tests, Node 22 TypeScript/Vite/Vitest, migration and HTTP integration tests; no GitHub Actions.
- Do not set any write or paid generation flags on in production without the Director's explicit go/no-go.

**Exit:** one authenticated Director can perform permitted QA operations; anonymous/editor/wrong-episode requests cannot; EP001 hashes and approvals are unchanged.

## Step 2 — One complete disposable Shot workflow

- Create a new disposable QA episode (not EP001). Validate unique episode number, brief revision and episode isolation.
- Research: preview with paid AI disabled must not issue an authorization token; use validated manual QA fixtures or a separately approved fixed-budget request; Director verifies truth and LOCKs.
- Script and Video Plan: draft, review, lock with exact revision. No automatic unlock or inherited approvals.
- Shot Revision: show/edit/save new DRAFT; stale revision must return a clear conflict; only explicit Director LOCK activates the revision.
- Voice: exact approved narration; one authorized take or manual QA asset, then Director approval. No generation until budget/configuration approved.
- Video: the new episode workspace currently has a placeholder for generation. Implement and verify a working video draft/asset attachment + human approval path before considering Step 2 complete; Remotion automation can remain a later feature if manual import is fully auditable.
- Confirm changed Script/Shot invalidates dependent pending approvals without deleting historical approved assets.
- Verify counts/statuses and mobile/desktop happy and error paths. Record timestamps, revision IDs, audit actor, rendered/audio asset identity and resulting source version.
- Re-run negative tests for any step skipped, stale or wrong episode.

**Exit:** one whole disposable Shot can go from approved planning through Voice and Video approval with reproducible audit evidence, with paid generation optional and explicit.

## Step 3 — Production release (requires separate Director approval)

- Inventory the stacked Draft PR dependencies #100–#109 and resolve conflicts. Do not merge blindly.
- Test clean PostgreSQL Flyway V1–V94 and migration of a copy of production schema; verify no prior migrations are edited.
- Validate security, schema, Java and frontend tests plus all Director approval invariants.
- Prepare encrypted backups and a restore rehearsal. Do not write test data to production.
- Smoke test mobile + desktop and real authenticated Director on isolated QA.
- Document flags, OIDC issuer/audience/JWKS and verified membership bootstrapping; do not commit secrets.
- Review exact release diff. Require a separate, affirmative Director go/no-go for merge and production deploy.
- Monitor health, logs, runtime spend and regressions; keep a rollback plan that is compatible with additive DB migrations.
- Preserve EP001 final video and all prior LOCKED assets byte-for-byte.

**Exit:** production deploy approved, tested, monitored, reversible at the application level, with no data loss.

## Current evidence / limitations

- The earlier QA deployment of PR #109 passed TypeScript/Vite and 138 Java tests (0 failures, 0 errors, 1 skipped), with Flyway V93 and PostgreSQL Online.
- These results predate this new security branch. **They are NOT build evidence for its new files or V94 migration.**
- No QA database fixture, authenticated end-to-end test, video approval flow, merge or production deploy has been executed in this branch.


## Stage 1 security implementation update — 2026-10-31

- Global creation preflight is ordered AFTER Spring Security so unauthorized requests cannot produce a canonical creation audit merely by calling a mutation endpoint.
- `DirectorIdentity.requireDirector()` reads only the verified `JwtAuthenticationToken` and a trusted `ROLE_DIRECTOR` grant. It derives an opaque stable audit display key from verified issuer + subject.
- Episode stage `directorLock` now rejects a missing Director identity at service boundary; a successful `DIRECTOR_LOCKED` event records verified issuer and subject in the same transaction.
- Learning decisions preserve the legacy capability as an additional gate but require verified Director membership. The caller-provided `reviewedBy` is ignored; the service stores the verified actor and opaque audit name.
- `V95__director_actor_audit.sql` adds nullable actor provenance columns without rewriting existing immutable events.
- Added tests for non-Director stage locks, anonymous/capability-only Learning decisions and issuer/audience identity validation.
- **Unverified**: new security code has not completed Java 21 Maven, Flyway V94/V95, integration HTTP tests, frontend login, all legacy endpoint inventory, or QA deploy. The previously successful 138 tests belong to PR #109, NOT this security branch.
- No changes to EP001 files or production, no new QA deployment. PR #110 remains DRAFT.


## Stage 1 paid AI authorization hardening — 2026-10-31

- Added Flyway V96 for `ai_preview_authorization.actor_issuer` and `actor_subject`. Existing unbound preview rows remain legacy but cannot match the new consumption condition.
- A paid preview authorization is issued only to a verified Director, and consumption requires the *same* issuer and subject in addition to operation, payload, READY status, and expiry. The one-use update still happens atomically.
- Added Flyway V97 for immutable `ai_runtime_policy_change_audit` rows containing the authenticated Director actor and before/after Paid AI and Auto Repair values.
- AI spend policy changes now require `DirectorIdentity.requireDirector()` inside `AiRuntimePolicyService.update()` and the policy mutation + audit insert are transactional.
- Added `PreviewAuthorizationActorTest`, `AiRuntimePolicyAuthorizationTest` and `DirectorHttpAuthorizationTest`. The HTTP test exercises access rules with mock JWT authorities; it does **not** replace actual signed JWT signature/issuer/audience integration tests.
- **No migration applied, no tests executed on the security branch, and no QA/production deployment.** Do not claim these test cases passed.
- Remaining security work: prove actual Spring Security startup/filter ordering and signed OIDC JWT parsing, director membership provisioning + MFA, frontend sign-in, service/worker identity and endpoint inventory, rate limits, origin/CSRF policy, actor-bound spend ledger for model execution, staging migration and full e2e regression.


## HTTP mutation allowlist review — 2026-10-31

The first OIDC draft authorized every `/api/v1/**` mutation for a Director. This was too broad: future API endpoints and legacy worker callbacks could inherit permission without review. It now:
- explicitly denies `/api/v1/worker/**` and `/api/v1/remotion/renders/worker/**`;
- allows authenticated project members to read the normal API (subject to later read-data classification);
- allows only Director `POST /api/v1/episodes[/**]`, `POST /api/v1/previews/**`, and `PUT /api/v1/episodes/**` or `PUT /api/v1/system/ai-control`;
- denies all other API mutations by default, even for Director, until reviewed and approved;
- adds HTTP test cases for worker callback denial and a newly introduced unreviewed mutation.

**Important operational impact:** Legacy EP001 mutation API, worker callbacks, Video/Voice routes outside the allowlist and some currently supported actions will be intentionally unavailable if this security branch is deployed. This is a fail-closed interim posture, **not the final functional permission matrix**. Worker automation requires a separate workload-identity model. Do not deploy this security branch to the existing visual QA or to production. Before the complete production MVP, explicitly inventory all endpoint method/path combinations, implement reviewed role mappings and test the real workflow using an isolated staging environment.

**Status remains unverified:** newly added security tests have not been executed and Flyway V94-V97 has not been applied.


## Stage 1 security hardening — continued (2026-10-31)

- Updated `EpisodeWriteActivationGuard` to cover the separately configured `mediaos.learning.promotion-enabled` flag; updated its constructor tests and added a negative test.
- Added authenticated `GET /api/v1/security/session` to return project role capabilities for future OIDC UI integration. It deliberately does **not** expose raw JWT claims or an actor identifier. This does not implement a login flow.
- Removed the wildcard `POST /api/v1/episodes/**` permission. Mutations now match a reviewed, explicit list of Episode, Research, Script/Scene, Shot Revision, Voice, Learning and quality assertion paths. Any unlisted write defaults to deny even for Director; legacy/workers remain denied.
- Closed a paid AI bypass in `AiSpendGuardAspect`: when a model call has no interactive request, no authorized preview payload, or is an automatic repair without workload authorization, execution is blocked **before** the model call. A valid interactive request now always requires a verified Director plus one-use token consumption.
- Added `AiSpendFailClosedTest` and `DirectorSessionControllerTest`; updated HTTP tests to assert known Episode writes are allowed for Director while an unknown nested route is refused.
- Verified the current GitHub Draft PR branch and files, not an executable build. The local container has Java 21 but lacks Maven and project dependencies; direct GitHub networking from that container is unavailable. The existing Railway QA must remain pinned to PR #109 until explicit isolated security testing is arranged.
- **Important:** all automation/background AI calling legacy methods now fails closed on this branch. This is intentional and cannot be released until workload identity and reviewed worker permissions are implemented.
- **Remaining blockers:** Maven compilation, unit/HTTP integration suite, signed OIDC JWT verification, full Flyway V94–V97 staging migration, security smoke tests, frontend login, worker identity, and explicit Director release approval.


- AI spending policy changes now acquire a database row lock before reading and updating values; this serializes competing Director switches and keeps previous/next audit records consistent. The policy must exist; missing configuration fails closed.

## Verified Maven security build — 2026-10-31

On the isolated Railway QA project, the pinned security commit `13a3d74cb260e957c0efa00d57f5ffe5f95c673d` passed Java 21 Maven tests. Focused Director HTTP tests: 9 passed, 0 failures, 0 errors. Full Maven test command: SUCCESS, confirmed by successful Docker verification stage. The test-only service was removed after verification. No production changes or database migration occurred. Remaining blockers: OIDC/MFA, database migration testing, frontend login, worker authorization and end-to-end QA. PR #110 remains Draft.


## Verified PostgreSQL and signed-JWT security integration — 2026-10-31

- **Build proof:** Railway QA project `MediaOS-Preflight-QA-20261028`, isolated temporary build-only service `mediaos-security-migration-ci-pr110-temp`, deployment `3ebb3fae-da5a-4417-bd17-842679182f40`, pinned GitHub commit `49205d968b9b49beb59c3b2003f482e605e2b64b`.
- Maven 3.9, Java 21, local disposable PostgreSQL **16.15** running inside the Docker build stage. The database uses no Railway connection, existing QA database, credentials, domain, or production data.
- **183 tests, 0 failures, 0 errors, 0 skipped. Maven BUILD SUCCESS.**
- `SignedDirectorJwtVerificationTest`: **7 passed**, using locally generated ephemeral RSA key pairs and signed RS256 JWTs. Accepts trusted signature; rejects foreign signature, tampered payload, expired token, future `nbf`, wrong issuer/audience, and missing subject. This tests JWT verification but **not** a live external OIDC provider or hosted JWKS fetching.
- `DirectorSecurityMigrationTest`: **2 passed**, validating full Flyway **V1–V97** on new PostgreSQL and checking no auto-provisioned Director membership, new audit columns, issuer/subject/active role checks and successful migration. Existing `GlobalCreationPreflightMigrationTest` also passed with the disposable PostgreSQL.
- The temporary CI Dockerfile has a separate Maven/PostgreSQL build stage; the final image carries only Surefire reports, not an application or database.
- **Still required before QA writes:** approved OIDC provider and MFA; React authentication lifecycle; end-to-end signed-token + project-member endpoint tests; secure worker identity; account bootstrap procedure; real frontend authentication checks. Complete a subsequent copy-of-schema migration rehearsal in an isolated database before production. No feature flags enabled.
- All security work is restricted to **Draft PR #110**. EP001 and production remain immutable. Existing Railway visual QA preview on PR #109 remains untouched.
