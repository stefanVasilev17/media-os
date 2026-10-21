# EP001 — Auth Service / User Lookup — Director Educational Brief (DRAFT)

**Status:** Proposed production design for Director review. **NOT Director LOCKED; NOT yet an approved replacement script/voice pass.**
**Context:** EP001 Director editorial scope is LOCKED to the end-to-end *successful* Login, ending on a visible Dashboard. The SHOT 01–06 videos and all original voice recordings are LOCKED and immutable. No new SHOT 07+ narration/video is authorized by this draft.

## Main design argument

The Auth Service is the educational center of EP001. Do not compress it to a single animated label or explain it entirely through a monotone validation list. Use two linked scenes, separated by the User Database dependency, so the viewer sees *what the service knows*, *what it cannot know yet*, *what the database returns*, and *how a trusted decision is made*.

**Viewer must leave able to distinguish:**
1. Gateway/LB determine admissibility and destination; Auth Service evaluates identity proof.
2. A well-formed request is not an authenticated person.
3. Identifying an account via email or username is not proof of ownership.
4. User Database supplies stored account data, not a plaintext password; the password verifier checks the submitted password against a salted, slow stored verifier (Argon2id is a useful example).
5. Authentication (who is the user?) and authorization (what actions are allowed?) are distinct.
6. Successful credentials do not create a persistent login by themselves; secure authentication state/session proof is a separate subsequent step.

## Working revised timeline — starts after locked SHOT 06 (~09:35)

These are *design estimates only* pending voice alignment; do not recode old script revision 3 or claim final timings.

| Working sequence | Cumulative time | Length | Director focus |
|---|---|---|---|
| New SHOT 07 — Auth Service arrival and missing information | ~09:35–11:50 | 2:15 | Detail panel, request inspection, Account Identity, User Lookup |
| New SHOT 08 — User Lookup / User Database | ~11:50–13:25 | 1:35 | Original Login Request remains at Auth, distinct Lookup request returns account record |
| New SHOT 09 — Auth Service credential verification / account decision | ~13:25–14:55 | 1:30 | Secure verifier, account eligibility, Authenticated decision, no Dashboard yet |
| New SHOT 10 — Authentication State / session establishment | ~14:55–16:20 | 1:25 | Session reference/proof creation, TTL, safe delivery; no re-sending password |
| New SHOT 11 — Response route / logged-in Dashboard | ~16:20–17:20 | 1:00 | Response packet back to Phone, stop spinner, real Dashboard payoff |
| Closing full-map recap | ~17:20–17:50 | 0:30 | Show causal request journey, one honest bridge to VIDEO 02 |

**Estimated final run-time ~17:50.** Auth Service itself receives ~3:45 of dedicated explanation split across its introduction and verification; its User DB relationship receives another ~1:35. These are not filler minutes. Keeping 14–15 minutes requires a deliberate rewrite/compression of prior footage or of these new explanations, not pretending the total remains unchanged.

## Auth Service visual mini-world

Build reusable `AuthDecisionCore` in 2D Remotion, same established dark navy base and refined architectural language as locked SHOT 06; subtle controlled violet/magenta-blue identity edge (NOT a new visual world). Place it center-stage and larger than secondary cards. Layout: left `LOGIN REQUEST` ingress from **Load Balancer Instance B / Zone B**, top/center `VALIDATION STEPS` visible on demand, central `ACCOUNT IDENTITY`/decision chamber, right `USER LOOKUP` egress toward dim teal `USER DATABASE`; lower `AUTH DECISION` reserved for the returned account. All connectors have clear direction and gaps; avoid route/caption overlap.

- State A `RECEIVED`: the same green canonical request reaches Auth Service, but its identity is still unverified. Do not use success-green state to imply identity was authenticated. Mark inner status `UNVERIFIED`.
- State B `REQUEST VALIDATION`: illustrate request schema/required fields and permitted payload shape. It is not password correctness. In production the transport and input bounds are checked; avoid long disaster/security detours in this happy-path episode.
- State C `IDENTIFIER EXTRACTED`: the email/username determines which account may be checked; `ACCOUNT FOUND` does not mean the user is authenticated. If internal User ID is not already known, do not invent one at request ingress.
- State D `USER LOOKUP SENT`: create **a new blue/cyan lookup packet** carrying an account identifier, physically distinct from green Login Request (which stays anchored at the Auth Service), and draw its round trip to User Database. No password sent to lookup or shown in logs.
- State E `ACCOUNT RECORD RECEIVED`: record fields: `User ID`, `Account State`, `Password Verifier` (abstract salted hash + algorithm/work factor label). Profile and Roles/Scopes are secondary context, not proof of identity; render this as a clearly marked response from DB, not a second copy of the Login Request.
- State F `VERIFY CREDENTIALS`: abstract one-way salted password-verification input; use `password_verify(submitted_secret, stored_verifier)`, not plaintext equality or raw fast SHA-256 as a password storage best practice. Can mention Argon2id as a small expert card, not a mandatory algorithm for every implementation.
- State G `ELIGIBLE + VERIFIED → AUTHENTICATED`: check credentials and applicable account policy, then show an explicit affirmative auth decision and an output event toward `AUTHENTICATION STATE`. Phone remains waiting until response/establishment.
- If `TOKEN STATUS / Expired / Revoked` exists on the canonical map, keep it dim/inactive in a fresh password-login flow. Do not run existing-session validation as if it were mandatory on every new password login; reserve deep refresh/revocation for later episodes.
- If using an MFA/second factor, depict it as a conditional system policy outside the minimalist canonical successful-password flow, not as universally absent or as a universal mandatory extra step.

## Narration sample (tone target, not fully approved script)

> The Load Balancer has answered where our request should go. Now the Auth Service must answer a very different question: should the system trust the person behind it? A correctly shaped login request tells us what was submitted, but it does not prove who submitted it. Even an email address is only a claim. Before the Auth Service can accept that claim, it has to find the account and retrieve the information needed to verify the password. So instead of sending our original request straight to the database, it creates a new User Lookup. The original request stays here, waiting for the missing facts.

> The database never needs to return a readable copy of the password. It returns a stored verifier. The Auth Service checks the submitted secret against that protected representation, applies any relevant account policy, and finally reaches a decision. But the phone is still waiting. A verified password is proof for this attempt; the app still needs secure authentication state so the next request doesn't have to send that password again.

## Security correctness guardrails — source-informed, separate from existing Production Bible

- Transmit passwords over authenticated TLS; do not expose password, raw stored hashes, tokens, session IDs or credentials in UI logs/telemetry. The input password reaches the verifier in a protected backend path.
- Store passwords using an appropriate *salted, slow password hashing* approach (for example Argon2id), not plaintext/reversible encryption; show password verification and metadata, not direct plaintext comparison.
- Production systems require abuse protections like login throttling and strong authentication policies. Explain their existence through a short supporting cue or voice aside, not as a retry/disaster side-plot.
- Keep user identifier lookup and credential verification logically distinct; avoid confusion between Authentication and Authorization.
- Security/session proof is a different design choice: an opaque server-side session reference vs signed token such as JWT; do not teach that JWT is required, or that cookie-based session is identical to JWT. If the visual Phone means a **native mobile app**, do not universally claim it uses browser `Set-Cookie`; show a general protected auth proof and describe platform-specific delivery only if needed. If depicting web-browser scenario, cookie security attributes `Secure`, `HttpOnly`, `SameSite` are standard safeguards in suitable contexts.
- Treat `Account Locked / Disabled` and failure exits as *future episode territory* except a one-second assurance that policy also matters for whether an account may proceed.

References to verify the security treatment:
- https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
- https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
- https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html
- https://pages.nist.gov/800-63-4/sp800-63b.html

## Director checkpoints before implementation

Before any render or new voice generation, confirm (a) ~3:45 Auth-focused narrative split over two parts, (b) clear separation between login request / lookup query / database reply, (c) the revised timeline and final episode length range, (d) the visual object family with Auth Service as decision core, and (e) a fully revised English voice and HEAR/SEE storyboard for Director approval. Never unlock or change SHOT 01–06, even if the revised timeline suggests adjustments.

**Next production action when Director is ready:** build an episode-level revised chronology, then a precise SHOT 07 storyboard with text/voice pacing and Remotion object inventory; do not start by adding every Token Status/Session Management branch at once.
