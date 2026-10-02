# EP001 — Creator Decision Memory

Status: ACTIVE
Episode: EP001 — What Really Happens When You Click Login?
Purpose: Canonical append-only creator decision memory for approvals, corrections, locks, overrides, and production constraints agreed during development outside MediaOS.

## Rules

- Every creator approval, correction, lock, override, and explicit production preference must be recorded here.
- Newer explicit creator decisions override older conflicting entries, but older entries remain in the history for traceability.
- LOCKED items must not be reinterpreted by MediaOS agents unless a concrete technical conflict is detected.
- Approved creative content must not be rewritten by paid or autonomous AI agents when a valid Approved Episode Package is present.
- Deterministic transformations are allowed when they preserve creative intent, for example semantic voice anchor -> absolute timestamp after final voice alignment.
- This file is human-readable memory. Machine execution remains governed by the Approved Episode Package JSON.

---

## 2026-10-02 — EP001 Creative Strategy LOCKED

The creator approved the full EP001 decision register as the canonical creative strategy.

### Episode identity

- Working/public title during production: `What Really Happens When You Click Login?`
- Final title/thumbnail packaging may be optimized immediately before publishing without changing the episode promise.
- Central question: `How does a system turn submitted credentials into trusted, remembered authentication state?`
- Final thesis: `Login is not a password check. It is a distributed journey that turns a human claim into trusted system state.`
- Audience: broad developer entry point with senior/architect-level conclusions.
- Language level: intermediate by default, with controlled advanced reasoning around dependency health, trust, and state.
- The main journey must remain understandable even to viewers without strong backend experience.

### Runtime and pacing

- Final target: 16–18 minutes, but do not cut strong material merely to satisfy an arbitrary upper bound.
- Working narration target: roughly 19:00–20:30, around 15–20% more material than the expected final cut.
- Pacing: balanced, with slower reasoning around AHA moments and architectural conclusions.
- Meaningful visual change should generally occur every 6–12 seconds, but not through decorative camera motion.

### Story architecture

- Start human-first with Phone, credentials, and Login.
- First conceptual twist should land within roughly 15–20 seconds: the click happened, but the meaningful backend request may not have left the client yet.
- Backend world should begin opening around 35–45 seconds.
- Causal journey is the backbone, with short conceptual pauses at important reasoning points.
- Network/Transit is a bridge, not a networking deep dive.
- API Gateway receives concise but meaningful responsibility/routing context.
- Load Balancer receives only enough explanation to show selection of an eligible Auth Service instance.
- Auth Service is the main backend hero.
- User Database must be shown as a dependency, not merely another node in sequence.
- Authentication State / Session-Token Boundary is the conceptual culmination of the episode.

### Failure architecture

- Primary developed failure story: Auth Service remains healthy while User Database becomes slow, the request waits, the time budget shrinks, authentication cannot complete in time, Failure Response is produced, and the client shows an error state.
- Time budget/countdown should be visible during the primary failure sequence.
- Secondary failure branches remain visible as contextual architecture, not separate deep dives: Invalid Token, Account Status, Access Denied, Expired Session, Session Restore Flow.
- The map may contain more system truth than the narration explains.
- Secondary failure branches should remain reusable context for future Identity & Trust episodes.

### Visual architecture

- LOCKED hierarchy: Phone -> compact Client Boundary -> backend architecture dominates.
- The episode lives in one persistent Living Architecture Map rather than disconnected slide worlds.
- Phone may dim or leave the main frame after request departure and return for human consequence, failure, and final success.
- Client Boundary must remain visually smaller than major backend nodes.
- Secondary systems may remain dim when useful for spatial context, but must not create visual noise.
- Major backend nodes should have distinct silhouettes rather than generic cards.
- Camera moves when focus changes and holds during reasoning.
- Use controlled 3D depth/parallax, not a game-like environment.

### Narration style

- Narration speaks directly to the viewer using `you`.
- Use short sentences for tension/AHA beats and longer sentences for reasoning.
- Metaphors are allowed only when they improve the mental model.
- Rhetorical questions are encouraged as transition devices.
- Avoid listicle-style signposting.
- Technology names describe responsibilities; they are not the content strategy.

### Voice and timing

- Narrator: Stefan cloned voice.
- Initial provider: ElevenLabs.
- Canonical future profile: `AT_MAIN_NARRATOR`.
- Voice style: natural Stefan voice optimized for clear international English; calm senior architect with documentary authority.
- Dramatic emphasis only around AHA, failure, and key transitions.
- Controlled pauses are part of the production language.
- Each Script block is a separate voice generation unit, generally around 20–45 seconds.
- Regenerate only the affected voice block when possible.
- Final approved voice timing is authoritative; visuals adapt to voice, not the reverse.
- Timing drift policy: over 15% -> warning; over 25% -> hard review.
- Word-level alignment is required before final shot timing is locked.

### Shot and synchronization contract

- Shot boundaries are determined by visual focus, story beat, and voice structure together.
- Semantic anchors are the primary pre-generation synchronization mechanism.
- Production shots must be maximally deterministic.
- Required shot fields: `initialState`, `voiceRange`, `syncAnchors`, `camera`, `objectEvents`, `protectedObjects`, `finalState`, `successCriteria`, `failureCriteria`.
- Missing required asset -> affected shot BLOCKED. Do not invent a placeholder.
- Unknown object/camera reference -> BLOCKED. Agent must not guess.

### AHA / Reel contract

Minimum three PRIMARY AHA shots are mandatory and must be directly extractable from the master long-form timeline without new animation.

1. `You clicked Login. But the backend may not know that yet.`
   - Lesson: human action != backend request.
   - Visual story: click -> local client activity -> request assembly -> boundary -> departure.

2. `This service is healthy. Login is still broken.`
   - Lesson: local service health != end-to-end dependency-chain health.
   - Visual story: Auth Service healthy -> User Database slow -> waiting/time budget -> human spinner/failure.

3. `A correct password does not log you in.`
   - Lesson: credential verification != authenticated state.
   - Visual story: verification succeeds -> authentication state still absent -> state created/issued -> successful response.

Secondary AHA candidates remain optional and should only become Reels if they naturally form complete standalone stories.

### Audio, captions, editing

- Generate full `.srt/.vtt` captions plus selective on-screen key phrases.
- Use subtle technical ambience.
- Use minimal functional SFX; never a game-like soundscape.
- First automated editor should be deterministic FFmpeg assembly.
- DaVinci Resolve remains optional for final polish.
- MediaOS should eventually export a Resolve-compatible timeline/interchange format.

### Automation philosophy

- Approved Package is the primary workflow for at least EP001–EP005.
- Paid creative AI is OFF by default when a valid Approved Episode Package exists.
- MediaOS may not improve or reinterpret approved Script/Scene content.
- Deterministic transformations that preserve creative intent are allowed.
- MediaOS may extend a local visual hold automatically by up to 1.5 seconds; above that requires review.
- Creator approval is required for new narration, changed script text, new hero assets, story-changing camera logic, substantial shot timing drift, contract validation failures, final renders, and final edit.

### Package and versioning

- Revisioning starts immediately; locked creative state is never overwritten in place.
- Always produce both `EP001_APPROVED.md` and `EP001_MEDIAOS_PACKAGE.json`.
- The JSON must be fully sufficient for production agents without requiring the Markdown file.
- The Markdown is the human-readable mirror of the same approved truth.
- Package import must be globally valid before locking Research/Script/Scene.
- Execution is shot-granular after import: an independent blocked shot must not stop unrelated valid shots.

### Desired viewer outcome

Priority order:
1. `Now I can think about login like an architect.`
2. `I did not realize how much happens behind Login.`
3. `I want to see how the system remembers me on the next request.`

Primary mental model: `A login is not one backend decision. It is a chain of trust across multiple boundaries and dependencies, and the journey is not complete until the system has created authentication state that future requests can rely on.`

### Explicit exclusions

Do not use technology-name dumping, code snippets, framework-specific implementation, giant browser UI, decorative camera movement, neon/rainbow architecture, cluttered captions, fake complexity, password/hash deep dives, JWT tutorials, or overly cinematic/game-like sound effects.

---

## 2026-10-02 — Story Architecture v0.2 LOCKED

The creator explicitly approved and LOCKED `EP001-STORY-ARCHITECTURE-v0.2`.

### Chapter structure

1. `00:00–01:10` — One Click, Many Systems
2. `01:10–02:25` — AHA SHOT 01: The Request Hasn't Left Yet
3. `02:25–03:15` — Crossing the Boundary
4. `03:15–04:25` — Entering the Backend
5. `04:25–05:20` — Routing Toward Authentication
6. `05:20–07:00` — The Auth Service Takes Responsibility
7. `07:00–08:40` — Identity Depends on Data
8. `08:40–11:10` — Failure Path: Healthy Service, Broken Login
9. `11:10–12:45` — The Claim Is Verified
10. `12:45–15:10` — AHA SHOT 03: Correct Password != Logged In
11. `15:10–17:25` — Turning Trust Into State
12. `17:25–19:40` — The Journey Returns to the Human
13. `19:40–20:00` — Bridge to EP002

### Locked story backbone

- Start and end with the human/Phone.
- Reveal architecture progressively rather than exposing the whole map immediately.
- AHA 01 proves that clicking Login and sending a backend request are different events.
- API Gateway is the first backend hero boundary.
- Load Balancer is contextual, not a deep dive.
- Auth Service owns the authentication decision but depends on external data.
- User Database is a true dependency.
- Primary failure story demonstrates local health vs end-to-end health.
- Secondary failure region remains visible as reusable system truth.
- Successful credential verification intentionally does not immediately produce logged-in UI.
- AHA 03 proves that verification alone is not authenticated state.
- Authentication State / Session-Token Boundary is the conceptual culmination.
- Return path completes the causal journey back to the human.
- EP002 bridge: the next request no longer carries the password, so how does the system remember who the user is?

### Formatting preference for creator collaboration

- Use larger paragraphs and fewer line breaks.
- Especially for chapters, scenes, and production plans, avoid splitting every sentence or thought onto a separate line.
- Keep structure and headings, but make the text visually dense enough to read as coherent paragraphs.
