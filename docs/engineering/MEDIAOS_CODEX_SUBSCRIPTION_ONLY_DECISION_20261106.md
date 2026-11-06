# MediaOS Codex connection decision — ChatGPT subscription ONLY
Date: 2026-11-06
Owner: Director
Status: LOCKED REQUIREMENT / EXTERNAL APPROVAL REQUIRED / NOT CONNECTED

## Hosted subscription readiness UI and fail-closed dispatcher (2026-11-06)

The Director-reported OpenAI SIWC application is **submitted, awaiting response, not approved**. The branch adds `CodexSubscriptionAccessPolicy` and Director-only `GET /api/v1/creative/episodes/EP002/codex-automation/subscription-readiness`; this reports the exact provider-approval blocker without contacting OpenAI or using any OAuth credential. The existing Director Codex panel now reports provider status, distinguishes submission from approval, and disables arm/resume while the hosted subscription entitlement is absent. The backend independently blocks arm/resume, CLI connector preflight, scheduler polling and cloudWorkerEnabled when the hosted entitlement is not approved, even if someone mistakenly sets the former dispatch/CLI flags. The existing pause remains available so prior records can be stopped safely. A unit test enforces subscription-only/no API fallback.

This implementation is intentionally **fail-closed**; it does not pretend that a working SIWC client, refresh/access token, remote runtime authorization or cloud task exists. No hypothetical `Connect Codex` OAuth button or token persistence was added without provider approval. No service was deployed in this change. Railway production remains pinned to earlier release SHA `964d558bb92228e5d69943ed3daf3fdb5468b183`; to release any newer branch changes later requires an explicitly reviewed production deployment with real build/migration/healthcheck evidence.

## OpenAI SIWC application status — Director report, 2026-11-06

**The Director reports having submitted the OpenAI Sign in with ChatGPT partner-interest application.** This is a user-reported submission, not an independently verified form receipt. **Status: SUBMITTED / AWAITING_OPENAI_RESPONSE; NOT APPROVED; NO CLIENT ID OR HOSTED PLAN-USAGE ENTITLEMENT ISSUED OR VERIFIED.**

Next provider evidence required: OpenAI's explicit decision on hosted app eligibility, `chatgpt.tokens.use.direct` (subscription-backed usage rather than identity-only access), and an approved user-controlled runtime/token-handling approach for unattended Railway workflows. Until then, do not ask the Director to submit the same form again, do not create fake OAuth client credentials or make any Codex inference request, and do not enable existing local/CLI Codex adapters on production. Do not claim OpenAI will approve or specify a response deadline.

Parallel safe work: prepare offline, no-token, no-provider-call UI/adapter contracts and tests only; keep all dispatch gates disabled and no additional Codex API billing. A future OpenAI email/portal response should be reviewed before adjusting architectural assumptions.

## Director's non-negotiable contract

- Codex coding inference must use **only usage included in the Director's own eligible ChatGPT subscription**.
- **Never** use `OPENAI_API_KEY`, an OpenAI Platform API key, Responses pay-as-you-go billing, paid Codex API, purchased ChatGPT credits, auto-credit top-ups or a silent paid provider fallback for MediaOS Codex.
- No local laptop/desktop, home/self-managed server, or GitHub Actions may be required. Railway is the existing cloud runtime for MediaOS and Remotion. Other Railway/Remotion/voice infrastructure charges, if separately authorized, are not Codex usage.
- Respect provider plan limits and app-specific weekly cap. When usage or user consent is missing, stop in a visible `SUBSCRIPTION_NOT_AVAILABLE` state. Never retry by changing account or source of billing.
- Every background request must be an expressly approved, Director-owned automation, bound to EP002 source/shot/voice and immutable Git SHA. Do not share plan usage with other users or generic external callers.
- Production must not expose a decorative `Connect Codex` button that suggests authorization works before OpenAI actually issues credentials/entitlement for this hosted integration.

## Official constraints — checked 2026-11-06

OpenAI's SIWC Terms effective 2026-11-04 require supported OAuth, restrict plan requests to the user's local or **user-controlled remote runtime**, require express consent for background processes, and say **persistent storage of SIWC Authentication Tokens must be local and under the user's control, not in a remote/managed environment**. Do **NOT** persist access or refresh tokens in Railway environment variables, Railway-managed volumes, PostgreSQL, logs, GitHub, or third-party managed credentials to work around this restriction. A hosted Rails/Railway connector's eligibility and token handling must be explicitly approved/clarified for this application; a local Codex CLI session or copying `~/.codex/auth.json` to the cloud is NOT authorized.

Official SIWC commercial partner access is selective; **identity-only SIWC is not sufficient**. MediaOS needs plan usage permission including `chatgpt.tokens.use.direct`, and authorized user consent. The official open-source self-registration flow and local CLI `codex login` do NOT automatically authorize this privately hosted production backend.

Sources:
- https://openai.com/policies/sign-in-with-chatgpt-terms/
- https://developers.openai.com/siwc/request-client-id
- https://developers.openai.com/siwc/token-sharing-open-source/codex-app-server
- https://developers.openai.com/siwc/token-sharing-open-source/errors-and-recovery
- https://help.openai.com/en/articles/20001542-using-your-chatgpt-plan-in-other-apps-and-sites
- https://openai.com/form/sign-in-with-chatgpt-interest/

## Exact partner application request

Apply through https://openai.com/form/sign-in-with-chatgpt-interest/
Select **Sign in and use ChatGPT plan for AI requests** (not sign-in only).
Suggested description (do not substitute any unverified facts):

"MediaOS (Architectural Thinking) is a privately operated, remotely hosted video-production orchestration application. A single authenticated Director selects an educational episode and explicitly authorizes bounded background Codex coding tasks to produce Remotion scenes in a private GitHub repository. MediaOS runs on Railway and presents code quality, rendered previews and approval gates. We want to use only the Director's eligible ChatGPT subscription usage for Codex tasks, with no paid API keys or ChatGPT credits. Please confirm eligibility for hosted SIWC plan-usage authorization and the supported token-handling/runtime architecture under the SIWC Terms, including whether unattended workflows on our managed Railway service can comply."

Do not claim partner approval has been requested or granted until the Director submits the form and OpenAI confirms.

## Implementation gates (ordered)

1. Official partner approval with usable SIWC client registration, callback/origins, plan usage scope, and an approved handling model that complies with the terms for **hosted** background tasks. If the provider cannot authorize the requested cloud runtime/token persistence model, STOP and communicate incompatibility, not a fake workaround.
2. Create a `CODEX_HOSTED_SIWC` adapter, but keep it **disabled** until valid account-specific approval. Do not enable existing `CODEX_LOCAL_EXEC` as a production substitute, or silently use `CODEX_CLOUD_CLI` with copied ChatGPT sessions.
3. Use a genuine OAuth consent flow and verify plan scope/entitlement, app attribution and limits. No token printed, transferred via chat, or stored remotely contrary to terms. Explicit Director opt-in for background SHOT tasks. No credits fallback.
4. On each task, verify source SHA, voice Take and HEAR->SEE anchors, one allowed SHOT file, accepted provider terminal state, GitHub PR provenance, independent QA, Remotion MP4 and Director acceptance. No task advance on a mere HTTP 200/queued state.
5. Verify the first end-to-end EP002 SHOT02 implementation and preview before scaling to remaining SHOTs; finish Master and three Shorts only after the preceding gates.

## Current reality

Railway production backend is live at pinned PR191 commit `964d558bb92228e5d69943ed3daf3fdb5468b183` with V125 schema; the render worker is separately pinned at a prior commit. The Codex dispatcher exists but its available adapters are **not authenticated/authorized for hosted ChatGPT plan inference**, and automatic dispatch is OFF. No Codex subscription inference is verified. **This decision file is a GitHub branch update only. It is not a production deployment, an OpenAI application approval, or a task execution.**
