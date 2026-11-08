# Architectural Thinking — Codex Remotion Visual Constitution v1

**Status:** Proposed repository-backed visual production contract; activates only after Director review of the PR that adds it.
**Origin:** Faithful operational summary of the attached **Architectural Thinking — Remotion Agent Visual System v1.0** (LOCKED BASELINE, 2026-10-05) and the current Core Production Bible v2.3. The uploaded baseline contains additional precise geometry/state details; the repo's reviewed Remotion components remain the actual implementation authority. **This summary does not claim to reproduce every line of the original source.**
**Scope:** All future Architectural Thinking Remotion SHOT code, scene proposals, shared asset reuse, review, revisions and Shorts adaptation.
**Principle:** ONE WORLD. ONE LIVING MAP. MANY ENGINEERING STORIES. Repeat the world, not the lesson.

## Global Director Tier++ quality standard — LOCKED 2026-11-08

**New minimum acceptance standard:** the Director has chosen EP002 SHOT02's V5→V7 cinematic living-map direction for **every future video segment and system component**. The authoritative, testable rules and current scope are in **`AT_TIER_PLUS_PLUS_VISUAL_RENDER_STANDARD_V1.md`**. All new SHOT code and agent SceneSpecs must read that document before production. Treat it as the quality benchmark, while keeping the original visual constitution, shot-specific locked voice, and source-authority rules intact.

The baseline now explicitly includes: full-frame crisp navy architecture with strong contrast; single purposeful cards rather than confusing nested objects; every node/branch visibly connected with no fake telemetry; consistent same-size/same-color/same-glow moving request particles across **every** hop; first actual user action immediately launches end-to-end flow including healthy Database access; cool/normal-to-orange pressure only after a **genuine spoken problem**, not merely when a node appears; repeated tactile button interaction plus context-driven color escalation; legible hero text; safe phone/database placement; modern collision-free animated metric/caption repositioning; reading room for named objects; deterministic HEAR→SEE real-voice timing; signed approved source and full media QA; and mandatory final human visual preview.

**SHOT02-only reference numbers** (do not generalize): 9px green `#73FFD0` request particles, `09 : 00` hero, three Auth instances, 40-frame button press cycle, 160px counter lift, closing title `bottom:170` and start `spokenFrames-60`, 60-frame post-voice visual hold, 5 verified beats/7 term cues, Database stress after verified `USER_DATABASE` term end. The universal principles are semantic consistency, visibility, synchronization, and cause-before-effect; other episodes need their own exact values.

**Acceptance split:** source QA, ffprobe and machine receipts show technical constraints were met; they **cannot** certify aesthetics or Director video approval. V7 GitHub/Railway build SUCCESS does not prove V7 MP4 frame quality. Every new shot needs its own acceptance suite and actual screened video. An unreviewed MP4 is `VISUAL_DIRECTOR_REVIEW_REQUIRED`, never automatically `LOCKED`.

## Director LOCK — comprehension-first visual pacing (2026-11-07)

**Accepted by the Director for EP002 SHOT02 V2 and every future Architectural Thinking SHOT.** These are permanent five-part art direction rules. They supersede older suggestions to use tiny secondary explanation labels or top-right decorative term HUDs. Do not modify the Script v4.0 archive, approved Visual Pass or previously accepted SHOTs by back-propagation.

1. **Show a cause as a cause.** If the narration says that many viewers click Login at 09:00, visibly depress the actual Login button multiple times using a deliberate repeated-tap animation, then let the scene settle briefly so the viewer can connect input actions with request arrivals. Do not substitute only an abstract counter for the human action.
2. **Give technical words time to land.** Every important spoken term is activated at its genuine, approved voice timestamp, followed by a readable visual hold and calm transition before the next technical idea. Maintain clear hierarchy and avoid rushing camera/labels while the voice explains. A longer silence **inside the spoken recording** requires either a separately Director-approved Take or an explicitly approved no-new-TTS audio editorial pass with exact new cue offsets; never splice voice, fabricate timestamps or desynchronize a locked Take without authorization.
3. **Focus and enlarge the actual architecture.** When the narration names a primary object (API Gateway, Load Balancer, Auth servers or User Database), use smooth motivated camera focus/controlled scale and provide a much clearer larger view of its *own internal components*, not a disconnected generic slide. Keep established node centers, routes, exact service/replica counts, and no overlap. Hold the focus sufficiently for reading and return smoothly to the ongoing world.
4. **Make throughput visible as moving work.** Whenever an arrival-rate or request counter rises, illuminate the real routing paths with moving packets/dots that accelerate smoothly across the existing Gateway → Balancer → Auth → Database topology. The motion and displayed count must rise from the *same verified narration event*, not arbitrary independent timers. Never present demo counts as actual measured customer/server telemetry.
5. **Remove nonessential microcopy.** Drop small captions/mini-headers adjacent to primary object names, top-right decorative term panels, and words like `ILLUSTRATIVE`, `NOW IN FOCUS`, or other labels that do not directly help understand the mechanism. Keep only useful, large readable labels anchored to the architecture or essential event/metric context. A requested simplification is not permission to remove the actual spoken technical term from the scene.

**Review gates:** at every SHOT check (a) cause→effect actions, (b) real voice timing and visual comprehension holds, (c) readable node internals and zero text/camera overlap, (d) paths/counters moving together, (e) strictly useful typography. Source tests and bundle success do not replace Director inspection of the actual 1920×1080 MP4. Do not call a V2 shot Director-LOCKED until the corrected preview is rendered and accepted.

## Director feedback — no one-second architectural objects (2026-11-07)

**Director-observed failure in SHOT02 V2:** several named architecture objects appear and disappear so quickly that the audience cannot read or understand them. A technically synchronized animation is NOT educationally synchronized if the useful information is only visible for about one second. This observation applies to the entire series as an explicit quality rejection rule.

**Production acceptance constraint:** primary named system objects and their meaningful internal labels should have a **target reading time of 3–4 seconds** (90–120 frames at 30fps), including a steady plateau after their controlled entrance. Never rush a camera push-in and reverse immediately; if the real narration spacing is too short, keep the earlier node's internals readable in its existing world position and omit the ineffective whip-zoom. Keep causality, precise term onset, and zero text overlap. Avoid forcing 3-second camera spotlights between back-to-back spoken words: overlapping camera moves can reduce readability even when every animation independently meets its duration.

**Voice-length limitation:** when a key term appears near the end of the approved Take with less than 90 available frames, no amount of scene-local animation can create three full seconds before the audio-backed clip ends. Flag an explicit **VOICE_PACING_REVIEW_REQUIRED** and propose a separately approved edit of existing source audio with genuinely silent pauses plus re-alignment, or a newly approved Take if necessary. Do not silently insert silence, shift terms away from ElevenLabs timestamps, change a selected Take, fabricate cue frames or auto-charge TTS. A code-only V3 pass is **not** evidence that the spoken pacing issue has been solved.

## Director voice pacing — natural sentence holds (2026-11-07)

**Director decision:** SHOT02 narration needs **substantially more waiting time**. For future explanation-heavy SHOTs, plan intentional voice silence around the *end of complete thoughts*, particularly after introducing a major system object or explaining the meaning of a counter. Do **not** chop sentences in the middle of a technical explanation merely to force a camera effect. The visual needs 3–4 seconds of calm reading where the subject warrants it; when voice spacing is inadequate, edit narration timing itself, not just easing curves.

**SHOT02 V3.1 editorial implementation:** use the **existing Director-approved ElevenLabs Take** as immutable source and add nine genuine zero-speech editorial pauses at real source-alignment-derived ends of full thoughts (60+48+66+81+30+81+33+90+48 = **537 frames at 30fps = 17.9 seconds**). Target ~58.07 seconds rather than ~40.17, subject to measured source duration. Original words and voice identity are unchanged; no ElevenLabs generation, no synthetic words and no guessing term times. Original 5 beat and 7 technical term cues are shifted by the same exact accumulated sample-length pauses in both Remotion video and FFmpeg narration. Parent Take and its voice approval remain intact and untouched. This is a **derived review candidate**, not automatic Director LOCK. Require deterministic source alignment validation and Director review of actual edited audio before final acceptance.

**Future rule:** start technical SHOT production with an audio+pacing budget first; use spoken clarity as a hard gate rather than rushing words to fit an editorial clock. Pause specifications belong to verified, named text/sentence boundaries and should be tested against the actual selected Take. Treat audio re-edit as a new approved derived artifact with a traceable source and remapped cues; never silently modify a selected original Take.

## 1. Fixed series identity

Every episode must feel like another journey **inside the same technical architecture world**, not a different presentation theme. Preserve consistent design tokens, shared component geometry, service names, node identity, proportions, animation semantics, camera perspective, architecture geography and visual hierarchy across adjacent SHOTs and related episodes. EP001 approved components and EP002 SHOT01 are the visual references; do not change approved originals to make new code fit.

The style is a premium **Living Technical Interface / Technical Spatial Interface**: dark, precise, engineered, readable, restrained, spatial, architecture-first, selective 2.5D or 3D depth only when it improves explanation. A large browser mock, decorative sci-fi HUD, disconnected dashboard, stack of PowerPoint cards or unrelated diagrams violates continuity.

Full HD widescreen master: **1920×1080, 16:9, 30fps**. Use the entire landscape frame as one world. Do not place a vertical-looking screen inside a boxed 16:9 backdrop. Readability must survive laptop, TV and mobile viewing.

Canonical background: coherent super-dark navy near **#010711 / #020811** with restrained radial depth, vignette and active-subject glow. No bright square panels or decorative particle overload. Typography: **Inter / SF Pro Display / system sans**, clear compact hierarchy, short technical labels, no decorative sci-fi fonts or lecture-sized paragraphs.

### Color and state semantics

- Phone / human UI: cyan, aqua or electric blue.
- Secondary architectural containers: purple/violet.
- Secondary semantic objects: green.
- Context/inactive: dim dark blue-gray; readable near-white primary text.
- ACTIVE/confirmed: green or established component accent, with appropriate movement.
- WAITING/slow: restrained amber, less motion rather than faster noise.
- FAILED/rejected: red, only where the failure is actually occurring.
- QUIET/DIM/future: subdued blue-gray / low-contrast context.
- **State meaning takes precedence over the base identity color.** Never convey status through color alone: use border, opacity, path, glow, motion, shape or interruption.

Canonical conceptual focus states: **HIDDEN → DIM → QUIET → ACTIVE → FOCUS → RESOLVED / FAILED**. An earlier introduced concept should typically remain spatially QUIET rather than randomly disappearing. Do not show all nodes equally bright; earn a wider map through progressive understanding. ACTIVE semantic pills must reuse the approved travelling-green treatment, not a new ad-hoc green flash.

### Motion and camera grammar

Canonical motion: **ARRIVE → ACTIVATE → ASK / REVEAL → EXPLAIN → COLLAPSE → CONTINUE**. Motion must mean progress, relation, decision, waiting, failure, return or reveal; otherwise remove it. Meaningful change is usually appropriate around every **5–10 seconds**, but this does not require a camera move. No decorative drifting, random particles, aggressive flashing, strobe, glitch or excessive bloom.

- CLOSE: human action, critical mechanism, cause or consequence.
- TIGHT / MEDIUM: primary educational view, one object or local mini-world.
- WIDE: relationship across nodes/tiers.
- FULL ARCHITECTURE WIDE: rare, earned payoff, not an early default.
- Camera forward = journey; horizontal = flow; push-in = decision/detail; pull-back = architecture/scale; downward/alternate departure = branch/failure where appropriate; return to Phone = human consequence.
- Waiting must feel slower; failure leaves the successful corridor, not red warning spam; restore returns through already understood architecture.

### Engineering truth and continuity

Scene geography is persistent: do not relocate the same Gateway/Auth/Database between adjacent SHOTs without a semantic reason. Architecture is about boundaries, state, constraints and consequences, not memorizing technology labels. When EP002 source says exactly three Auth replicas before SHOT08 scale-out, preserve that count; a green liveness/readiness probe must not be misrepresented as successful business functionality. Do not show user-facing error before the approved SHOT06 moment. Follow the current Director-approved episode-specific truth and continuity notes.

Voice synchronization is **not** guesswork: bind visual events to real selected ElevenLabs audio and verified HEAR → SEE anchors. Editorial time windows are planning hints only; the actual approved Take + measured duration govern final frame counts. Never invent timestamps. Work should be grounded in the current voice and beat fingerprint.

At least three long-form sequences should remain suitable for strong vertical Shorts, but the original master must remain a proper 16:9 composition. Vertical adaptation is a separate reviewed layout, not simply an unreviewed crop.

## 2. Deterministic-first and reuse rules

**Before Codex writes any scene code**, attempt deterministic production from existing:
1. SceneSpec and approved HEAR → SEE beats;
2. reviewed asset/component registry and pinned source blobs;
3. design tokens, layout and semantic state machine;
4. camera and motion presets;
5. real voice timing and existing continuity map.

Only dispatch **Codex Cloud for Remotion visual code** if the requested scene or revision needs new or changed code, missing component/behavior/camera/layout grammar, or an implementation Codex can meaningfully complete. Do not spend Codex plan allowance for Java, Spring Boot, React MediaOS UI, Maven, PostgreSQL, unrelated backend QA, generic script drafting or status checking. Ordinary scene changes must reuse reviewed primitives instead of redrawing the world.

If something is missing, report the exact missing primitive/behavior/preset; propose an episode-local change. A newly approved reusable design becomes a **versioned component/recipe** only through a separately reviewed promotion, not by silently editing EP001 protected assets or the shared registry.

## 3. Historical failure-prevention preflight (baseline)

The following are already documented **style rejection modes**, not invented historical correction events. Reject a scene draft when it:
- looks like slides, a generic dashboard, a lecture UI or unrelated disconnected cards;
- exposes the complete system map before the story earns it;
- makes the Phone too bulky or visually dominates system architecture without reason;
- displays tiny unreadable secondary pills, oversize prose labels or duplicate captions;
- puts a narrow/vertical composition inside a widescreen black frame;
- loses node/path/border contrast, brightens every object equally or ignores semantic state;
- uses decorative drift, strobe, excessive particles or failed-state red overload;
- changes a protected EP001/EP002 component or style without approved versioning;
- guesses voice timings or uses editorial seconds as real measured event timestamps;
- invents a new UI primitive when an approved component already exists.

## 4. Source authority and exceptions

For each SHOT, follow: **latest explicit Director-approved/LOCKED instruction → locked Remotion Agent visual baseline → applicable approved lessons from the visual ledger → Director-approved current episode Script + Visual Pass / HEAR→SEE → current SceneSpec → pinned reviewed components/tokens → general production Bible concept rules**. If two instructions conflict, stop and report the conflict; do not silently choose a prettier output. An episode-specific Director exception is not automatically a permanent cross-series rule.

The **visual lessons ledger** is append-only and reviewed. An unapproved Codex guess is not a rule. An accepted recurring rule may be promoted from the ledger to this constitution by a scoped reviewed PR. Preserve both the old decision and its superseding decision for traceability.

**Mandatory every SHOT:** read this constitution, the accepted corrections ledger and the sequential SHOT protocol **before opening or editing Remotion code**. Verify the applicable locked source, exact asset import paths, last approved adjacent scene and continuity manifest, report the preflight result, then implement only the authorized SHOT. A file existing in GitHub does not prove Codex read it; production proof must include an explicit compliance report and source/commit review.

## 5. Gates and acceptance

Successful TypeScript compilation is necessary, **not visual approval**. The complete gate is: preflight → scoped Remotion code → source safety checks → typecheck/bundle → authorized preview render (only with separate CPU approval) → style/continuity/voice QA → Director feedback/acceptance → ledger update. No agent may mark itself Director-approved. Fix only the affected SHOT and dependencies; reuse approved unchanged media. No autonomous merge, Railway deployment, paid TTS, OpenAI API or YouTube publishing.

**Important deployment boundary:** V119/V120 currently implement EP003+ whole-episode Codex handoff and factory contracts. This written decision does **not** mean one-SHOT-at-a-time dispatch/preview gates have been implemented in MediaOS. Production code must be adapted and independently tested before claiming that capability.
