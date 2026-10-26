# EP001 — SHOT 12 — The Complete Login Journey — Director-Selected Script + Visual Plan (DRAFT)

**Director-selected:** 2026-10-27 — user explicitly prefers the following 3-part narration over the prior assistant proposal.
**Status:** DIRECTOR_SELECTED_NARRATION_DRAFT / NOT LOCKED. Do not claim script, voice, visuals or MP4 LOCK until explicit Director approval.
**Position:** immediately after immutable SHOT 11 Presentation V5.
**Scope:** EP001 successful-login happy path only. Do not introduce Session Restore, extended failure branches, or EP002 detail.
**Identity:** one production SHOT 12 containing three narration chapters C01, C02, C03. The three user headings "Shot 1", "Shot 2", "Shot 3" refer to these chapters, not new numbered episode shots.
**Source:** provided by Director verbatim. Do not silently rewrite, polish, shorten or reorder narration.

## 1. DIRECTOR-SELECTED ENGLISH NARRATION — VERBATIM

### C01 — user heading: Shot 1

Look at the Dashboard. To you, the whole journey was a tap, a spinner, and a screen that finally opened.

But the system never saw a button. It saw a message: credentials, headers, and context — assembled on your device and sent across the network to find the service responsible for authentication.

### C02 — user heading: Shot 2

The gateway handled the entry. The load balancer selected a destination. The Auth Service then asked the database for the account information it couldn’t safely guess.

It compared your password against the stored credential representation, without needing to retrieve the original password.

Every step answered a different question, and none of them could replace the others.

### C03 — user heading: Shot 3

Then came the part the spinner could never show you.

A successful password check became reusable authentication state. The response returned to the phone, the app opened the Dashboard, and a new request proved who you were before private data appeared.

That’s what really happens when you click Login.

Not just a password check. Not simply a new screen.

A distributed system takes a claim about who you are, verifies it, remembers the result, and uses it to decide what you can access next.

## 2. Runtime planning

- C01: 52 words; C02: 56 words; C03: 84 words; total: 192 words.
- Normal calm reading at 130–145 words/minute gives about 79–89 seconds before deliberate pauses and transitions. Plan approximately 100–110 seconds pending Director-approved ElevenLabs clips; do **not** force into the earlier assistant's 60–65 second estimate.
- After Director script LOCK, generate approved individual voice clips and obtain actual word alignment. Do not spend ElevenLabs credits or produce audio automatically from this draft.
- Working frame rate 30fps. Exact timeline, composition duration, and visual anchors are not LOCKED yet.

## 3. Shot 11 → Shot 12 continuity contract

- Exact SHOT 11 V5 Director master: render UUID `3a09dbd5-7ef8-4c0e-9621-12ca8a4b99a0`, source `remotion-engine/src/episodes/ep001/live-diagram/Shot11RouteDecisionPresentationV5.tsx`, source commit `08ff46681270f7cbf7ceac5f565bd627675718d0`.
- SHOT 11 ends on real authenticated Dashboard with authorized private data loaded via distinct `GET /account` request. SHOT 12 starts there, not on Login or an empty Dashboard.
- Do not edit, regenerate, trim, replace, or overwrite SHOT 01–11 approved masters or approved audio.
- Retain same modern Presentation Architecture visual family: background `#020811`, opaque blue panel `#17385F`, cyan request `#38CFF2`, green verified proof `#31D69B`, violet alternate token `#AA8DFF`, restrained amber `#F4B94F`; readable typography; realistic Phone.
- No director-review/debug labels burned into video; no giant text slabs; no particle noise / flashy sci-fi pseudo-3D / generic dashboards.

## 4. Proposed visual choreography — NOT YET LOCKED

### C01 | Dashboard → app-side assembly → network (narration-driven)

**HEAR:** exact C01 text above.

**SEE:** Start on the exact SHOT11 ending logic: populated realistic Dashboard on the Phone; approved Protected API/data states retreat to QUIET. As "whole journey was a tap, a spinner" is spoken, subtly connect present Dashboard to a small prior Phone login-state ghost/temporal cue, not a new login animation. On "But the system never saw a button" reveal Request Assembly near the Phone. On "credentials, headers, and context" reveal a compact composite Request with three layers, no plaintext password; subtle cyan data paths. On "sent across the network" follow the request toward Network/Transit. The already-known future backend stays quiet until next chapter. Slow, deliberate pull-back establishes the larger map while preserving the living-world continuity.

### C02 | Gateway → load balancer → Auth Service ↔ User Database

**HEAR:** exact C02 text above.

**SEE:** A cyan request pulse arrives at API Gateway, then Load Balancer selects an eligible Auth Service route. Avoid replaying whole mini-worlds; focus on links between responsibilities. Auth Service creates a visually distinct User Lookup packet that moves to User Database. Database returns account facts and abstract stored credential representation (never original plaintext password). Auth Service compares credentials and resolves a green verified outcome. On "Every step answered a different question" keep the current nodes visible, each with compact role cue or sequential activation, not a giant stacked checklist. The dependency route must be visibly bidirectional. Preserve semantic color/state and channel node identities.

### C03 | Credentials checked → proof created → separate protected request → populated Dashboard

**HEAR:** exact C03 text above.

**SEE:** As "part the spinner could never show you" lands, momentarily hold Phone/verification split. Confirmation transitions into Authentication State. Represent server-session reference OR signed token only as alternatives, not two mandatory sequential stages. Distinguish password/credentials from reusable proof by geometry and direction; the password does not travel on the next request. Successful response returns to Phone, its Dashboard is now the viewer's familiar end state. Show a second, separate `GET /account` event carrying cookie/session proof OR bearer token, followed by backend authentication and permission check; only then data becomes visible (match exact SHOT11 facts, no conflicting result). Resolve to a calm wider shot balancing the final Dashboard and the now understandable main architecture. Final narration lines land with no new labels or animation distractions.

## 5. Guardrails and production gate

1. The approved SHOT10 Session Creation V8 and SHOT11 Route Decision V5 already teach mechanics in detail; SHOT12 is a causal recap, never a third glossary lesson.
2. Preserve accurate distinction: password validation != creation of authentication state != checking permissions for a later protected API call. Client route navigation is not server authorization.
3. Do not suggest a session ID, cookie, JWT or specific authentication storage method is universal.
4. Avoid any re-introduction of EP001 old failure/session-restore shot list. Scope locked on 2026-10-21: successful Login only.
5. New Remotion composition and future preview must be derivative and isolated, never overwrite existing approval renders. Run visual QA for phone/card readability, diagram flow, cut continuity, voice timing, and actual audio/video duration/FPS before Director review.
6. Next gate: Director can explicitly LOCK this narration (verbatim). Only then authorize voice generation; after approved voice timing, implement and render shot for review, then separate visual/MP4 LOCK.
