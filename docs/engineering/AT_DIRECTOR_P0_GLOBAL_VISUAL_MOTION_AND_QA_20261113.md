# Architectural Thinking / MediaOS — DIRECTOR P0 Global Visual, Motion and Continuity Quality Constitution

**Decision:** 2026-11-13, Europe/Sofia.
**Authority:** Director explicit permanent requirements, applying to **EVERY VIDEO, EVERY SHOT, ALL FUTURE CHANNEL PRODUCTION AND ALL AGENTS**; not limited to EP003.
**Status:** DIRECTOR-LOCKED production POLICY / documentation. Automated runtime gates and Director acceptance of individual media are **separate**, not claimed implemented by this document.
**Priority:** P0 — highest creative / visual quality priority alongside [exact cross-SHOT continuity P0](AT_DIRECTOR_P0_INVISIBLE_CROSS_SHOT_CONTINUITY_20261113.md) and protected correctness/security/cost controls.
**Reference:** Remotion-first Living Architecture World and the existing Architectural Thinking Core Production Bible v2.3. Production assets previously human-LOCKED stay immutable. No retroactive edits or paid rerenders are authorized.

## Director's non-negotiable goal

> **Every scene must look like one deliberate, modern, readable, smoothly animated architectural film. Nothing clips, collides, teleports, jitters, races past the audience, or reveals the boundary between SHOTs. The viewer must always understand what moved, where it went, why it mattered, and what happens next.**

### P0-01. Text never escapes its container

- Calculate container dimensions from **actual rendered content**, selected font, line wrapping, weight, padding and scale; never trust a rough static character count as final proof. Reserve comfortable internal horizontal and vertical padding.
- At 1920×1080 output, new secondary information is normally >=18px, main copy >=20px. If text cannot fit, first shorten editorial **on-screen** copy without changing locked narration, enlarge or reposition container, or remove redundant information — NEVER silently shrink to unreadable microcopy.
- During animated text changes, expand/reposition the container *before or in synchrony with* the text reveal; clip/fit checks apply to **every transition/intermediate frame**, not only still screenshots.
- Do not create oversized empty cards for small labels. Content-fit both width and height, with restrained deterministic animated resizing and clear hierarchy. Keep text within viewport and video safe margins.

**FAIL** `TEXT_OVERFLOW`, `LABEL_CLIPPED`, `MICROCOPY_UNREADABLE`, `CARD_SIZE_NOT_CONTENT_FIT`.

### P0-02. Containers never obscure other containers or architecture

- The Living Architecture map has priority: node cards, Phone, Gateway, Load Balancer, Auth nodes, database nodes, active connectors, moving packets, queues and current decision states must remain visually unobstructed.
- Position explainer cards/labels in reserved *negative space*, not over live architecture. Check all camera positions and all caption/overlay states; a single safe frame is not enough.
- Detect rectangles of all visible panels, glyph bounds, camera-transformed nodes and active path corridors. Dynamic collision testing must check every relevant phrase and animation intermediate state, including the final Phone/closing cards.
- Prefer **fewer large readable cards** to many small rotating cards. Remove duplicate captioning when an existing visual explains the point. Do not solve overlap by placing one semi-transparent panel above another.
- Existing EP002 SHOT06 documented safe separation suggests >=20px from technical panels and >=24px from protected graphics **where feasible**; values are guidance, not a universal substitute for inspected clearance. Each SHOT chooses real empty space, not copied SHOT06 coordinates.

**FAIL** `PANEL_PANEL_OVERLAP`, `PANEL_NODE_OCCLUSION`, `PHONE_OVERLAP`, `PATH_OCCLUSION`, `CAMERA_SAFE_ZONE_VIOLATION`.

### P0-03. Request particles follow the REAL drawn paths exactly

- Every request dot must be bound to the **same authoritative connection geometry** the viewer sees. The displayed connector and particle travel must share a single path model, not separately handwritten approximate endpoints or independent line and animation coordinates.
- Evaluate particle positions from the path at the current time/frame, including curves, bends, source/target ports and arrow direction. On a multi-segment path the packet follows actual segment lengths in the correct order. Never cut corners or draw a shortcut through a node/container.
- The moving dot stays visually centered on its connector (consider path stroke, particle radius and rendered antialiasing). The dot enters the node at its true port and leaves the correct exit port. It must not float beside, below, above, or outside the connector.
- Enforce packet identity, direction, style, radius/glow and timing consistency across the episode. A single reusable particle system/geometry model is the preferred standard; unexpected larger/smaller dots or different velocity are regressions unless narratively intentional.
- When a path moves, transforms or its camera parent scales, use the **same coordinate transform** for rendered line and particle. No visually hidden world-space vs screen-space drift. Preserve in-flight packet progress and velocity across SHOT boundaries; never restart from 0 at each new SHOT.
- Actual render tests should sample beginning/middle/bend/end of every major path, plus during camera transforms and source↔target transitions, and check distance-to-drawn-path within a **scene-specific approved visual tolerance**. Do not declare 0px exactness when video codecs, antialiasing or non-pixel-perfect transforms invalidate raw equality. Pixel comparisons supplement—not replace—path-geometry checks.

**FAIL** `PACKET_OFF_PATH`, `PACKET_PORT_MISMATCH`, `PACKET_TELEPORT`, `PACKET_DIRECTION_INCORRECT`, `PACKET_VISUAL_STYLE_DRIFT`.

### P0-04. Smooth playback; no lag, micro-freezes or jitter

- Motion must be **deterministic from absolute Remotion frame/time and shared-world state**, not from unreliable wall-clock timers, race-prone setInterval handlers or per-shot random initialization.
- Render the video at its approved FPS/resolution (normally 1920×1080, 30fps unless Director specifies otherwise). Avoid jumpy easing, unexpected acceleration, packet/frame stutter, state discontinuities, camera shake and jitter in high-density segments.
- Check visual-frame movement and continuity at the **actual output MP4**, not only React preview or successful source compilation. A nominal 30fps container does not prove smoothly perceived motion; audit representative motion intervals and all joins visually.
- If geometry/camera/overlay load is high, optimize reusable assets, computation, layers, cache and composition complexity **before** asking for paid production. Avoid rendering more elements or individual animation streams than necessary. Performance bottlenecks must not be 'fixed' by speeding or shortening narration.
- Reserve stillness for a deliberate explanation or readable final hold, never as a hidden seam technique. A narrator-free breathing gap must retain appropriate **real architectural motion**.

**FAIL** `FRAME_JITTER`, `MOTION_STUTTER`, `UNPLANNED_FREEZE`, `CAMERA_SNAP`, `DETERMINISM_FAILURE`.

### P0-05. Viewers need time to understand before the next topic

- One primary **architectural idea at a time**. Each visible event has a corresponding purpose and semantic voice anchor; do not rapidly replace title/caption/architecture state before the listener can parse the previous one.
- When introducing an interview/System Design term, show the underlying problem first, introduce the name, explain it with a clear concrete example, and let its consequence be visible. Don't stack 5 technical cards into the same 4 seconds.
- Use calm, content-paced holds after crucial comparisons/aha moments and relevant events. Under normal circumstances plan approx **2 sec narrator-free breathing** between adjacent SHOTs for Director approval; do not assume precisely 2 sec for every future video if the true voice and narrative needs another duration.
- Preserve the creator's **locked script and stored Slow Natural voice Take**; real ElevenLabs timestamps provide HEAR→SEE synchronization. Do not force accelerated voice or fabricate timestamps to match guessed visuals.
- Remove redundant fast-rotating HUDs, badges and microcaptions. Strong architecture states stay long enough for a normal viewer to read them at reduced-screen YouTube viewing size; measure/read/watch actual results.
- Transitions between different topics must show visual cause/effect (e.g. one lookup creates pressure → new routing decision; same Primary evolves → replicas; one group's owner becomes a shard) rather than an unexplained switch.

**FAIL** `TOPIC_SWITCH_TOO_FAST`, `VISUAL_READING_TIME_INSUFFICIENT`, `CAPTION_SPAM`, `UNALIGNED_HEAR_SEE`.

### P0-06. One modern visual language and consistent motion grammar

- Reuse the approved component families: Phone, Gateway, Load Balancer, Auth services, database layers, paths, RequestParticle, panels, captions, CameraRig, failure/recovery states. New components must fit into same restrained cinematic Living Architecture style, color semantics, typography, node scale, line weights, glow and easing.
- Motion explains architecture: **request → routing → work → decision → response;** failure/recovery must animate its cause and effect. Don't animate just to fill silence. Use modern camera easing and restrained emphasis; avoid arcade flashes, constant zooming, dense debug microcopy or disconnected analytics slides.
- A newly introduced component should inherit the same spatial perspective, lighting and interaction grammar. Do not improvise an unrelated mini-world, CSS imitation Phone, duplicate pathways or alternative Auth world that looks different than its predecessor.
- Ensure on-screen claims remain technically correct; positive green health does not automatically imply valid Login, stopped user waiting does not cancel DB work, replicas do not auto-raise write throughput, and a new render must not reintroduce already rejected topology.

**FAIL** `VISUAL_GRAMMAR_DRIFT`, `UNMOTIVATED_MOTION`, `SEMANTIC_STATE_FALSE`, `UNAPPROVED_COMPONENT_REDESIGN`.

### P0-07. Invisible joins between EVERY SHOT and a continuous series

- For **every SHOT N>1**, opening first rendered frame/world state exactly continues **the previous approved SHOT's last real rendered frame/state**, including camera, motion velocity/phase, node geometry, packet identities and positions, lines, active status and overlays. No visual difference revealing the cut. See [mandatory formal P0 seam contract](AT_DIRECTOR_P0_INVISIBLE_CROSS_SHOT_CONTINUITY_20261113.md); validate both joins of any inserted breathing bridge.
- A SHOT may change topic only by gradually transforming the current world **after** inheriting its state. It must not reconstruct a visually similar but different architecture from memory. Reuse original shared components/end-state lineage.
- **Cross-episode / channel continuity:** Every new episode should begin with the established cinematic animation language and reused authentic component behaviors from prior episodes, not start as a visually different production. For directly connected stories (e.g. Login Architecture EP001→EP002→EP003), prepare an explicit **previous-episode final-world → new-episode opening** bridge, taking the real prior approved ending assets/states as the visual source. Continue existing architecture and motion first, then gradually evolve to the new topic. Exact pixel seam identity is mandatory when an episode is deliberately authored as a literal continuous cut; otherwise create a visibly intentional narrative bridge while preserving source visual language instead of claiming the two separate uploads are one physically joined clip.
- Do not erase a previous episode's conclusion or edit earlier LOCKED footage to create a new cold open. Opening of the next episode carries forward the established **animation style, geometry and actions**, while the narrative can re-establish context for new viewers. Freeze/replay artifacts are not an acceptable transition.
- Every new episode documents its incoming prior-episode animation/asset lineage in the Episode-Level Visual Pass before implementing SHOT01. Every SHOT documents an immutable incoming/outgoing state and genuine approved source pin. Every cross-SHOT video seam is Director inspected in the real master.

**FAIL** `SHOT_SEAM_MISMATCH`, `WORLD_RESET`, `CROSS_EPISODE_VISUAL_BREAK`, `MOTION_PHASE_RESET`.

## Evidence-backed lessons from Director-reviewed EP002

These are grounded historical lessons, **not a claim that every referenced PR was merged or every derivative MP4 was locked**.

| Source | Observed mistake or Director correction | Permanent prevention |
|---|---|---|
| [SHOT05 V3 PR #225](https://github.com/stefanVasilev17/media-os/pull/225) | Recreated Phone/mini-world mismatched earlier SHOTs; final Phone collided with explainer | Inherit genuine predecessor architecture, avoid imitation components; camera-aware Phone clearance |
| [SHOT06 V2 locked lesson](../visual/EP002_SHOT06_V2_DIRECTOR_LOCKED_VISUAL_LESSONS_20261109.md), [PR #233](https://github.com/stefanVasilev17/media-os/pull/233) | Status cards covered 8 Connection Pool slots and repeated an already visible fact | External gutter, collision guard, remove redundant text |
| [SHOT07/08 flow PR #244](https://github.com/stefanVasilev17/media-os/pull/244) | Authentic Phone→Gateway→Balancer→3 Auth→DB request travel was lost; too many rapid orange captions | Reuse authoritative paths/ports/particle movement and slower voice-cued overlays |
| [SHOT02 V7 PR #197](https://github.com/stefanVasilev17/media-os/pull/197) | Request dots varied in size/glow and normal DB flow began too late | One uniform request particle component, original genuine path model, voice-correct pressure transition |
| [SHOT08 polish PR #253](https://github.com/stefanVasilev17/media-os/pull/253) | Auth outlines did not match real card rectangles; captions were unclear | Source-derived geometry and truly readable cause→effect labels |
| [SHOT10 content-fit rule](AT_CONTENT_FIT_AND_VISUAL_READABILITY_DIRECTOR_RULE_20261111.md), [PR #259](https://github.com/stefanVasilev17/media-os/pull/259) | Oversized empty containers, tiny copy, redundant queue card | Content-fit width+height, 18/20px reading standard, eliminate redundant overlay |
| [EP002 Director V2 PR #266](https://github.com/stefanVasilev17/media-os/pull/266) | No sufficient breathing at joins, excessively fast SHOT10 changing overlays | Natural silent living-motion seams, fewer meaningful long-lived captions |
| [P0 invisible SHOT rule](AT_DIRECTOR_P0_INVISIBLE_CROSS_SHOT_CONTINUITY_20261113.md) | A visually inconsistent SHOT02 transition prompted global Director prohibition | Exact real last-frame → next first-frame contract plus actual MP4 boundary inspection |

## Mandatory reusable quality gates — ALL FUTURE SHOTs

**Before scene implementation (free planning):**
1. Verify canonical approved script/Voice Direction and actual predecessor render/end-state source. Plan the incoming/outgoing world and explicit cross-episode animation lineage when relevant.
2. Create a beat-level HEAR→SEE visual spec with readable on-screen copy, semantics, minimum dwell and collision-free reserved spaces.
3. Plan geometry via shared components and path definitions; no independent fake packet coordinates or unapproved creative reset.

**Before approving a paid preview render:**
4. Run deterministic source/geometry QA over **all captions/containers** across all declared states and intermediate animation frames: visible text bounds and typography, panel-panel/node/Phone/path collision, viewport/safe margins, accurate source-derived outlines and new component parity.
5. Run particle-on-actual-path and camera transform tests across whole path, ports, bends and SHOT boundary inheritance. Check no clip, no jump, no unexpected duplicate stream or dot style change.
6. Run scene pacing/readability check: enough time to read meaningful panels, no fast rotating callouts, no overlaid definitions, natural moving pauses.
7. Verify source hash, voice Take identity and **genuine** alignment when needed; no approximate fabricated timings or new TTS just to fix video alignment.
8. Run existing scope-correct source tests, Worker build and a **non-paid** preflight where available. A clean source build does not prove the actual video is smooth. Only Director authorizes any charged render.

**After real candidate MP4 exists (human gate):**
9. Inspect actual 1920×1080 approved-FPS H.264/AAC output and selected difficult moments, including text-change animation frames, zoom transitions, high packet density and final ending.
10. Verify no visual text overflow/collision, request dots follow drawn paths, no stutter/jitter/frozen gaps, clear architecture evolution, appropriately paced overlay changes, original story truths preserved.
11. Inspect **EVERY** adjacent SHOT last→first join and any intermediate seam start/end, with actual pinned source hashes and correct motion phase. Inspect the finished assembled master, not only solo shots.
12. Attach an auditable per-SHOT/per-join visual QA result plus the Director's explicit acceptance. **No Director LOCK unless all hard quality gates PASS and the Director watches/approves the exact version.**

**Report status honestly:** `P0_POLICY_DOCUMENTED` ≠ `P0_AUTOMATED_GATES_IMPLEMENTED` ≠ `ACTUAL_MP4_QA_PASS` ≠ `DIRECTOR_CREATIVE_LOCK`. On any unverified critical failure, result is `VISUAL_QA_BLOCKED`, not “probably fine.”

## Safe change control / agent behavior

- Read AGENTS.md, PROJECT_STATE.md, current approved Script/Voice Direction/Visual Pass and this global rule **before generating any new asset or code**.
- Visual agents must prefer reusing existing components and prior real source geometry to recreating from scratch.
- Record every new observed Director correction in a versioned lessons entry, with the exact failure, affected SHOT/source render, correction, and preventive test so the same error is not repeated in future episodes. Do not assert tests or QA passed without measured evidence.
- NEVER auto-overwrite previously human-LOCKED scripts, voice Takes, visual sources, MP4s, render pins or original scene components.
- Never run paid ElevenLabs, alignment, Railway CPU render, OpenAI agents or GitHub Actions without the appropriate explicit Director permission. Documentation updates only do not authorize implementation/deployment/spend.
- If a rule cannot be implemented under current tool/source constraints, surface a precise blocking reason; do not quietly drop the rule or disguise the problem in the final assembly.

**Current verified scope:** This document creates and records permanent requirements. It does not add Remotion geometry checks, implement frame QA, change Railway deployment, pay for a render, test real MP4 playback, or retroactively mark any old episode as accepted.
