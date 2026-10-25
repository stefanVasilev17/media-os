# EP001 — SHOT 10 — Authentication State / Session Creation (SHORT DIRECTOR DRAFT)

**Status: NEW SHOT / Director review draft / NOT LOCKED.** Date: 2026-10-25. Existing SHOT01–09 immutable. The Director explicitly requests a *slightly shorter* SHOT10 because the approved nine-shot cumulative is already 17:10.9. This short successful-login bridge replaces the historical, now-deferred, failed-login SHOT10; never reuse the unapproved historical SHOT10 C01–C07 recordings or overwrite Script Revision 3.

## Production constraints
- **Target duration 72s / 2160 frames / 30fps** visual storyboard; adjust final length only after newly generated episode-scope voice alignment, not by stretching narration.
- Episode cumulative target **18:22.9** after the shot, excluding future successful return to Dashboard and final recap.
- Narration **draft only**, independent from the legacy 20-minute source and all preexisting DB voices; no legacy voice clip mutation, generation, or auto-approval.
- Same canonical original Living Architecture Map, reuse `AuthServiceTier2Shot08BridgeV8` with previously approved anchors, map frame at 4881, and the found-user-record variant. Do not redraw the global map.
- Prior SHOT09 ends at verified identity → Auth State, phone still waiting. Here establish a new reusable login proof, *not the logged-in dashboard yet*. Future SHOT11 covers success response and visible phone Dashboard.
- Two alternative architectural models: a server-held session referenced by **Session ID** or a client-presented **signed token** (JWT only as a possible token form). Do **not** imply both are generated at once, or that a token requires a cookie in every system.
- **TTL / expiry** is a property of remembered trust; do not depict “forever”. Avoid showing real credentials, fabricated cryptographic secrets, or overloading the screen with microcopy. Give Session ID/Token distinct visual treatments while keeping 2–3 labels readable per view.
- No irrelevant extra factor, MFA, failure/restore/retry path in this video.
- Minimum visual QA 720p and 1080p, all animation stages, legibility, card boundaries, first and last frames. Remotion `FAST_PREVIEW` 1280x720 only for review, unapproved until Director comments.

## Draft narration (~137 words, English)
**C01 — authenticated decision → state (approx. 0–22s):** “The password check has succeeded, but the phone is still waiting. That is because proving a login once is not the same as remembering it. The verified identity now reaches Authentication State, where the system can create proof it will recognize on later requests.”

**C02 — alternate session models (approx. 22–46s):** “One design stores a session on the server and gives the client a Session ID. Another design can issue a signed token. These are alternatives, not two steps every login performs. Either way, the password itself does not need to travel with every future request.”

**C03 — expiry, response and transition (approx. 46–72s):** “And that proof has a limited lifetime. When it expires, the system must check trust again. For now, Authentication State has created the proof, and the successful response can carry it back toward the client. There is still one final visible step: the phone must receive that response and leave the login screen.”

## Director visual choreography (72 seconds)
- **0:00–0:10** Show original already-known login architecture map with verified account record visible, then camera guides focus from Auth Service toward Authentication State. Do not create a second substitute global architecture.
- **0:10–0:26** Detailed Authentication State/Session Creation local-inspection board: verified identity packet enters, trusted proof appears, mint decision state lights. Keep spacious layout.
- **0:26–0:46** Two clear alternative models, SERVER SESSION → Session ID **OR** SIGNED TOKEN, animated emphasis changes between paths while both captions remain accurate. Avoid tiny metadata and “JWT = all tokens” simplification.
- **0:46–1:02** Highlight bounded TTL / expiry and trace of proof into Response Prep. No Login Success/Phone Dashboard yet.
- **1:02–1:12** Pull back a little, show response ready to move toward Phone; end with a visual handoff to next short SHOT11, not a new finale.

**Review gate:** director approves visual and spoken script separately before final voice synchronization/LOCK. Existing approved cumulative MP4 `fd1046d0-6b20-4267-8135-8b67add2ca33` protected and never appended to automatically.
