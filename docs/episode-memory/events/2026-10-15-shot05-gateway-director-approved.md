# EP001 — SHOT 05 / API Gateway: DIRECTOR-APPROVED SCRIPT AND VISUAL CONTRACT

**Director approval:** 2026-10-15, Architectural Thinking project.  
**Approval type:** NARRATION + SCENE/TIMING PLAN LOCK. Not an MP4 Director LOCK.  
**Production state:** PRE_PRODUCTION; TTS NOT GENERATED; SHOT 05 NOT RENDERED; LIVE MediaOS FULLY LOCKED script NOT MIGRATED.

## Director-approved duration and continuity

SHOT 05 target planning clock: 03:45–05:55 = 130 sec (+50 sec against original 80 sec). Original SHOT 06 planning start 05:05 becomes 05:55; all later absolute *planning* offsets must shift +50 sec in a controlled revision. These are planning markers, not the actual voice-synced cumulative MP4 runtime. Begin SHOT 05 at the actual last frame of Director LOCKED SHOT 04. Preserve all approved SHOT 01–04 audio, rendered videos, locks and world positions unchanged.

## Approved spoken script (HEAR; text locked)

03:45–04:02 · API Gateway

> When you press Login, your request reaches the first stop on the server side. Here, a few rules are checked before the password. This stop is called the API Gateway.

04:02–04:23 · Routing

> The request must find the right service. The app now uses version two of the login address. But the gateway still knows only version one. It answers 404. The password check never starts. Choosing where a request goes is called routing.

04:23–04:43 · HTTP Method

> The address is right, but the app sends GET instead of POST. The gateway answers 405: Method Not Allowed. POST is for sending login details. GET asks to read data. This difference is called the HTTP method.

04:43–05:06 · Rate Limit / Burst / Quota

> The app gets no answer, so it tries again and again. Soon, too many requests arrive. The gateway answers 429: Too Many Requests. A few quick requests are fine. That is a burst. A limit per minute is a quota. Together, these rules are called rate limiting.

05:06–05:26 · WAF

> Some requests look unsafe. A rule stops them. But a bad rule can also stop a normal login. The gateway answers 403: Forbidden. This kind of check is done by a Web Application Firewall, or WAF.

05:26–05:44 · Schema

> The app should send a field called email. After an update, it sends userEmail instead. The gateway cannot find the field it needs, so it answers 400: Bad Request. This check is called schema validation.

05:44–05:55 · Forward

> Those were examples of what can go wrong. Our real request passes every check. Next, the load balancer picks a healthy server.

## Approved visual contract

- Use a 1920×1080 wide Remotion Living Architecture Map; unchanged backend world geometry. Ingress/context approx x=96–490, API Gateway center/portal approx x=525–1210, ONE diagnostic panel at a time approx x=1240–1818. Avoid central text congestion. Keep technical values around 30–36px for legibility.
- For every concept: show a real software behavior, show its observable *production-realistic* failure and root cause, then audibly introduce the technical name, reveal the matching name on screen, and hold briefly. Never lecture glossary-first; do not overuse 'is called' formulas.
- Routing: POST /api/v1/login succeeds toward auth-service. Diagnostic POST /api/v2/login has no configured route → 404; upstream NOT CALLED.
- HTTP Method: same address, POST accepted but GET rejected by POST-only policy → 405.
- Rate Limit: illustrative quota normal 12/100 req/min, retry 124/100 req/min → 429. Short burst example 5 req/10s. Auth service HEALTHY; rejected requests never reach it.
- WAF: normal request allowed; one too-broad rule WAF_LOGIN_1042 rejects a normal login → 403 (false positive). A WAF does not verify the password.
- Schema: expected JSON field email, app sends userEmail; gateway configured with schema validator rejects → 400.
- Important: these are illustrative production-realistic incidents, not independently verified historical outages. WAF and schema validation are config-dependent.
- The same canonical green request travels successfully through the entire scene. Failure examples use separate short-lived amber/red diagnostic packets and failure lane. Canonical request never falsely fails.
- After diagnostics, fade failures, show passed checks, let green circular packet exit to still-dim Load Balancer. No password-authenticated state yet. No sudden camera snap at shot boundary.

## Global language/story rules approved

**Concept First → Term Second.** Speak short common English. Avoid 'client', 'surges', 'legitimate', 'mismatch', 'endpoint', 'submission'. On-screen paths/JSON remain exact, but never pronounce literal slash characters. Technical names are taught naturally after the mechanism is understood. Apply this approach across future Architectural Thinking scripts.

## Implementation safety gate

Current MediaOS LockedScriptImportController rejects replacing a globally LOCKED Script. Director approval authorizes a planned *versioned* Script / Production Contract migration, not a blind overwrite. Preserve SHOT 01–04. Shift downstream planned markers consistently, then generate SHOT 05 voice + alignment, build/register Remotion SHOT 05, perform post-render QA, request Director preview/visual approval. Do not label SHOT 05 video 'LOCKED' before actual video review.

**Source assets:** `EP001_SHOT05_API_GATEWAY_DIRECTOR_APPROVED.md` and `EP001_SHOT05_API_GATEWAY_PRODUCTION_CONTRACT_APPROVED.json` exported in the project conversation on 2026-10-15. This event records canonical exact narration and production decisions for agents, independently of chat history.
