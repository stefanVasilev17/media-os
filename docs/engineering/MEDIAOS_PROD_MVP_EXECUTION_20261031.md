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
