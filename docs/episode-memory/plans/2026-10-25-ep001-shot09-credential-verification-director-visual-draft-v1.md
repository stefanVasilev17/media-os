# EP001 — SHOT 09 — Auth Service / Credential Verification — Director Visual Draft v1

Status: DRAFT — not LOCKED. Source: MediaOS locked Script revision 3, verified original SHOT09 approved voice clips on 2026-10-25. Editorial: successful login journey; historical failure/slow User Database SHOT09 is deferred to EP002 and MUST NOT replace this current scene.

## Original approved voice — do not regenerate or rewrite
- SHOT 09-C01: 35.781s. Submitted password and stored protected verifier enter the correct verification process. No readable-password comparison and no decryption.
- SHOT 09-C02: 31.141s. Verification success, active account, checks satisfied; MFA is conditional if a system requires it; decision is authenticated.
- SHOT 09-C03: 32.261s. Authentication is identity/proof; authorization is permissions/access. Member and admin have different capabilities even when both are authenticated.
- SHOT 09-C04: 32.181s. Approved login is not yet a persistent logged-in phone state; the next architectural node is Authentication State, enabling later recognized requests.
Existing four original ElevenLabs C01–C04 generation revision 1 stay immutable.

## Visual choreography (provisional 136s edit with holds)
1. 0–36s — User Database hands account facts to Auth Service. Two large separate cards SUBMITTED PASSWORD (masked) and STORED VERIFIER (digest) feed one PASSWORD VERIFICATION process. Focus on one-way verification; don't show misleading plaintext equality.
2. 36–67s — Green verification result and account status; optional second-factor information explicitly CONDITIONAL. Required checks satisfied -> AUTHENTICATED decision, but no phone session issued yet.
3. 67–100s — Premium Aha split panel: AUTHENTICATION / WHO ARE YOU? (mint) versus AUTHORIZATION / WHAT CAN YOU ACCESS? (violet). USER and ADMIN access differences clearly depicted; neither role is implied by the correctness of the password alone.
4. 100–136s — Move across same living map toward AUTHENTICATION STATE, leaving Auth Service authenticated but the distant phone still waiting for a durable login state. End at the handoff ready for next shot.

## Hard constraints and inherited SHOT08 design lessons
- Match AT_FONT, dark navy #07192F, surface #0D304B, cyan #58E6FA, mint #60EFC7, violet #BEB4FF. Place clear labels in centered containers with measured gutters and no text overflow.
- No on-screen KDF or Argon2id technical labels or unexplained jargon. Honor exact approved narration. Avoid tiny text. QA the transitions, not only still frames.
- Locked SHOT01–08 original MP4s and approved ElevenLabs audio are immutable.
- Build this as an independent Remotion SHOT09 DirectorVoiceV1 composition and review MP4; only Director can LOCK it. Do not include an unapproved SHOT09 in the existing 8-shot cumulative preview.
