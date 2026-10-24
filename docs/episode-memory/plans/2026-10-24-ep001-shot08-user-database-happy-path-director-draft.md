# EP001 — SHOT 08: User Database / Account Lookup — Director DRAFT v1

**Authoring date:** 2026-10-24
**Status:** STORYBOARD + NARRATION DRAFT; **NOT Director LOCKED**; no voice generated, no shots rendered yet.
**Source of truth:** 2026-10-21 Director editorial scope LOCK — EP001 must depict successful login only through iPhone Dashboard. Preserve 2026-10-24 Director/native LOCK of SHOT 01–07 and the current 12:18.1 cumulative MP4 `1fcb24e2-99bc-4e97-85f1-cbafcfc4e94c`. Do not change old Script revision 3, and do not treat historical SHOT08 narration as active revised locked narration.

## The one visual question

**What does User Database return so Auth Service can verify the login, and why is finding an account NOT yet authenticating a person?**

The original mint/green LOGIN REQUEST remains waiting inside Auth Service. Only the separate cyan **USER LOOKUP** reaches User Database. The stored secret is **not** a plaintext password; the database returns an appropriate stored credential representation and parameters. The service does **not** announce success in this shot. The lookup and its response must be clearly separate packets and directions.

## Proposed runtime / cadence

Five independently revisable voice blocks. Working visual timing **0:00–1:35 (~95 seconds)**, subject to actual ElevenLabs/word-aligned voice clips and Director voice approval. Do not hard lock these timestamps; generate actual anchors from approved voice later. This is longer than a reel, but makes the camera's spatial reasoning clear. At 30 fps, visual-draft canonical checkpoints are 0 / 18 / 37 / 55 / 75 / 95 seconds.

## C01 — 0:00–0:18 — Arrival: one lookup, not a new login

**HEAR (English narration, DRAFT):**

"The cyan User Lookup has arrived at the User Database. This is not another login attempt. Auth Service is asking for a specific account, using the identifier the person submitted. Meanwhile, the original green Login Request is still waiting inside Auth Service. Nothing has been authenticated yet."

**SEE:** Begin in the exact same geography, palette and framing implied by the last frames of SHOT07 v10, where the separate cyan lookup reaches the database on the right. The original green request stays inside Auth, not duplicated or re-sent. The DB's cyan scan beam strengthens, then camera gently pushes toward the DB. Keep Auth Service legible as a static upstream context. No extraneous large floating headline/card.

## C02 — 0:18–0:37 — Find the matching record

**HEAR (English narration, DRAFT):**

"Inside the database, the lookup searches for an account record linked to that email address. Several records could exist in storage, but only the matching account becomes our focus. Its profile identifies which account we've found, and its settings may describe how that account is configured. Finding a record is not proof of identity."

**SEE:** Database opens to three restrained, legible rows. A saturated cyan scanner passes sequentially through them. The rows are fictional and illustrative; isolate the matching row (example email `alex@example.com`) with a turquoise outline, while two others remain neutral/dim. Expand this row into small **USER DATA** / **PROFILE** / **SETTINGS** surfaces: ID and name, selected preferences. Avoid personal real-user data.

## C03 — 0:37–0:55 — Access rights are not password verification

**HEAR (English narration, DRAFT):**

"The account may also have a Role and Scopes, which describe what it could be permitted to do after authentication. But those permissions answer a different question. They don't prove that the person who entered the password owns this account."

**SEE:** On the right, unfold a compact ACCESS RIGHTS module from the matched account record with two connected branches **ROLE** and **SCOPES** (for example regular user / read profile). Keep permission modules visually restrained: readable but not turned bright green. A subtle horizontal separation makes clear that access rights are metadata, *not* a success decision.

## C04 — 0:55–1:15 — Stored credential representation

**HEAR (English narration, DRAFT):**

"To verify the submitted secret, Auth Service needs the account's stored credential information. In a typical password-based design, this is a password hash and the parameters needed to check it — not a readable copy of the original password. The database can provide that information, but it doesn't decide whether this login is valid. That comparison still belongs ahead."

**SEE:** Matched record reveals a sealed **CREDENTIAL VERIFIER** module with compact hash-like blocks and `ALGORITHM / SALT / HASH` as illustrative, abstract metadata. Show no plaintext secret, no actual production hash, and no false side-by-side password comparison. The verifier appears in cool blue/cyan, **never success green**. Maintain optional visual label `STORED VERIFIER` for clarity.

## C05 — 1:15–1:35 — Return facts to Auth, set up SHOT09

**HEAR (English narration, DRAFT):**

"Now those account facts travel back from User Database to Auth Service. The cyan reply carries only what the next verification step needs. Watch what doesn't move: the original green Login Request is still waiting for a decision. We have found the account — but we have not yet verified the person. That's the next step."

**SEE:** Pull camera back to the exact established living architecture map. Animate **a cyan reply in the reverse direction**, from Database toward Auth, along the existing service-to-service connection, not through the original login path. Cyan movement returns toward Auth; mint login remains stationary in Auth. End composition with the cyan response arriving but do not run `MATCH`, `PASSWORD VALID`, `AUTHENTICATED`, `SUCCESS`, `TOKEN ISSUED`, or an iPhone Dashboard transition.

## Visual/style contracts

- Native Remotion SVG/React, 1920x1080 30fps, unified dark navy `#081B34`, premium restrained cyan `#36D9FF` or `#00DEFF`, existing teal/mint for original request. Refined lighting without washing out labels.
- Camera: wide map → precise DB zoom → account record focus → stored verifier → wide map return. Moves must be motivated; no gratuitous constant motion; give 5–10-second digestible beats.
- Object library intended for reuse: `UserDatabaseShell`, `AccountRecordRow`, `AccountMatchScan`, `ProfileSettings`, `AccessRights`, `StoredCredentialVerifier`, `AccountFactsReply`.
- Voice: write first; only use approved voice clips in subsequent production. No placeholder/generated narrator claims, no edits to SHOT 01–07 voices.
- Historical SHOT08 full text is a **reference**, not unchanged current script. Its `Session Management / Create / Refresh` portion is deferred; opening the dashboard is outside SHOT08.
- Hand-off to revised SHOT09: **Credential Verification**; stored verifier and submitted secret will be compared safely there. The outcome succeeds but not yet in SHOT08.
- QA: no plaintext password, one immutable original green request, one outbound cyan lookup, one returning cyan response, deterministic source objects, legible text at 720p review scale, matched record not misrepresented as authenticated, smooth continuity with SHOT07 closing geography.

## Director review gates

**Director to approve or revise:** English wording/voice mood, approximate duration, physical database representation, amount of detail about role/scope vs credential verifier, and hand-off composition. All visual/voice changes to SHOT08 are permitted while it is DRAFT; previous seven locked shots are untouched.
