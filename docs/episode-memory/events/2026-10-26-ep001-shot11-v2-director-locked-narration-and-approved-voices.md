# EP001 SHOT 11 — Voice V2 — Director LOCK

**Date:** 2026-10-26
**Director decision:** Explicit approval in chat, **"LOCKED!!!"**, immediately after reviewing the rewritten SHOT 11 voice narration V2.
**Creative status:** `SHOT11_V2_NARRATION_DIRECTOR_LOCKED`.
**Studio verification:** All three Studio clips were independently verified via `GET /api/v1/studio/shots` as `locked=true`, `generated=true`, `approved=true`. The audio was already generated and approved at verification time; this event does not regenerate it. **Do not alter or replace these original approved voice blobs, text, timing, or direction unless the Director explicitly authorizes a new revision.**

## Isolated Studio state
- SHOT 11: `Route Decision / Logged-In UI`.
- Studio shot ID: `0f164b33-bd45-4afd-abc5-90bfba735d1f`.
- Original locked canonical EP001 Script is NOT edited or unlocked; this is a separate Studio production shot immediately after Director-LOCKED SHOT 10.
- Studio link: https://media-os-backend-production.up.railway.app/#/studio?shot=SHOT%2011
- `SHOT 11-C01`: clip `bc6cc60f-7aad-4fe9-99c9-e61942d13d1e`, script revision **3**, audio generation revision **2**, locked/generated/approved.
- `SHOT 11-C02`: clip `399da60c-1e63-457f-929d-5c67374519cb`, script revision **2**, audio generation revision **1**, locked/generated/approved.
- `SHOT 11-C03`: clip `4e58d6dc-0045-4d85-8381-31339a8c1ffe`, script revision **2**, audio generation revision **1**, locked/generated/approved.
- **No new audio generation required.** Playback/QC and exact audio word alignment should be taken from the existing Studio approved recordings before Remotion timing is finalized.

## Locked narration (verbatim from Studio)

### C01 — What gets stored after response
> The response reaches the phone, but the important part is what gets stored. In a browser, a session cookie may be saved automatically — even if the page cannot read it. In a token-based app, the client may keep a token for later requests. The phone now has what it needs to continue without asking for the password again.

### C02 — Route Decision controls navigation, not server authorization
> Here is what Route Decision actually does. The app updates its authentication state from the server’s successful response, then checks which screen should be shown. Signed in? Open Dashboard. Not signed in? Stay on Login. But this check only controls navigation. It does not give the phone permission to read private data from the server.

### C03 — Protected Dashboard data request
> Opening the Dashboard triggers another request — this time for the user’s private data. The browser may attach its session cookie automatically, or the app may send an access token. The server checks that proof, then checks what this particular account is allowed to see. Only the permitted data comes back. That’s when the Dashboard fills in. A successful login never meant unlimited access.

## Director learning / visual requirements

The Director explicitly rejected an earlier SHOT 11 V1 draft because it **merely narrated UI changes** (successful response, spinner disappears, Dashboard appears), while explaining too little of the architecture and invisible operations. The Director expressly approved V2 for its concrete, educational details:
1. The browser may store an HTTP-only session cookie automatically; a token client may store reusable proof. Cookie handling and token storage are **alternative designs**. Avoid claiming every browser uses the same method.
2. Local Route Decision consumes authenticated client state to decide screen navigation; the client-side route does **not** itself grant backend data access.
3. Opening the Dashboard may trigger protected API calls. The browser may attach cookies or the application may add an access token; server-side authentication and per-account authorization precede private data visibility.
4. Dashboard shows authorized data only after the relevant response. Preserve the distinction between **authentication**, **client routing** and **server-side authorization**; do not present a client UI route as a security boundary.

For future Architectural Thinking scripts, **prioritize surprising but grounded invisible technical mechanics over generic narration of what the viewer already sees**. Every shot should deliver new architectural knowledge. Make the inner system legible with the approved Modern Presentation Architecture / Remotion-native SVG/React look: high-contrast solid panels, simple purposeful animation, concise human annotations, stable colors, no production debug headers and no badge/text collisions.

## Timing and delivery scope

- SHOT 11 three voice slots had a **working storyboard target** of 00:00–00:22, 00:22–00:46 and 00:46–01:12. **Do not assume the generated speech lasts precisely 72 seconds.** Measure all real approved audio durations and word-level alignments before visual timing/render. Do not truncate existing approved audio to force target durations.
- SHOT 11 VISUAL / final Remotion video is **NOT YET Director LOCKED**; this record locks V2 **narration and already-approved voice** only.
- SHOT 10 final canonical Clean Presentation V8, render `7e55c59a-3102-4d4c-b23e-96c68ad1f286`, remains immutable. SHOT 01–09 remain immutable as previously locked. SHOT 11 must start from Phone WAITING / response arrival, then proceed to Route Decision and Dashboard.
- Prior V1 draft `docs/episode-memory/plans/2026-10-26-ep001-shot11-route-decision-voice-director-draft-v1.md` is historical, **not approved**.

**Next action:** Remotion SHOT 11 presentation-architecture visual pass using the **same three already-approved Studio audio clips** and exact voice alignment, with a new Director-review preview, without touching SHOT 01–10.
