# MediaOS — Strong Director Authentication & Authorization v1
**Status:** DESIGN / IMPLEMENTATION PENDING — NOT PRODUCTION READY  
**Baseline:** PR #100, `155624b5a16fab04b3f76f95f2d591b56b06e009` (2026-10-28)  
**Scope:** EP002+ authenticated approvals, project learning reviews, paid AI controls, and legacy Director writes.  
**No release permission:** This document does not authorize a merge, deploy, enabling feature flags, or any change to EP001 LOCKED outputs.

## 1. Confirmed security gaps in current draft branch

1. `EpisodeWorkspaceController.directorLock` delegates to the workspace service with an arbitrary `directorNote` but no authenticated actor or role check.
2. `EpisodeLearningController.decide` trusts the request field `reviewedBy` for attribution and passes `X-MediaOS-Director-Approval` as a shared secret. The secret is a QA-only capability, not authenticated human identity.
3. `AiRuntimePolicyController.update` changes `paidAiEnabled` / `autoRepairEnabled` without an authenticated Director permission check.
4. `EpisodeScopedAgentController.run` verifies an audited request and single-use AI preview token; that token limits usage but does not identify or authorize a human operator.
5. Legacy `DirectorRoomController` includes `/proposals/{proposalId}/lock` and similar mutations. New multi-episode protection cannot assume that legacy endpoints are safe.
6. `GlobalCreationPreflightFilter` validates canonical context and episode routing, **not identity**. It must remain a separate mandatory gate.
7. Spring Boot backend `pom.xml` currently has no Spring Security OAuth2 resource-server dependency.

**Threat model:** unauthenticated or non-Director clients must not be able to lock a stage, approve/discard learning, alter global knowledge, enable spending, or impersonate the reviewer by choosing a request-body name. A preview token, episode UUID, audit ID, forwarded identity header, or shared QA capability must never grant a Director role.

## 2. Approved architecture target (proposed; needs implementation + QA)

Use standards-based **OIDC authentication** (Authorization Code + PKCE for the UI) with signed access tokens verified server-side. The backend validates `iss`, `aud`, signature through the trusted JWKS, `exp`, `nbf`, and token type where applicable. Reject unsigned, expired, wrong-issuer, wrong-audience and otherwise invalid tokens. Do not implement a home-grown password/token system or trust client-supplied `X-User`/`X-Role` headers.

Map verified `(issuer, subject)` to a locally configured/DB-backed **active project membership and role**. Roles are `VIEWER`, `EDITOR`, `DIRECTOR`; `DIRECTOR` is an explicit local grant, never inferred from a freely editable client claim or request body. Initial bootstrap must be administrator-controlled and nonpublic. Administrative role changes require a distinct secure operation and audit, not the normal episode agent.

Prefer an HttpOnly, Secure, SameSite browser session / BFF design for the React UI if a login gateway is built. If using bearer tokens, keep them out of localStorage and URLs, use short lifetimes, and protect against XSS and token leakage. Enforce MFA at the identity provider for Director accounts; document/verify this as a release criterion.

## 3. Permission matrix (first implementation contract)

| Action | Minimum role | Extra guard |
|---|---|---|
| Read episode/workspace/review context | VIEWER | Authorize access to the project |
| Create episode / change episode-level memory | EDITOR | Preflight, creation/write flags, audited episode identity |
| Save Research/Script/Scene drafts or reusable asset references | EDITOR | Existing revision/LOCK checks |
| Preview non-paid Script/Scene work | EDITOR | Episode scope and canonical context |
| Run a paid Script/Scene agent | DIRECTOR | Paid-AI enabled + single-use preview authorization + episode/stage/revision binding |
| Director stage LOCK/unlock, final approvals | DIRECTOR | Explicit decision, revision checks, identity-derived audit |
| Learning Review: PROMOTE_GLOBAL / KEEP_EPISODE / REJECT | DIRECTOR | Existing feature flags, fingerprint, conflicts, explicit note, row lock |
| Change paid-AI or auto-repair policy | DIRECTOR | Explicit spend policy + audit |
| Legacy Director proposal LOCK or decisions | DIRECTOR | EP001 isolation and locked-output invariants |
| Internal render-worker callback | Dedicated workload identity | Job-specific episode scope, service identity, never the Director role |

Any otherwise-unclassified state-changing endpoint needs explicit ownership and a permission decision; default **deny** for new mutation routes. A service/worker process is not allowed to fabricate an interactive Director identity.

## 4. Backend implementation sequence

1. Add Spring Security resource-server support with a feature configuration that **fails closed** for sensitive writes when OIDC configuration or identity membership is missing. Public health/probes must continue working. Do not accidentally make all legacy routes publicly writable via a broad `permitAll`.
2. Add a security configuration with explicit HTTP method/path rules for sensitive controllers, including `/api/v1/system/ai-control`, `/api/v1/episodes/**`, `/api/v1/director/**`, and all other legacy approval/spending entry points identified by an endpoint inventory.
3. Add a versioned Flyway migration (next version after V87) for trusted identities / memberships / roles and immutable actor audit fields. The only authority for `reviewed_by` on new decisions is verified `issuer + subject` resolved to a stable internal actor ID.
4. Refactor `EpisodeLearningController` and `EpisodeLearningService` to derive reviewer attribution from the authenticated security context. Do not trust `DecisionRequest.reviewedBy`; either reject the property or keep it for backward-compatible display only while checking equality with the verified identity. Keep any temporary QA capability as an **additional**, never sufficient, check.
5. Refactor `EpisodeWorkspaceController.directorLock` and other explicit Director decisions to require a verified `DIRECTOR` principal at the service boundary as well as HTTP authorization. Enforce service authorization for jobs or non-HTTP callers separately.
6. Protect `AiRuntimePolicyController.update`, paid-AI preview-token issuance and agent execution. Issuance of a preview token must not be a substitute for actor authentication. Bind the approved operation to the actor to prevent token handoff; record actor identity in the spend audit.
7. Add React OIDC sign-in/session expiry/403 feedback without automatically changing locked episodes. Read-only pages must remain usable according to explicit project-read policy.
8. Audit all remaining legacy write endpoints; close bypasses before production rollout. Preserve Global Creation Preflight, Truth Map locks, episode routing, revision concurrency and Learning Handoff Gate.

## 5. Required negative & integration tests

- Unauthenticated Director LOCK / Learning decision / paid-AI enable / paid agent run = denied before mutation.
- Valid JWT with `VIEWER` or `EDITOR` cannot perform Director operations, even with a valid QA capability or AI preview token.
- Invalid JWT: wrong `iss`, wrong `aud`, expired, untrusted signature, missing subject, inactive membership = denied.
- Body-supplied `reviewedBy`, `X-Role`, `X-User` or forwarded identity cannot spoof attribution or elevate privileges.
- Valid `DIRECTOR` can approve only an explicitly reviewable item, with exact episode identity and revision; no auto-LOCK.
- Global promotion must continue rejecting duplicate/conflicting/stale rules and must not leak EP002-only corrections into EP003.
- AI preview and authorization remain one-use, expire, and are actor-bound as well as episode/stage/revision-bound.
- Direct service invocation/background jobs cannot bypass privileged rules; workload identity is scoped to its job.
- EP001 LOCKED asset identifiers, render output metadata, and legacy protections are unchanged.
- Production default feature flags OFF. Production must remain on merged PR #99 until Director go/no-go; no automatic merge/deploy.
- Isolated Railway/PostgreSQL QA with clean migration and real HTTP authorization tests; report exact counts and evidence.

## 6. Release gate

This phase is **NOT COMPLETE** until code, integration tests and isolated environment authentication have passed, identity provider/MFA setup has been verified, the endpoint inventory shows no bypass, and the human Director explicitly approves rollout. PR #100 remains Draft and production flags remain:

```
MEDIAOS_EPISODES_WRITES_ENABLED=false
MEDIAOS_EPISODES_CREATION_ENABLED=false
MEDIAOS_LEARNING_PROMOTION_ENABLED=false
```

Do not start an actual paid AI call, modify EP001, merge PR #100, or deploy to production as part of this specification.
