# EP001 — SHOT 07 — AUTH SERVICE / VALIDATION STEPS
## Director Visual Pass v2 — comprehension, pacing, continuity and collision-safe layout

**STATUS: VISUAL DIRECTOR-REVIEW DRAFT v2 — NOT VISUAL LOCKED.**
**Voice: C01–C05 approved/Director LOCKED, original audio immutable.**
**Reference:** SHOT 06 Director-approved v5 full 171.243-second review MP4, inspected at 0, 3, 7, 9, 11, 22, 36, 48, 70, 88, 105, 123, 142, 148, 156, 160, 164, 168 and ~170 seconds. Confirmed SHOT 06 ends back on the familiar horizontal Living Architecture Map. The selected Load Balancer branch reaches the Auth Service on its right; User Database is visible but inactive farther right. Do not assume the current MediaOS-native SHOT06 QA/LOCK is complete; it remains tracked in issue #89.

**The director's change request:** meticulous and beginner-clear correspondence between what is said and what moves; deliberate air between the five approved voice recordings; no snap cuts between visual chapters; professional layout with zero intersecting objects, clipping, or label spill; one continuous architectural world established by SHOT 01–06.

This is an implementation-ready storyboard, but **actual audio durations and word-level alignment have not been retrieved in this document**. Every spoken trigger is an exact phrase from the approved voice pack and is resolved to a frame from stored ElevenLabs word alignment during implementation. Previous editorial timecode 515–724 seconds is a planning estimate, **not a final video duration**.

---

## 1. Definition of success — what the viewer must understand, in order

We are not merely listing five validation cards. By the end of SHOT 07 a first-time viewer must be able to explain:

1. Load Balancer selected an available **Auth Service Instance B / Zone B**; it did not validate the person's identity.
2. The Auth Service receives an **account identifier** (in this example, an email) and a submitted **password**. An identifier is a claim; a password is a secret offered as proof, not yet checked.
3. **Request Validation** tests presence, acceptable shape and size/limits of the incoming data. It is *not* the correctness of the password. Even a structurally valid request can fail to authenticate.
4. The Auth Service cannot verify the password yet because the stored account information is elsewhere.
5. It retains the original **green Login Request**, creates a **different cyan User Lookup** asking for account facts, and sends **only the account identifier needed for lookup** toward User Database. The login has not succeeded and the phone remains waiting.

**Editorial principle:** show the concrete state first, pronounce/label the term, then show why the next action follows. Every new information layer earns its appearance from the narration. Do not overload the screen with unexplained technical words.

**SHOT 07 is a successful-password-login story.** No retry storm, red failure path, circuit breaker, Account Locked state, actual failed-password attempt or token expiration/revocation demonstration. Any existing Token Status / Expired / Revoked map objects stay background-dim if visible at all; password-login validation does not magically inspect a previous token that is not present.

---

## 2. Non-negotiable visual continuity with the Director-LOCKED footage

The final map frame of SHOT 06 v5 includes Phone far left, Request Assembly, Network/Transit, API Gateway, Load Balancer, Auth Service, and User Database **horizontally in one established world**. The recognizable thin wire, the canonical travelling green packet, the dark navy, node edges and violet/teal hues must remain continuous.

- **First SHOT 07 frame:** inherit the same map framing, camera easing/end transform, horizontal node order, path geometry, dim context and active Load Balancer-to-Auth handoff. No reset to an unrelated title slide or suddenly rebuilt map. The SHOT 06 last frame is the **visual matching reference**, not a request to edit SHOT 06.
- **Auth Service is one existing node, not a second invented Auth Service.** Zoom/pan into that node with a progressive detail reveal. Do not let it teleport to the centre, duplicate its shell or change its identity to a new visual style.
- The three small Load Balancer instances from SHOT 06 are **routing targets**, not three *additional full-sized Auth Services* to draw again. The selected Instance B is the origin of the close-up. Make its connection to the Auth Service explicit only once.
- **Canonical green packet** should move to the input port and stop there. The packet should not be cloned into User Database. Later **cyan lookup packet** is a separate child request, not a green packet repainted to cyan.
- Keep User Database to the **right** of Auth Service. It is visible as a dim geographic destination during wide-map moments, and may appear enlarged only at the planned handoff toward SHOT 08.
- Camera movement grammar continues SHOT 06: first coherent horizontal travel along the wire, then a restrained 0.9–1.3 s push into the Auth decision mini-world, then stability for the explanations. No repeated zoom in/out between C01–C05.
- Node styling stays premium: deep navy (#010711 / #020811 family); thin indigo/violet Auth border; green only for the canonical request or genuinely confirmed status; cyan for lookup; muted blue-gray for inactive context. Do not re-colour the entire Auth Service green merely because a well-formed request passed validation.
- Preserve all approved SHOT 01–06 videos and audio byte-for-byte. No edits to the existing SHOT 06 render.

---

## 3. Audio-first pacing contract: five clips, real gaps, no jarring cut

**Audio preservation:** use the stored Director-approved C01–C05 files as-is, in order, without TTS regeneration, speed adjustment, destructive silence trimming, pitch changes, deleted breaths or new narration. Build the timing from actual generated audio duration and **audible speech boundaries**. If a voice file already contains natural leading/trailing silence, account for that instead of accidentally doubling a long pause.

| Moment | Initial director pacing target | On-screen purpose |
| --- | ---: | --- |
| SHOT 07 opens before C01 | 0.8 s / 24 frames | Hold inherited map continuity; register the selected Instance B route |
| C01 → C02 | ~1.2 s / 36 frames | Hold the still-unverified Auth state after explaining its responsibility |
| C02 → C03 | ~1.0 s / 30 frames | Let identifier/password remain visible before checks begin |
| C03 → C04 | ~1.5 s / 45 frames | Hold **REQUEST VALID ≠ AUTHENTICATED** long enough to read |
| C04 → C05 | ~1.2 s / 36 frames | Pause on missing account facts and dim User Database dependency |
| End of C05 / SHOT08 boundary | ~1.8 s / 54 frames | Follow cyan lookup along the existing rightward connector, leave geography ready for SHOT 08 |

These are **initial upper-level directing targets**, adjustable approximately ±0.2–0.4 seconds after listening to the real approved files. Do not insert abrupt silence *inside* spoken sentences; each gap occurs **between** audio recordings. Do not use a frame-black cut, freeze a zoom mid-flight or stop a packet halfway across a connector without narrative intention. A “breathing hold” means a stable composition with subtle, purposeful activity, not dead screen time.

**One ownership rule for the SHOT07 → SHOT08 gap:** C05 ends, cyan lookup continues on the same wire. Transition hold is owned **once**, by the SHOT 07 ending or SHOT 08 opening—not both. SHOT 08's first frame must continue from the same moving/carry-over request state. A continuous camera pan over the shot boundary is preferred to a cut.

Use **30 fps**, and place clip starts as cumulative actual playable durations plus these holds. Word-level semantic anchors should be resolved *per clip*, translated into global SHOT07 frames after gap insertion, then monotonic-checked. Do not assume old absolute editorial range 515–724 exactly equals the approved audio runtime.

---

## 4. Layout specification — engineered for 1920 × 1080 and small-screen playback

The Auth detail is a **focused enlargement of the existing map node**, not a slide with a generic dashboard. Use a consistent 1920×1080 coordinate space. Positions below are reference rectangles for the panel's fully-open MEDIUM shot; responsive camera transforms must preserve the same safe constraints.

### Frame and object geometry (reference at 1920×1080)

| Element | Reference rectangle or corridor | Content / restrictions |
| --- | --- | --- |
| Outer safe region | x=110–1810, y=90–990 | Do not position essential text or live packet labels outside this region |
| Auth detail shell | x=150, y=122, w=1620, h=826 | Single violet/indigo border; no nested duplicate full-screen frame |
| Header/title | x=208–1655, y=157–240 | **AUTH SERVICE**, one status label, no tiny corner metadata |
| Inbound request area | x=210, y=320, w=390, h=420 | Existing **LOGIN REQUEST**, Account Identifier, masked Password, clearly “RECEIVED” |
| Reasoning / validation area | x=660, y=320, w=540, h=420 | **REQUEST VALIDATION**, three large check rows; reveal one at a time |
| Decision / missing facts area | x=1260, y=320, w=425, h=420 | **IDENTITY UNVERIFIED**, later **ACCOUNT DATA NEEDED**, no success check |
| Bottom flow/bridge corridor | x=225–1680, y=790–906 | Readable single-direction progress strip; no multiline explanation, reserved connector ports |
| Main vertical gutters | at least 60 px between the three major blocks | Explicit no-object / no-label zone |
| Distance to panel rim | at least 36 px | No label touches/clips border, shadows or rounded corners |

The *three-column view is a maximum-information overview*, not a demand to show all columns at full brightness simultaneously. Use opacity/context to direct one information step at a time. At clip C01 primarily title + incoming request + decision question are active; C02 focuses the inbound content; C03 focuses the validation lane; C04 focuses the missing data decision and outside dependency; C05 simplifies detail and smoothly returns to the regional map for lookup travel. The shell can adapt internal spacing before labels shrink.

**Typography hierarchy:** clear Inter/SF family, near-white primary, high-contrast muted labels. Aim approximately 48–56 px for the hero title; 33–40 px for large state words; 30–34 px for primary field/step labels; ~28 px minimum for any truly necessary secondary label in the 1920 master. Small decorative metadata is forbidden. View the exported 1080p frame at laptop and phone landscape size; if a term cannot be read on the phone, **reduce information**, not font size. Prefer two short lines with allocated height to a cramped one-liner.

**Pre-approved visible text (the actual strings, case may follow canonical style):**
- AUTH SERVICE
- LOGIN REQUEST
- ACCOUNT IDENTIFIER
- alex@example.com (fictional example, optional; do not show a real address)
- PASSWORD / ••••••••••••
- RECEIVED
- IDENTITY UNVERIFIED
- REQUEST VALIDATION
- REQUIRED FIELDS
- EXPECTED FORMAT
- INPUT LIMITS
- REQUEST VALID
- NOT AUTHENTICATED
- ACCOUNT DATA NEEDED
- USER LOOKUP
- User key: alex@example.com (optional, use one compact key field)
- USER DATABASE (dim until selected)

Do **not** put narration paragraphs into cards. Do not show actual passwords or their hash, security secrets, personal information, unnecessary terms (TOKEN EXPIRED, REVOKED, JWT, MFA, Argon2id) or future-success state in this shot. For exact copy, avoid ambiguous “USER ID” in the incoming form: the narration identifies the submitted input as **email**; internal User ID is typically retrieved *after* lookup.

**String-fit acceptance:** measure *rendered* text dimensions using the loaded typeface and actual weight at final scale. For each live text box: text width ≤ available inner width minus ≥24 px buffer on both sides; baseline/line height fits vertically; no ellipsis or auto-font-collapse for meaning-bearing fields. All text must remain inside its owning component's padded rectangle after camera transforms and glow. If not: widen/relayout first, or use deliberate two-line title where semantically safe. These numbers are design guides, not a claim that an unrendered layout has already passed.

### Connector and packet collision rules

- Green ingress terminates at the **left-facing Auth input port**, not over the header or field text.
- Cyan User Lookup begins at a **right-facing lookup output port**, not inside green Login Request's bounding box. It follows a separate outward connector to User Database.
- Reserve a >=24 px clear corridor around the moving packet, and >=28 px between any connector stroke and an unrelated text bounding rectangle. Connector can intentionally meet its own port, never cross unrelated labels.
- Paths connect at port centre points on rectangle boundaries, not floating a few pixels outside. Reuse existing horizontal topology when zooming back out.
- Object silhouette and text boxes must not overlap at 100% opacity. Parent-owned inset elements are intentionally contained, but siblings must not overlap; do not solve collisions by putting arbitrary z-index layers above each other.
- No particle/glow can meaningfully obscure a primary word; drop excess bloom before reducing contrast or shrinking labels.
- Avoid UI rails at the bottom that collide with the 1920×1080 video safe region.

---

## 5. Exact five-clip HEAR → SEE directing plan (no narration changes)

Every phrase below is an **exact extract from the approved English voice pack**. The excerpt is used only as a timing cue; the actual voice source is the entire unchanged clip.

### C01 — “What does Auth Service actually do?” — arriving somewhere vs verifying someone

**Scene starts on the final wide-map state of SHOT 06.**

- On “**Our Login Request has finally reached the Auth Service**”: complete the final 15–25% of the canonical green packet's already established path into the selected Auth input. Hold the exact port position for ~0.4–0.7s. Do **not** duplicate the packet or show the phone as authenticated.
- On “**The Load Balancer selected Instance B**”: keep the selected route and Instance B visibly highlighted (re-use SHOT06 green selected-target grammar), then quiet it rather than extinguishing it instantly. Small visual trace retained to connect the geography.
- On “**which server will do the work**”: establish a compact two-part contrast at the top: **DESTINATION SELECTED** (small, resolved) and **IDENTITY UNVERIFIED** (large, unresolved). This is the initial “aha”; contrast states rather than drawing more flow arrows.
- On “**whether the person trying to log in is actually who they claim to be**”: camera pushes inside the *same* Auth node, slowly enough to preserve spatial context. A protected, unlit decision core appears as the stable centre.
- On “**Its responsibility is authentication**”: title AUTH SERVICE becomes crisply readable; reveal the single state **IDENTITY UNVERIFIED**. Avoid an oversized green success check or a padlock icon that implies success.
- On “**checking whether someone can prove**”: lightly emphasize the unknown/proof-required edge of the decision chamber, then hold. Pause ~1.2 s before C02 to allow the idea to settle.

**Why the viewer understands:** “The Load Balancer picks a server; the Auth Service decides whether the claimed identity can be proven.” Never let an input-health label stand in for identity verification.

### C02 — “What information does it receive?” — show the concrete evidence being claimed

- On “**Let's look at what arrived**”: keep the camera stable and reveal one inbound card labelled **LOGIN REQUEST**. It stays bound to the green packet's ingress.
- On “**an identifier, such as an email address, and a password**”: show **ACCOUNT IDENTIFIER: alex@example.com** first, then **PASSWORD: ••••••••••••**. This is a masked illustrative value, not an animation of the true original password. Use two spacious rows; do not show unmasked characters at any frame.
- On “**which account we want to access**”: illuminate only the identifier row. A discreet link can lead *toward* the yet-dim lookup region, but do not move a packet or reveal an existing internal User ID.
- On “**the secret we are offering as proof**”: illuminate only the masked Password row. Never show a green Verified state; no database password comparison yet.
- On “**does not automatically mean they are correct**”: both row highlights settle and the **IDENTITY UNVERIFIED** status holds centre/right. Clear distinction between RECEIVED and VERIFIED.
- On “**a request it can properly process**”: focus shifts to the dormant validation lane. Keep both input rows pinned, neat and legible. Hold ~1.0s between clips before starting checks.

**Why the viewer understands:** “Email tells the system which account; password is the offered secret; neither is accepted merely on arrival.” The viewer can point to both fields and say what they do.

### C03 — “Understanding Validation Steps” — format is not proof

- On “**This first stage is called Request Validation**”: brighten the middle **REQUEST VALIDATION** area; leave the original request visibly connected on the left and the decision dim on the right.
- On “**the email field is empty**”: softly outline the existing REQUIRED FIELDS step as a *conceptual illustrative check*. **Do not replace the successful canonical email with an empty value**, do not show a failed login branch or new red alert. We explain a hypothetical problem while the current request remains valid.
- On “**information arrives in a format the system doesn't understand**”: emphasize the EXPECTED FORMAT row. Briefly show a quiet format glyph/pattern; do not cram fake JSON strings or dense payloads into the card.
- On “**required information exists**”: mark REQUIRED FIELDS with a compact check.
- On “**expected structure**”: mark EXPECTED FORMAT with a check.
- On “**within acceptable limits**”: mark INPUT LIMITS with a check. The sequential changes are the consequence of the spoken text, not a rapid 3-check animation at clip start.
- On “**A valid request is not the same as a successful login**”: show **REQUEST VALID** clearly on the validation lane, while **NOT AUTHENTICATED** (or **IDENTITY UNVERIFIED**) stays independent in the decision lane. Keep both outcomes legible *simultaneously* for ~1.5s following C03. Optional restrained divider/≠ symbol; never a red error marker that could imply the successful path failed.
- On “**even when the password is completely wrong**”: keep this as spoken hypothetical only; do not simulate a wrong-password attempt, since no credential verification has run.

**Why the viewer understands:** the three format gates succeed while the authentication decision stays unresolved. This is the main extractable micro-lesson / Reel in SHOT 07.

### C04 — “Why do we need User Lookup?” — identity claim still needs a source of facts

- On “**the request has passed those basic checks**”: settle the green/teal **REQUEST VALID** badge; do **not** advance IDENTITY UNVERIFIED.
- On “**it still doesn't know whether the password belongs to that account**”: use a two-column fact comparison with existing data **WE HAVE: EMAIL + SUBMITTED SECRET** vs missing **WE NEED: STORED ACCOUNT FACTS**. This is a temporary explanation overlay inside the centre/right lanes, with large labels only, not a new rectangular dashboard.
- On “**Knowing your email doesn't make them you**”: shift emphasis to ACCOUNT IDENTIFIER and to the unresolved proof state. An optional subtle dotted **CLAIM** outline can reinforce it; **do not create an identity-theft subplot** or introduce anonymous actors that might distract.
- On “**find the actual account associated with that email**”: reveal a restrained connection from the Auth Service decision side toward **USER DATABASE**, still dim. The missing dependency visually earns its entrance.
- On “**retrieve the information required to check the password**”: highlight **ACCOUNT DATA NEEDED**. Do not show the verifier yet: that belongs in SHOT 08.
- On “**creates a new internal request called User Lookup**”: reveal the cyan **USER LOOKUP** envelope *inside its dedicated output area*, without sending it yet. Pause ~1.2 s before C05. Original green Login Request stays anchored.

**Why the viewer understands:** the Auth Service has the submitted password but **not the trustworthy stored verifier**, so it must ask its database for account facts.

### C05 — “Two requests, two different jobs” — the most important spatial distinction

- On “**Our original Login Request stays inside the Auth Service**”: briefly highlight the **original green request parked at the left input/inbox** and the still-unverified decision. It does not move toward the database.
- On “**a second request travels toward the User Database**”: activate the distinct **cyan User Lookup** packet at the right output port. Camera transitions from stable interior detail to a MEDIUM/WIDE regional view without changing node order, then follows cyan movement rightward along a single clear connector.
- On “**This second request is not another login attempt**”: display both packet identities visibly at once for a readable beat: **LOGIN REQUEST** (green, stationary in Auth) and **USER LOOKUP** (cyan, moving toward Database). Do not place the two labels on the same path or obscure a node title.
- On “**a question from one part of the system to another**”: connection visibly joins Auth Service to User Database, not Auth Service to the Phone or Gateway. No full-size copy of Auth Service appears.
- On “**do we have an account matching this identifier**”: show optional concise **User key: alex@example.com** within the lookup packet's dedicated readable callout; no actual password, no User ID invented in advance.
- On “**what information do I need to verify it**”: end on the cyan packet approaching the User Database input port; the database remains closed/dim until SHOT 08. Hold the same regional frame ~1.8 s for the handoff rather than cutting to a totally new database slide.

**Why the viewer understands:** two different pieces of work exist concurrently. Green is the user's Login Request, kept inside Auth Service; cyan is a new question the service asks the database.

---

## 6. Camera, object and color state machine (reusable, not five separate slides)

**Camera:** MAP_HANDOFF → AUTH_APPROACH → AUTH_MEDIUM_STABLE → AUTH_VALIDATION_FOCUS → AUTH_DEPENDENCY_FOCUS → LOOKUP_EXIT_REGIONAL. Each camera mode is deterministic and interpolates from its predecessor; changing clips never automatically resets camera to its initial value.

**Persistent objects:** original Phone (dim/waiting off-axis), Load Balancer, selected Instance B path, Auth Service shell, green Login Request, dim User Database, rightward connector. Persistent within the focused Auth mini-world: Request Inbox, Validation Lane, Unverified Decision, Output Port. At C05 introduce one cyan lookup packet **once**. Object IDs persist across clips and their visual active/quiet states change, not their identities.

**Semantic role/state mapping:**
- Auth Service contour: violet/indigo, brighter when focused; never full success-green.
- Green request: canonical user request, parked at Auth; semantic color does not certify identity.
- Validation check states: subtle mint/teal for well-formed request only; restrained.
- Authentication core: low-intensity violet/gray with **UNVERIFIED** until SHOT 09.
- Cyan lookup: new internal database query, never borrow the green Login Request identity.
- User Database: dark, teal edge becomes context-visible at C04 and only becomes primary in SHOT 08.

**No accidental behaviors:** do not activate token status, session creation, Dashboard, database response, password match, auth success or failure. Those are future story beats.

---

## 7. Semantic anchors and deterministic event implementation

Use exact approved **English audio phrasing**. At build time, find each phrase in the word alignment associated with the corresponding immutable clip, normalize punctuation/apostrophes/case, then convert local spoken time to the global frame **including all chosen inter-clip holds**.

Required anchor families (names are proposed, phrase matches are exact or unique subphrases):

| Clip | Required anchors |
| --- | --- |
| C01 | AUTH_ARRIVAL = “Our Login Request has finally reached the Auth Service”; INSTANCE_B = “The Load Balancer selected Instance B”; ROUTING_NOT_TRUST = “which server will do the work”; AUTH_DEFINITION = “Its responsibility is authentication”; PROOF_QUESTION = “checking whether someone can prove” |
| C02 | INBOX_OPEN = “Let's look at what arrived”; INPUT_FIELDS = “an identifier, such as an email address, and a password”; IDENTIFIER_ROLE = “which account we want to access”; SECRET_ROLE = “the secret we are offering as proof”; NOT_YET_CORRECT = “does not automatically mean they are correct”; FORMAT_PREP = “a request it can properly process” |
| C03 | VALIDATION_NAME = “This first stage is called Request Validation”; EMPTY_FIELD_EXAMPLE = “the email field is empty”; FORMAT_EXAMPLE = “information arrives in a format the system doesn't understand”; REQUIRED_CHECK = “required information exists”; STRUCTURE_CHECK = “expected structure”; LIMITS_CHECK = “within acceptable limits”; VALID_NOT_LOGIN = “A valid request is not the same as a successful login” |
| C04 | CHECKS_PASSED = “the request has passed those basic checks”; PASSWORD_UNKNOWN = “still doesn't know whether the password belongs to that account”; EMAIL_CLAIM = “Knowing your email doesn't make them you”; FIND_ACCOUNT = “find the actual account associated with that email”; GET_FACTS = “retrieve the information required to check the password”; LOOKUP_BORN = “creates a new internal request called User Lookup” |
| C05 | ORIGINAL_STAYS = “Our original Login Request stays inside the Auth Service”; LOOKUP_TRAVELS = “a second request travels toward the User Database”; NOT_SECOND_LOGIN = “This second request is not another login attempt”; SERVICE_QUESTION = “a question from one part of the system to another”; LOOKUP_ACCOUNT = “do we have an account matching this identifier”; INFORMATION_FOR_VERIFY = “what information do I need to verify it” |

**Anchor QA rules:** each phrase must resolve to a unique, increasing spoken location within its OWN clip; no event starts before it is verbally justified; a concept's visual emphasis may persist after the trigger. If the exact speech-to-text transcript differs slightly, confirm manually against the real approved audio; do not rewrite the locked narration to make a lookup pass. Use explicit cue overrides only with Director-reviewed evidence. Never claim we have verified anchor timestamps before reading the live alignment.

**No hardcoded “at second 87, show identity” conditions.** Scene-local event times are derived from clip boundaries + semantic anchor frames and interpolated via declarative state/camera events. Layout geometry and hierarchy remain stable while state changes.

---

## 8. QA / acceptance tests before sharing a playable MP4

**Visual geometry (mandatory):**
1. Render SHOT07 at final target **1920×1080, 30 fps**; no lower-resolution video accepted as final. Use 720p only for labelled preview if it improves iteration.
2. Inspect first and last frame and regular samples at **≤0.5s** intervals, and additional samples **±0.25s around every semantic anchor, clip boundary, camera move and packet turn**.
3. For every frame sampled: all essential text boxes are inside their parent inner rectangles and the outer safe region; no header or value is clipped, scaled below permitted font size, ellipsized unexpectedly or covered by another opaque item.
4. Implement measurable **rectangle intersection checks** for sibling service blocks, labels, badges, packets and captions. Parent/child containment is intentional and exempt; sibling overlap at readable opacity is a fail. Separately test connector-to-label intersection except for deliberately touching endpoint/port.
5. Check **entire 0–100% camera interpolation**, not only final static states. Count glow/shadow masks as part of overlap where they obscure a meaningful label. No camera zoom that sends an essential state label beyond video-safe boundaries.
6. Inspect actual strings at 1920 and 1280 delivery scale: **LOGIN REQUEST**, **ACCOUNT IDENTIFIER**, **IDENTITY UNVERIFIED**, **REQUEST VALID**, **NOT AUTHENTICATED**, **ACCOUNT DATA NEEDED**, **USER LOOKUP**, **USER DATABASE**. Check padding on each side, letter spacing, wrapping and active/inactive contrast.
7. There is exactly **one green original** and **one cyan new lookup** only from its C04/C05 introduction. They do not merge, cross unrelated title text, or teleport through cards.
8. Verify final green ingress port and cyan output port join the same map geometry as SHOT06 and planned SHOT08. Compare **SHOT06 final 1.5s + SHOT07 first 3s** side-by-side at equal camera scale. Validate full handoff with sound.
9. Watch actual output at **phone landscape size**; if hierarchy is unreadable, simplify visible content/camera composition, not merely raise glow or tiny font.
10. Play all five original clips continuously and check the designed audible breathing gaps, sentence endings, no double-silence, no clipped breaths, no sudden dip in ambience and no mid-word visual scene cut. SHOT07→SHOT08 should feel like one continuous camera journey.
11. Post-render inspect audio inclusion (all five C01–C05 in correct order and correct source hashes), no missing playback or audio clipping, lip? **No lips — architecture video.** Check durations and rendered frame count against resolved audio+holds.
12. Run MediaOS post-render QA and show Director the **single joined playable SHOT07 MP4**, full sound, before any LOCK. **Do not mark a preflight PASS or GitHub CI PASS as Director approval.**

**QA deliverables expected from an implementing agent:** exact locked audio clip hashes and lengths; resolved anchor→frame table; scene-object registry with final positions/states; crop/overlap report (including text), a contact sheet of key rendered frames, and one 1080p 30 fps review MP4. No claims of “pixel-perfect” until real frames have been checked.

---

## 9. Current MediaOS implementation blockers — do not conceal or bypass

This revised storyboard deliberately **does not claim the shot video is rendered**. The checked repository currently has:
- Voice Agent merges the Director Voice Pack, but **Visual Agent still reads only legacy Script revision 3 / HEAR-SEE contract bundles**; new SHOT07–09 voice-pack overlay has not been connected there.
- Backend \`VisualQaController.compositionFor\` returns composition IDs for SHOT 01–06 only. SHOT07's new Remotion composition must be implemented and registered before preflight.
- The Voice Pack is a **narration import**, not the validated HEAR/SEE contract required by native Visual QA. Build a safe new visual addendum or validated HEAR/SEE path tied to the approved voice; do not force legacy SHOT 07/09 semantics onto the new happy-path story.
- Native SHOT06 MediaOS post-render QA remains a separate blocker for the contiguous episode preview, even though v5 **is** Director-approved as a reviewed video. See issue #89.
- Live ElevenLabs files, their hashes and word alignment have **not** been fetched here because direct production connection is unavailable in this preparation pass. The Director's statement that all 13 recordings are locked is authoritative, but visual timings must still be retrieved before rendering.

**Implementation order:** (1) connect voice pack safely in Visual Agent, (2) collect C01–C05 immutable voice lengths/alignments, (3) implement/validate a visual HEAR/SEE addendum, (4) build one reusable Remotion SHOT07 composition and staging, (5) render an actual combined MP4 and run geometric/audio QA, (6) Director reviews and explicitly LOCKs, (7) proceed into SHOT08 without resetting the world. Source-of-truth timeline stays as delivered by approved audio, not inherited estimated seconds.

---

## 10. Director approval criteria

SHOT07 is ready for visual sign-off only if:
- a nontechnical viewer can tell the difference between **selected server**, **valid request**, **verified identity**, and **missing account facts**, without reading dense paragraphs;
- the five voice recordings feel like one continuous well-paced scene with actual breaths between them;
- **no text** spills from cards, no unrelated nodes collide, no duplicated Auth Service shell or packet appears, and all motion/labels remain readable during camera transitions;
- the final cyan User Lookup to User Database can be followed instantly into SHOT08;
- SHOT01–06 remain unchanged and there is a verified single playable SHOT07 candidate using the original five voices.

**Director has approved the narration, not this visual pass. No automatic visual LOCK.**
