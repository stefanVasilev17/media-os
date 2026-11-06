# Architectural Thinking — Codex Remotion Visual Constitution v1

**Status:** Proposed repository-backed visual production contract; activates only after Director review of the PR that adds it.
**Origin:** Faithful operational summary of the attached **Architectural Thinking — Remotion Agent Visual System v1.0** (LOCKED BASELINE, 2026-10-05) and the current Core Production Bible v2.3. The uploaded baseline contains additional precise geometry/state details; the repo's reviewed Remotion components remain the actual implementation authority. **This summary does not claim to reproduce every line of the original source.**
**Scope:** All future Architectural Thinking Remotion SHOT code, scene proposals, shared asset reuse, review, revisions and Shorts adaptation.
**Principle:** ONE WORLD. ONE LIVING MAP. MANY ENGINEERING STORIES. Repeat the world, not the lesson.

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

## Director LOCK — premium semantic cinematic quality, 2026-11-07

The Director requires every future Architectural Thinking SHOT and every review pass to meet **all five** of these explicit conditions. They override any merely stylistic preference for generic dashboards, fixed diagram walkthroughs, or decorative motion. **A successful build is not a visually accepted scene.**

1. **Speak a technical term → show and animate that exact concept.** When narration names an API Gateway, Load Balancer, Auth Server, Database, queue, cache, rate or other meaningful technical entity, visibly identify the real object in the SAME world and use one readable, temporary term emphasis, a local signal pulse or spatial focus. Never leave the term as a tiny unmoving label. Do not introduce terminology or imply system facts that are not spoken/approved.
2. **Literal HEAR→SEE causality with significant semantic movement.** A change of meaning must cause a visible change: more new requests → increasing arrival density, load balancing → deterministic fan-out, a shared dependency → converging paths, a failed node → localized fault. Camera, glow, opacity and path animation follow actually verified audio events; choreography is emphatic but controlled. Do not invent timestamps for individual words that share one broad beat. Use real fine-grained alignment when exact named-term sync is required.
3. **ZERO visual collisions.** No callout, label, captions, metric, title, halo or panel may obscure the Phone UI, a node's own text, a travelling packet, another explanatory label, or a meaningful architecture junction. Use named fixed text-safe lanes outside the moving world camera, conservative projections of all relevant node/Phone bounds across the entire camera envelope, and real rendered-frame QA at every transition. If no clean place is available, change framing, reduce text or move the camera; never stack text over diagrams. Geometric tests are necessary but cannot substitute for frame-by-frame visual inspection.
4. **Premium, brand-coherent quality.** Architectural Thinking is a premium Living Architecture motion picture, not a PowerPoint deck, stock infographic, Web admin dashboard, wireframe or simple glowing card collection. Preserve atmosphere, genuine geometry, art-directed contrast, typography hierarchy, readable technical labels, disciplined density, nondecorative animation and content authenticity. Reject merely "acceptable" visual quality until a Director-reviewed MP4 demonstrates the actual result.
5. **Modern digital cinematography.** Make the camera a deliberate 2.5D spatial storytelling instrument: motivated push-ins, rack-focus-equivalent emphasis, measured lateral moves, dimensional lighting and coherent transitions between adjacent SHOTs. Avoid old-style static diagrams, automatic PowerPoint transitions, random generic bounces, nonstop zooms, overproduced sci-fi effects and repetitive decorative motion.

**Hard QA checklist:** term/audio anchor mapping; no fabricated timestamps; semantics animated at correct cue; max one major callout at once; no text/object overlap in camera and HUD states; node text readable at full 1920×1080 and realistic viewing scales; adjacent SHOT geography respected; genuine Remotion render reviewed. Source-only/geometry-only QA must be labelled **NOT_VISUALLY_VERIFIED**. Apply this contract to EP002 SHOT02 and to future episodes; accepted old SHOTs remain protected until the Director explicitly requests revision.

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
