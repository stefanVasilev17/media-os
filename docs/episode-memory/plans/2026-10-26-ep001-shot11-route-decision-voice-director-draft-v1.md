# EP001 — SHOT 11 — Route Decision / Logged-In UI — Director Voice Draft V1

**Status:** DIRECTOR_REVIEW / UNLOCKED Studio voice draft. The Director has not yet approved or locked any SHOT 11 narration or audio; never auto-generate ElevenLabs audio, auto-lock text, or auto-approve it.

**Context:** Follows the explicitly Director-LOCKED 72-second SHOT 10 `EP001-Shot10-SessionCreationPresentationV8`, original MP4 `7e55c59a-3102-4d4c-b23e-96c68ad1f286`. SHOT 10 ends with Successful Response arriving while Phone is still WAITING. In SHOT 11 the response arrives, Route Decision interprets confirmed authenticated state, then the Login screen clears and Dashboard becomes visible.

**Source basis:** Content adapted to the shortened SHOT 10/11 production flow from the original FULLY LOCKED EP001 Script's **SHOT 13 — Route Decision / Logged-In UI** (15:45–17:00). The original locked-script SHOT 13 narration, its number and production source are not edited, reopened or superseded in the database. The original October 3 SHOT 11 was a different subject ("Correct Password, But Not Logged In Yet"). This separate V1 working draft belongs to the **new** production SHOT 11 only.

**Working target:** ~72 seconds, 30fps, with three individual ElevenLabs clips; *approximate* time windows for storyboard only. Measure real generated audio timing and word alignment before visual/scene lock. English voice: natural, calm senior system architect / documentary-style explanation. No trailer tone, artificial hype or buzzwords.

## SHOT 11-C01 — 00:00–00:22 / Success reaches the client

**HEAR:**
> The successful response finally reaches the phone. Until now, the spinner meant the app was waiting for an answer — not that the login had already succeeded. The server has now confirmed the login, and the client can stop waiting. But there is still a decision to make: what should this person see next?

**SEE:** Keep established Presentation Architecture visual style and dark navy background. At beginning, response packet marked `200 OK` / `Proof attached` finishes the journey from SHOT 10 and lands on Phone. Do not show Dashboard yet; Phone transitions `WAITING` to `RESPONSE RECEIVED` with clean visual feedback. Avoid repeating the entire SHOT 10 animation.

## SHOT 11-C02 — 00:22–00:46 / Route Decision

**HEAR:**
> That is the job of Route Decision. First, the app needs a confirmed result and usable authentication state. Then it can choose the right destination. In some systems, the server sends a redirect. In others, the application handles navigation itself. Either way, the Dashboard should open because the login was confirmed — not simply because someone pressed the Login button.

**SEE:** Main presentation card `Route Decision`; concise indicators `Session confirmed`, `Authenticated`, `Identity applied`, and route choices `Login` vs `Dashboard`. Explain server redirect and client-side navigation as architectural alternatives, not simultaneous required processes. Active path highlights Dashboard only after confirmation.

## SHOT 11-C03 — 00:46–01:12 / Logged-in UI

**HEAR:**
> Now the technical work becomes visible. The spinner disappears, the Login screen gives way, and the Dashboard appears. The app can finally treat this as a signed-in user rather than an anonymous visitor. That does not mean unlimited access — individual actions may still need permission checks. It means the next request can begin with a trusted identity, without asking for the password all over again.

**SEE:** Phone Login dissolves into readable Dashboard UI; green authenticated state while the subtle purple / cyan proof relationship stays visible on the architecture diagram. Permission checks remain distinct from authentication. End with stable signed-in Dashboard ready for the next story, never prematurely change SHOT 10 ending.

## Visual and workflow rules
- Four-screen clean SHOT 10 is Director LOCKED and MUST NOT be modified.
- Reuse modern, presentation-quality Remotion/React/SVG architecture panels (opaque blue high-contrast cards, cyan flow, green success, purple token, amber caution), not sci-fi pseudo-3D.
- No frame or header labels `ARCHITECTURAL THINKING / EP001`, `SHOT XX / DIRECTOR REVIEW` or `SHOT XX / NN`; no icons overlapping text.
- Text and visual notes are proposals; after Director reviews, they may be revised. **No ElevenLabs generation or charges before the Director locks the individual text clips**. The Director approves the produced voice independently before any video render/lock.
- Save clips to isolated Studio SHOT 11, sourceShotKey=null, preserving existing canonical locked-script SHOT 01–16 records.
