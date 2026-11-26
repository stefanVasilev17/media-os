# Architectural Thinking — Visual Corrections & Lessons Ledger v1

**Scope:** Git-versioned, reviewable, append-only memory for Remotion visual corrections across ALL Architectural Thinking episodes and related series.
**Status:** Empty historical-incident ledger at initialization. Existing source-of-truth style failures are listed in AT_REMOTION_VISUAL_CONSTITUTION_V1.md; they are NOT falsely attributed to individual prior Director reviews.

## Why this exists

A Codex Cloud conversation is **not** the production memory. Cloud sessions, model context, usage limits and one-off corrections may be lost. Every Director-confirmed correction must live in the repository and be read before the next SHOT. The same mistake should not have to be rediscovered in SHOT03, EP003 or EP010.

## Two independent layers

1. **Core style contract** in AT_REMOTION_VISUAL_CONSTITUTION_V1.md: stable brand-wide geometry, layout, colors, focus states, camera and motion grammar, voice-driven timing, engineering truth and locked components. Do not scatter contradictory global rules in isolated SHOT prompts.
2. **Corrections ledger** in this document: specific incidents, reasons, applied fix, scope, link to real reviewed preview/code evidence, Director approval, and whether the lesson is promoted into a reusable component or the core style contract. Keep the full history even when superseded.

## Required correction entry

After a real Director comment, add an append-only entry **on an isolated docs/code PR** using the exact fields below. A Codex proposal is unverified until the Director accepts it.

- **ID:** AT-VIS-0001, AT-VIS-0002, ... (monotonically increasing, never reused).
- **Date and Director decision:** yyyy-mm-dd, APPROVED / PROPOSED / REJECTED / SUPERSEDED.
- **Scope:** GLOBAL / SERIES / EPISODE / SHOT / COMPONENT, and exact episode+SHOT keys when applicable.
- **Context / original expectation:** narration anchor, visual beat, current source commit/contract/voice Take version.
- **Problem observed:** what actually looked wrong or was inaccurate, not an invented lesson.
- **Approved correction:** precise visual or technical change; before/after state and design tokens where applicable.
- **Preventive rule:** one short check that can be applied **before** coding the next SHOT.
- **Affected assets / dependencies:** exact existing component paths and next-SHOT continuity effects.
- **Evidence:** Director feedback ID or review URL, PR/commit, still-frame/MP4 render IDs if available.
- **Verification:** what actual test/preview/director observation proved the fix. If not verified, say NOT_VERIFIED.
- **Promotion:** none / new recipe / new reusable component / amended constitution, plus PR.
- **Supersedes:** older rule ID, if a later Director decision intentionally changes it.

Do not encode credentials, private voice audio, production secrets or user personal data here. Reference immutable IDs where relevant; never fabricate timestamps or screenshot observations. Director acceptance must never be synthesized by an agent.

### Example shape — NOT A REAL INCIDENT

AT-VIS-0000 is a **template, not a recorded correction**:
- Date / decision: N/A / TEMPLATE_ONLY.
- Scope: EPISODE / SHOT.
- Problem: [state what was actually observed after a real review].
- Approved change: [exact adjustment accepted by Director].
- Prevention: [preflight question].
- Evidence: [real verified PR or Director approval].
- Verification: NOT_VERIFIED until a review occurs.

## Active accepted corrections

**None imported yet.** The historical official style failure modes are enforced by the constitution. It would be inaccurate to invent a past corrections log based on general visual advice. Backfill only where an exact Director-approved conversation/screenshot and its referenced result are available.

## Director-observed correction AT-VIS-0001 — SHOT02 comprehension pacing (2026-11-07)

- **ID:** AT-VIS-0001.
- **Date / Director decision:** 2026-11-07; Director REJECTED the V2 speed/readability and requested correction. New V3 implementation is PROPOSED, **not yet Director-accepted**.
- **Scope:** SERIES acceptance gate; concrete first failure EP002 SHOT02.
- **Context:** production V2 MP4 render `eba3a449-574e-4b99-8007-080e4c496e5c`, 1205 frames at 30 fps (40.17 seconds), approved current ElevenLabs Take and real 5 beat / 7 term anchors.
- **Problem observed:** Director reports some main architecture objects are only visible for approximately one second, making the content hard to understand. In V2 code, focus fades after as little as ~21 frames past the named term and the node's enlarged interior disappears with it.
- **Proposed correction:** keep each primary named node's enlarged interior visible for 120 frames (4 seconds) when the actual video has space; slow reveal, repeated Login clicks and arrival ramp; reject ultra-short camera focus windows and preserve actual spoken term onsets. Keep SHOT01/EP001 sources protected and do not change narration alignment.
- **Preventive rule:** if an architectural object cannot be clearly read in a steady, meaningful 3–4 second window, it must not be treated as review-ready. If the unchanged voice forces a shorter window, flag an audio pacing/re-alignment requirement rather than faking timestamps.
- **Affected assets:** `Shot02DirectorPacing.ts`, `Shot02GeneratedScene.tsx`, `shot02-director-v2.test.mjs`, series visual constitution. No protected shared components modified.
- **Evidence:** Director feedback in this conversation, V2 render ID above; proposed fix on Draft PR #192.
- **Verification:** 18/18 isolated pure source-test bodies passed against updated GitHub source, including camera bounds and minimum interior visibility; **V3 Remotion production build, frame QA, audible-pauses revision and MP4 Director review NOT VERIFIED**.
- **Promotion:** visual constitution updated as rejection/prevention rule, without claiming new V3 visual acceptance.
- **Supersedes:** the former interpretation that a 0.7-second post-word visual hold is sufficient.

## Mandatory per-SHOT read and filter

Before working on each SHOT, Codex must read this **entire short ledger** and:
1. Apply every current GLOBAL/SERIES entry.
2. Apply all entries targeting the episode, current SHOT, its dependent component or adjacent shared transitions.
3. Check superseded entries for conflicts without reapplying obsolete behavior.
4. Output the relevant correction IDs and a one-sentence prevention statement in its preflight report.
5. If source/evidence is missing, mark the correction UNVERIFIED and request review; do not treat it as established truth.

After Director gives feedback and an approved code/preview exists, capture the accepted lesson **before the next SHOT is generated**. A correction for one isolated shot is not an automatic global style change. Propose promotion when the same pattern is reusable.

## Small change workflow

Director feedback → scoped code correction → QA and screenshot/preview comparison → Director confirmation → append evidence-backed ledger entry → targeted code recipe/component extraction if useful → commit/PR review → next SHOT preflight reads latest ledger.

**Version control is the persistent memory.** No dependence on hidden model memory, previous Codex chat, generic embedding retrieval or an unreviewed text generation.


## Director-observed correction AT-VIS-0002 — EP003 SHOT08 V1 shard and replica readability (2026-11-15)

- **ID:** AT-VIS-0002.
- **Date / Director decision:** 2026-11-15. Director requested three changes after viewing real V1 MP4. V2 correction is **PROPOSED / UNDER REVIEW**. **Not Director-accepted or LOCKED**.
- **Scope:** SERIES preventive design preflight. EP003 SHOT08. Shared visual principles for all next Architectural Thinking SHOTs.
- **Context:** Real saved SHOT08 V1 MP4 render `02dbdec4-167f-4d44-9780-74dc1f0aa0a5`. Same original selected Slow Natural voice take `368c239c-a93b-437e-a833-2f955fa51803`. 5372 frames. Screenshot of shard owners and read replicas supplied directly by Director.
- **Problem observed:** Two duplicate `ACCOUNT OWNER` labels overlapped each other beneath adjacent Shard A and B. Replica A/B icon and title were not completely contained within each replica card boundary, especially near the lower edge. `REPLICATION VS SHARDING` explained the difference with an ambiguous fragment `Copies of data. Different data owners.`, rather than naming both mechanisms.
- **Proposed correction:** Increase shard x-spacing to 165px. Relabel `OWNER A` and `OWNER B`, preserving established visual world and actual Login packet paths. Put each replica icon and text fully inside its existing card by moving title baseline from top+111 to top+98 and scaling icon to .92, eased smoothly during the early V2 frames. Display the clearer two-line definition `Replication copies the same data.` and `Sharding splits data between owners.`. Each line independently measured at 26px and card height adjusted to165px. All on-screen sentences use periods, not semicolons.
- **Preventive rule:** Before a render, check adjacent-node label widths against *neighbor label widths* with actual spacing margin, and check each icon and label bounding box against its **own container border** at all animated scales. For comparison cards, explicitly name both concepts in separate readable sentences with independent text-fit measurement. Keep requests on their physical paths and preserve exact previous decoded last frame in the new SHOT.
- **Affected assets / dependencies:** `remotion-engine/src/episodes/ep003/Shot08WhenCopiesAreNotEnoughV2.tsx`, `remotion-engine/ep003-shot08-sharding-v2-p0.test.mjs`, `remotion-engine/ep003-shot08-sharding-v2-render-once.mjs`, and V2 review frontend. Existing V1 and all Director-LOCKED SHOT01–07 unchanged.
- **Evidence:** Screenshot and three explicit corrections in this conversation; V2 code commit `61b7aa1827ab15920f56031fcff9118375cfcedd`; [draft PR #302](https://github.com/stefanVasilev17/media-os/pull/302). Pre-render first-frame still matched original last frame at 100 dB.
- **Verification:** V2 Remotion scene tests **4/4 pass**, bundle built, selected original voice, 29 real anchors and exact P0 still verified. Final encoded MP4 and Director visual review **NOT_VERIFIED** at time of entry. Do not claim corrected appearance is accepted until Director watches V2.
- **Promotion:** Proposed series-wide layout guard. Preserve as observed incident but do not declare implementation LOCKED until explicit Director approval.
- **Supersedes:** None.



## Director-observed correction AT-VIS-0003 — EP003 premium engineered data routes (2026-11-16)

- **ID:** AT-VIS-0003.
- **Date and Director decision:** 2026-11-16. Director rejected the loose, oversized curving arrows in the rendered SHOT09 V1 screenshot and explicitly requested a stronger tier ++ routing visual language for EP003 SHOT08, SHOT09 and SHOT10. **Correction requested and code implementation proposed. Not Director-LOCKED until reviewed.**
- **Scope:** SERIES routing grammar. EP003 SHOT08 V3 and SHOT09 V2 review candidates, and future SHOT10. Previously Director-LOCKED SHOT08 V2 and the official eight-shot master remain preserved unchanged.
- **Problem observed:** Ad hoc cubic arrows curve around nodes and replica cards, approach owner labels, and produce a hand-drawn/sci-fi-wire look instead of engineered architecture.
- **Implementation:** New versioned deterministic shared primitive `remotion-engine/ep003-premium-routing.mjs` with five named pathways `AUTH_A`, `AUTH_B`, `REPLICA_A`, `REPLICA_B` and `RECOVERY_A`. Consistent 12–24px curved corner transitions, long precisely horizontal or vertical rail segments, stroke 2.6px, restrained 5px packet glow, smaller 3.7px packets, quiet outer rail. The moving packet's coordinates are sampled directly from the exact route's line/quadratic segments, using arc-length sampling. No separate independently animated decorative dot coordinates. Replica B travels down the *outside* right vertical lane before entering its own card, never looping across Replica A or labels.
- **Reusable future standard:** `src/episodes/ep003/Shot10PremiumRoutingContractV1.ts` consumes exactly the same route geometry, marker sampler and validation. SHOT10 cannot invent new loose freeform curves without separate Director approval. This is infrastructure, **not** a claim that EP003 SHOT10 has been rendered or visually accepted.
- **Exact continuity:** SHOT08 V3 is a candidate derived from the previously Director-approved V2 design, retaining original Slow Natural voice, existing SHOT07 V3 frame-zero handoff and all text-fit guards. SHOT09 V2 is separately rendered only against the actual previously saved SHOT08 V3 candidate frame/MP4, with source-key, engine-version, real SHA and decoded join checks. The established official eight-shot master does not silently change.
- **Preventive QA:** `remotion-engine/ep003-premium-routing.test.mjs` validates route endpoints, boundaries, card clearances, packet centerline contract and cross-shot shared usage. Additional V3/V2 tests enforce genuine selected narration, unchanged older versions, real first-frame seam and early motion after encoding. Code/test green alone does not prove Director visual acceptance.
- **Director visual acceptance needed:** Verify SHOT08 V3 and SHOT09 V2 video at full-resolution in MediaOS. If approved, preserve as explicit Director LOCK sources and only then update the official episode master and future SHOT10 routing standard status. No paid voice regeneration.
- **Supersedes:** None. Builds on AT-VIS-0002, which covers labels and replica-container containment.



## Director-observed correction AT-VIS-0004 — EP004 SHOT05 cinematic gateway cutaway (2026-11-22)

- **ID:** AT-VIS-0004.
- **Date and Director decision:** 2026-11-22. Director explicitly **REJECTED EP004 SHOT05 V1 visual behavior** and required a different tier++ story, no orange-path malfunction, no repetitive zoom, a strongly motivated cinematic camera and a smooth SHOT04 handoff. New V2 code is **IMPLEMENTED, TESTED AND DEPLOYED; NOT DIRECTOR VISUAL-LOCKED** pending a fresh Director-approved render and review.
- **Scope:** EP004 SHOT05 only, including its episode-local deterministic cutaway/camera helper and regressions. Locked SHOT01–04, original selected SHOT05 Take, narration alignment and previously approved MP4s are protected.
- **Context / original expectation:** Original selected SHOT05 voice, genuine `verifiedCues` and `visualBeats` passed by MediaOS at render time; exact LOCKED SHOT04 MP4 and original last-frame PNG. SHOT05 V1 Director render `23071945-c832-49cb-8d34-d711bd8ae3d2` completed technical H264/AAC/30fps and seam PSNR 44.41; **technical success was not artistic acceptance**.
- **Problem observed:** Director reported broken-looking orange routing and a repeating zoom loop; SHOT05 reused essentially the same map animation grammar from SHOT02–04, leaving the narrated engineering consequences visually repetitive and unclear.
- **Requested / implemented correction:** SHOT05 V2 begins with the genuine decoded last SHOT04 PNG at pixel-exact frame zero, uses one irreversible dive into a **Gateway X-ray cutaway** in the *same* established navy/technical architecture world, replaces legacy static map overlays with a legible internal Primary Gateway route-policy mechanism and six geometrically constrained Outlook, Teams, Mailbox and alternative paths. Real voice `beatId` / cue starts choose MAIL / SHARED / CONFIG / SWITCH / DEGRADED / ALTERNATIVE / CONSEQUENCE; repeated packet movement is bound to those routes, visible route switches trade traffic between old and new lanes, orange is restricted to a stable constrained state (never a pathological amber animated path). Strong two-stage camera poses are finite and source-time-based: panoramic cause, motivated controlled dolly, steady educational hold, then smooth transition to the next voice cue. No inherited nested SHOT03 camera transforms or recurring sine/zoom.
- **Preventive rule:** New SHOTs must **change the explanatory view when the story changes** rather than recycling a living map and stacking transforms; use genuine selected-Take anchor timing and exact Source SHAs. Check previous encoded frame0, spline containment/endpoint constraints, semantic cue-to-path correctness, single absolute camera, no cross-cue position jumps, no looping zoom, legible 3–4-second holds where voice spacing allows, and blocked expensive renders until the Worker has actually compiled the new code.
- **Affected assets / dependencies:** New `remotion-engine/src/components/architectural-thinking/EP004Shot05CinematicWorld.mjs` and `.d.mts`; revised `EP004Shot05ProductionWorld.mjs`, `.d.mts`, `src/episodes/ep004/Shot05ProductionScene.tsx`, and `ep004-shot05-production.test.mjs`. Existing `Root.tsx`, Worker audio mux, Director security, locked originals and source Take are **unchanged**.
- **Evidence:** Director correction in this chat; prior actual V1 render ID above; new scene code commit `c6066f1c3cf7525e44abfb6666456948fded14a4` on `feat/ep004-shot05-living-gateway-motion-20261122`.
- **Verification:** SHOT05 V2 **8/8 automated tests PASS** including frame zero, geometry, source/voice-keyed camera bounds, cue-boundary continuity and stable camera holds. Shared Worker regressions **173/173 PASS**. Remotion/Factory bundles built, no new TypeScript diagnostics; **one pre-existing protected EP001 diagnostic** remains accepted. Existing Railway Worker deployment `09bf16d7-6b2d-47f7-b62a-969f584491c9` **SUCCESS**, exact source `c6066f1c3cf7525e44abfb6666456948fded14a4`, live capability heartbeat 5 EP004 scenes. New V2 encoded MP4 and Director visual inspection: **NOT_VERIFIED / NOT_LOCKED**; costs require one explicit fresh Director render.
- **Promotion:** Episode-local SHOT05 cinematic recipe only; series-level promotion requires separate Director approval after viewing the real full-resolution result.
- **Supersedes:** SHOT05 V1 visual candidate only; does not supersede Director-LOCKED SHOT04 or global style system.


## Director-observed correction AT-VIS-0005 — EP004 SHOT05 V2 rejected: content fit, readability, one focus (2026-11-23)

- **ID:** AT-VIS-0005.
- **Date and Director decision:** 2026-11-23. Director provided an actual frame screenshot of the V2 Gateway X-ray and **explicitly rejected the visual as unclear and confusing**; requested total scene replacement, no upper microcopy, no text outside containers, and a ready-to-render SHOT05 through the existing connected Executor workflow. V3 implementation has passed source tests and Railway deployment; its new MP4 has **NOT** been rendered or visually accepted.
- **Scope:** EP004 SHOT05 only. Preserve Director-LOCKED SHOT01–04, real selected SHOT05 Take, genuine HEAR→SEE cues, immutable SHOT04 MP4 and original decoded frame0.
- **Original problem evidenced by the Director screenshot:** Multiple competing all-at-once glowing routes and six always-drawn rails; central X-ray card large but hard to understand; side nodes/cards cropped near the screen edge; Alternative Gateway behind a lower timeline; tiny top 'INSIDE THE ARCHITECTURE' and duplicated mini chapter text; titles and captions overly dense and at risk of escaping containers. Previous screenshot also described loops / orange path glitches.
- **Director-approved direction, implemented as V3 code for review:** **One primary visual cause per actual voice beat.** Remove entire X-ray/microcopy/lower rail scene. Use permanent Living Architecture dark palette and same Outlook/Teams/Primary/Alternative/Exchange Online/Teams identities, but physically bounded to a safe 1920×1080 content rectangle. A short, content-measured large headline appears only when selected voice cue begins; no upper micro-labels, mini descriptions or bottom timeline. Show **Outlook → Primary → Exchange**, **Teams → Alternative → Teams**, **both workloads → Primary shared dependency**, **constrained capacity** and **Teams reroute** only when supported by approved real cue directions/anchors, progressively revealing the relevant nodes and 2 route segments, rather than painting every path. Show literal '14%' only when a cue contains 'fourteen percent', '14%' or '14 percent'; never invent a capacity figure. The Primary Gateway can show capacity lost as a proportional bar only when spoken. Moving packets are stroke dashes **on exact real paths** rather than separately interpolated dots off the routes. Orange is only a real constrained status, not a moving orange path. There is exactly one single bounded non-repeating camera transform (scale 1.0–1.027); steady holds and a genuine exact first-frame SHOT04 PNG crossfade preserve continuity and reading time.
- **Preventive rule:** BEFORE paid render, test every on-screen actual title's measured width+54px margin against its own node, ensure safe full-HD bounding boxes and zero overlaps at camera bounds, forbid unreadable fonts (26px+ node labels, ~47px dynamic headings), prohibit redundant upper mini-headings and lower HUD bars, check real spoken metric numbers before displaying them, prove frame0 continuity and finite camera, and verify only voice-relevant lanes light up. Do not equate 9/9 Node tests or Railway SUCCESS with visual Director approval.
- **Affected code:** New `remotion-engine/src/components/architectural-thinking/EP004Shot05ClarityWorld.mjs` and `.d.mts`; revised `EP004Shot05ProductionWorld.mjs`/type declaration, `remotion-engine/src/episodes/ep004/Shot05ProductionScene.tsx`, and dedicated `ep004-shot05-production.test.mjs`. Rejected V2 `EP004Shot05CinematicWorld.mjs` remains in Git history and is no longer used by the SHOT05 production composition. No changes to protected older scenes, voice, render CPU worker identity, backend auth or MP4 output format.
- **Evidence:** Director's attached screenshot (2026-11-23), source-locked corrective commit `79ab53b2c1e46b6d72d3c720160d10916976d098`, Railway V3 Worker deployment `922b8e0a-835e-44fa-b5dd-4cf37d50af0a`.
- **Verification:** Dedicated SHOT05 V3 **9/9 PASS** (source contracts, exact frame-zero continuity, measured typography, no collision, safe paths, semantic cue-driven 14% display, stage-by-stage progressive reveal, zero zoom loop, zero microcopy, canonical voice/MP4 mux). Shared worker suite **173/173 PASS**. Factory source validation PASS, Remotion TS zero new errors (one documented unrelated protected EP001 baseline), regular and Factory bundles PASS. Railway `media-os-render-worker` status **SUCCESS**, runtime capability heartbeat `source=79ab53b2c1e46b6d72d3c720160d10916976d098 scenes=5`, one CPU render concurrent, explicit promotion-only watchers restored. **Real V3 full-frame rendered preview: NOT VERIFIED; final visual LOCK: NOT APPROVED.**
- **Promotion:** Episode-local single-focus progressive scene recipe only pending separate Director review; preserve global content-fit/no-microcopy rule already in AGENTS.md.
- **Supersedes:** AT-VIS-0004's rejected V2 cutaway implementation only; earlier engineering continuity and all locked prior media remain unchanged.


## AT-VIS-0006 — EP004 SHOT05 V4 abrupt rerouting / V5 continuous packet migration

- Date / decision: 2026-11-24 / V4 correction requested; V5 direction approved, actual V5 visual review pending.
- Scope: EP004 SHOT05, episode-local traffic migration recipe.
- Observed problem: Director screenshots from V4 render 2e995fb0-a080-417e-9718-0f728b0cd018 show abrupt change between Teams alternative path and shared gateway/capacity state. Director requests traffic itself reroute continuously rather than swapping scene state.
- Implemented correction: same living map and stable camera, matched gateway housings, deterministic full-path packets assigned at emission, old packets finish, new packets change route gradually on verified semantic cues, old lane drains and fades, capacity indicator replaces HEADROOM LOW; no fabricated percentage.
- Preventive rule: for rerouting stories, separate routing decisions for new arrivals from in-flight packet state. Capacity-only cue cannot independently redirect packets. Keep topology visible and test packet continuity, true port geometry and old-path drain before rendering.
- Affected files: EP004Shot05ClarityWorld.mjs/.d.mts, Shot05ProductionScene.tsx, ep004-shot05-production.test.mjs. No previous locked shots, audio takes or worker authorization modified.
- Evidence: source 228620b237ac5002449461c975714aebaf295d17; Railway ec60114b-b067-40ec-a278-7b21ea572281 SUCCESS, exact runtime source confirmed. 15/15 SHOT05 and 173/173 shared tests, both bundles PASS.
- Verification: code and live deployment verified; V5 actual MP4 NOT_RENDERED, Director visual LOCK NOT_APPROVED. Authenticated UI readiness body not independently checked.
- Promotion: episode-local only; consider reusable shared component after Director reviews V5.
- Supersedes: V4 abrupt routing behavior only; earlier content-fit and continuity lessons remain active.


## AT-VIS-0007 — EP004 SHOT05 V5 sharp styling / premature failover path visibility

- Date / decision: 2026-11-24 / V5 correction requested; V6 implementation authorized; actual visual approval pending.
- Scope: EP004 SHOT05, episode-local route reveal and gateway design.
- Observed problem: Director says V5 is too sharp and gateways/motion too rigid; upper Teams route is already visible before rerouting. Prior V5 actual render 1cb7a38b-e6b5-4711-9b49-e40c906902c1 passed technical QA, not visual LOCK.
- Correction: omit the unused upper ingress, internal channel and egress until the first new packet; progressively reveal them in travel order just ahead of that packet. Keep old in-flight packets and route drain. Use rounded shared path geometry, softer palette, layered rounded device bodies and processing glow driven by packets rather than independent timers.
- Preventive rule: a future route which must not yet exist visually must be unmounted at zero reveal, not rendered as a dim skeleton. Test zero visibility across preceding capacity-only cues, matching rounded path/packet geometry and ordered monotonic reveal.
- Affected files: EP004Shot05ClarityWorld.mjs/.d.mts, Shot05ProductionScene.tsx, ep004-shot05-production.test.mjs. Immutable prior frame and Take unchanged.
- Evidence: e58bb694d75374245a9780611c5071006616ef99; deployment 1ec15de2-6cd2-45ec-a47d-528839c2b719 SUCCESS, exact Factory heartbeat; 17/17 SHOT05, 173/173 Worker, both bundles PASS.
- Verification: source regressions and live Worker verified; actual V6 MP4 NOT_RENDERED; visual LOCK NOT_APPROVED. Authenticated readiness response not independently checked.
- Promotion: episode-local pending Director visual review.
- Supersedes: V5 faint failover-route skeleton and sharp visual treatment only; packet migration and predecessor/voice contracts remain.

## AT-VIS-0008 — V7 glass reference / V8 cue priority and capacity pulse

- Director rejected decorative gateway motion in V6, approved the V7 static rounded glass reference, then reported that the actual V7 render did not visually communicate the quoted Teams migration sentence. V7 source 655fc4390204ea92cd1c506aece41e7c72476f3f, render 00ed0dab-8001-4624-b9ce-afcb839e4e5b.
- V8 correction: prefer the exact verified speech anchor for moved Teams traffic over unrelated earlier failover direction keywords; brighter and faster continuous new-route packets, preserve old-route drain; 14% rail only pulses brighter on its cue with no gateway transform. Keep the V7 glass design, hidden future route, fixed shells and approved source/voice.
- Verification: 405ad2a1abbdded1c06f62f45e3f0a7427d897a7; Railway 85a91202-ae6e-405d-b35c-c3a4c40c8873 SUCCESS; SHOT05 21/21, Worker 173/173, bundle and source validation PASS. Regression uses representative cue fixtures, not authenticated production cue inspection. Actual V8 MP4 not rendered or visually locked; no separate paid render started.
- Preventive rule: a narrated action needs a specific cue-priority test and a physical path traversal test, not merely a headline test. Warn via local brightness, not bouncing infrastructure. Episode-local until Director review.

## AT-VIS-0009 — V8 failed shared-route checkpoint / V9 actual-job route gate

- Evidence: Director screenshot of V8 at 01:03 showed old Teams path still active with no visible reroute; V8 render b6a98026-8ed2-4e92-aa66-209c81b8f303 had passed technical QA but not visual review.
- Corrected V9: preserve matched real cue if early enough, otherwise apply a clearly disclosed episode-local editorial checkpoint (2573-frame duration, latest onset 1740, shared checkpoint 1890). This does not establish an exact voice timestamp. Run physical traversal/old-flow-drain audit against actual authenticated render props before expensive generation; log the selected reason and checkpoint results. Keep hidden future route before emission, V7 glass and V8 amber, exact predecessor and original audio.
- Verification: df63d0427ffdc357cb93fd7700b83afc2b8edff4; Railway 074cdcb9-320a-4765-b80d-01a51c9d9ec6 SUCCESS, exact runtime source verified; 24/24 shot tests, 173/173 Worker tests, both bundles and source validation PASS. Actual selected-Take cues not inspected independently; actual-job gate pending next authorized render. No new MP4 or LOCK.
- Preventive rule: technical QA and synthetic cue fixtures alone cannot establish visual causality; test production render inputs before generation and preserve explicit Director visual checkpoints separately from actual narration timestamps. Episode-local until review.

## AT-VIS-0010 — Director-approved iconic grid and luminous route reference

- Approved reference: meaningful endpoint silhouettes, service racks, rounded static gateway shells with external captions, strong rounded routes, luminous round packets, subtle grid, restrained color and glow. Implemented episode-local in V10; no global component migration or retroactive changes to locked shots.
- Preserve V9 physical traffic causality, original voice and checkpoint, and V8 local amber pulse. Actual V9 render audit recorded cue frame 2338 versus editorial onset 1740; V10 fixture uses these observed values, not an invented transcript. V10 physical geometry and text-fit checks passed.
- Evidence: 1766ff8391b81c928acae0578cfebcae73d7a1b1; Railway 96f26d0a-433a-45b9-a7c4-7105c4836d61 SUCCESS, exact live source confirmed, 26/26 SHOT05 and 173/173 Worker tests, both bundles PASS. Initial obsolete uppercase caption assertion corrected. V10 actual MP4 and Director approval pending.
- Preventive rule: distinguish client/service/infrastructure silhouettes, use labels outside the object when the approved reference does, preserve actual anchored route geometry and do not add decorative motion inside infrastructure. Promote shared primitives only after rendered Director review.

## AT-VIS-0011 — V10 actual render Director LOCK and approved visual reference

- Director approval: “Ето това е . LOCKED!” (2026-11-24). MediaOS authenticated SHOT05 film-lock POST HTTP 200 at 21:26:34Z after V10 playback.
- Immutable reference: actual render 38162e2a-3bc2-4c07-80d8-fa445cdc5e8d, source 1766ff8391b81c928acae0578cfebcae73d7a1b1, 2573 frames, last encoded index 2572, 85.766 seconds, 8334213 bytes, 1080p30 H264/AAC. Technical MP4, original Take/72f delay, predecessor QA PASS, seam PSNR 44.56; actual route audit PASS. Persisted lock manifest body/SHA-256 must be obtained through authorized preflight, not invented.
- Promote V10 visual language as Director-approved reference for prospective reuse: iconic endpoints, external labels, static rounded gateway shells, visible ports, thick smooth luminous routes, round packets, subtle grid, local meaningful warning pulse. No decorative bouncing, no visible future paths before activation, no abrupt rerouting. Preserve genuine cue evidence separately from editorial timing.
- SHOT05 is locked; never retroactively refactor its media/source. Future shared-library extraction must preserve locked outputs and pass new tests. No render or deployment performed for this lock documentation.


## AT-VIS-0012 — SHOT06 V1 frozen predecessor despite technical motion QA (2026-11-25)

- Director liked rendered server fleet but rejected frozen outgoing map and decorative microcopy. V1 render b1618ea8-aa98-4b6e-8362-f904c2470a29 technically passed; 30 unique frames from opacity changes alone did not prove motion of the outgoing map.
- V2 source removes four specified labels and demand rail. Preserve exact decoded frame zero, then phase-match real forward-moving SHOT05 tail (18f packets / 48f pulse = 144f period). Validate real phase and motion before CPU; dissolve inside existing 72f silence and verify unchanged frame count. No blanket use of a periodic replay for nonperiodic footage; fail closed if phase does not match. No assertion of actual Microsoft telemetry. No protected SHOT05 source/media edit. New visual LOCK pending Director review.

## AT-VIS-0013 — Director-approved global minimum visual quality floor

- Date / decision: 2026-11-25 / APPROVED.
- Scope: GLOBAL — all future Architectural Thinking videos.
- Context: Director reviewed real EP004 Full Video SHOT01–06 and liked it.
- Problem observed: No new visual defect reported; Director explicitly prohibits any lower visual level in future videos.
- Approved correction: Treat the reviewed video as minimum visual baseline, equal or improved Tier++ scene quality. Premium physical architecture, readable hierarchy, meaningful traffic, realistic component depth and cue-driven camera.
- Preventive rule: Compare future SHOT design and actual preview against the approved baseline; preserve story-distinct visuals and exact locked predecessor, not just decorative animation.
- Affected assets: EP004 SHOT01–06 existing locked source assets remain immutable; SHOT06 V2 render 2b68bda7-8f0d-471f-a2d5-78e5765ac63e; Full Video 7783e0ec-d8c5-3aa2-9621-694c66ea12e0.
- Evidence: Director's explicit approval in conversation, after verified AVC1 Full Video publication.
- Verification: Director visual approval of reference confirmed. Future SHOT08 not verified or approved.
- Promotion: Core visual constitution amended.
- Supersedes: none; strengthens existing quality rules.

## AT-VIS-0014 — TOP PRIORITY: multi-diagram visual storytelling and SHOT07 V2 polish

- Decision: 2026-11-25, Director explicitly approves multi-diagram direction as a permanent high-priority rule for every future video.
- Reference: EP004 SHOT07 V1, render eaa9262d-aec1-40d3-b784-6b1ceecfafd3, source c0fab93b7a7f766d80fa0d31724b09d57056338d. Actual technical QA PASS, 2606 frames, seam PSNR 44.60. Director praises the distinct fleet, fleet-scale and Reel diagrams; requests two corrections. This is approval of visual direction, not final SHOT07 LOCK.
- Prevention: plan multiple complementary diagrams across the episode and within a SHOT whenever narration changes concept/scale/perspective; consistent world and service identities, distinct teaching purpose, motivated cue-bound transition, sufficient reading time. Never default to one repeated map; no arbitrary quota. Preserve AT-VIS-0013 quality floor and all protected inputs.
- V2 scene correction: returning packets (RESPONSE phase) have red core and halo in all three diagram views; forward traffic, stopped traffic, router health indication, camera, timing, geometry and voice remain unchanged. Red is the Director's requested SHOT07 visual convention for return traffic in this incident, not a blanket assertion that all network responses are errors. Remove only the displayed "Schematic fleet · not an actual server count" and "ILLUSTRATIVE REQUEST" text. Keep Microsoft attribution, reported metric, elapsed period and causal contrast; fleet icons are schematic and never asserted as actual server counts.
- Code: d913df6382d711aed2bf636f698d882aa77fd113; test/promotion pin 232fb7ef9dbcfa2e2d8c3d9e326660ea2a17be56. V2 actual MP4 review pending Director render. No new voice or automatic render.
- Promotion: top of Visual Constitution and AGENTS.md startup rules; global priority.

### AT-VIS-0014 — Director re-confirmation and immutable SHOT07 V2 reference (2026-11-25)

Director explicitly said SHOT07 is LOCKED, praised the several diagrams again and reiterated the top-priority requirement for all future videos. Actual V2 render c51cbbda-f832-4c46-8a37-cc3116f50e1f, source 232fb7ef9dbcfa2e2d8c3d9e326660ea2a17be56, 2606 frames, 86.8667s, 5392351 bytes, 1080p30 H264/AAC, actual technical QA and approved Take/72f delay PASS, seam PSNR 44.60. Actual authenticated film-lock POST HTTP 200 at 10:54:23 UTC. SHOT07 V2 is the protected multi-diagram quality reference; no retroactive modifications. Apply the same principle to SHOT08 onwards: different causal/scale/dependency views, not arbitrary visual variety, preserve the continuity and genuine story, no automatic render. The top-priority rule is already promoted into AGENTS.md and the Constitution; do not demote it.

## AT-VIS-0015 — stable diagram identity, subtle living dynamics and SHOT08 V2 correction

- Date / decision: 2026-11-25, Director requested correction; actual V2 MP4 acceptance pending.
- Scope: GLOBAL visual direction; EP004 SHOT08 correction.
- Evidence: SHOT08 V1 render f58b1589-983f-4a5b-b1b9-1dec4106d6cb, source 54d1da62f89eb931546fa498f8c6d696cba28e16; actual technical QA PASS, seam PSNR 45.59, 30 animated opening frames. Director observed orientation mismatch and static-looking regional objects; requested exact SHOT07 continuity, horizontal identity, subtle modernization, removal of “Reported regional capacity partitions — conceptual view”.
- Correction: source 0d21d17d771ffc7c09b7d208a8e95d3ad229cc27, episode-local SHOT08 scene/world/types/tests only. Preserve exact V1 inherited Reel geometry and frame-zero verified SHOT07 PNG; transition over frames 24–72 to byte-identical SHOT07 horizontal Fleet renderer, retain final server states and living route motion, then cue-driven regional view. Same Router primitive and horizontal port layout within region boundaries. Add restrained beveled edge details, status-light activity and local forward/return packets; preserve capacity-unit geometry/material family. Remove requested subtitle, keep conceptual region labels and no invented measured topology. Dependencies/outcome unchanged. Original Take, cue clocks, locked SHOT07 and earlier sources unchanged.
- Preventive rule: same mechanism retains canonical orientation; diversity means changing narrative viewpoint, not inconsistent object identity. Actual final frame must survive intentional vertical-to-horizontal transition. Subtle motion is top-priority alongside AT-VIS-0014; no arbitrary camera/particles or invented telemetry.
- Verification: source committed; build/runtime checks pending. No automatic paid render.
- Promotion: AGENTS.md and Visual Constitution, above normal visual rules.

## AT-VIS-0016 — contained status labels and minimal workload captions

- Date / decision: 2026-11-25, Director requested EP004 SHOT09 V2 correction; MP4 acceptance pending.
- Evidence: actual V1 render 05ae1751-e54c-428b-8fd0-a05811bc9377 at 94a2d05e398ff2eef9e4c0dcbebaeca27d503f8c, Director screenshots: redundant “Illustrative workload pressure” caption; “Responding” exceeds its status-pill boundary. Technical MP4 QA passed, but this is a visual defect.
- Correction: remove only that caption, retain the live workload bar; extend the Simple check pill from 190 to 250 px while keeping its input port, status dot, type and baseline unchanged. Keep conceptual attribution and all timing, routes, voice and predecessor intact.
- Preventive rule: measure every status label against its own container, reserving left/right padding and dot spacing, rather than fitting text to the frame alone. Check all animated states and use conservative layout regression guards plus actual rendered visual review. No clipping, squeezing or unjustified smaller text as a substitute for sufficient space.
- Verification: SHOT09 V2 source regression added; production build/readiness and Director MP4 review pending. No automatic paid render or TTS.

- V2 build guard detected that 250 px left only 20 px against the conservative width budget; corrected to 260 px, giving 30 px reserve without altering font or route. Keep the regression threshold unchanged.

## AT-VIS-0017 — remove redundant explanatory subtitles (SHOT10 V2)

- Director feedback: remove “Design principle · illustrative alternative”, “Conceptual fleet view” and “Illustrative recovery mechanism” from SHOT10. Do not replace them with other explanatory subtitles. Prefer architecture, motion, concise headings and narration to redundant metadata.
- Preserve original LOCKED narration, real cue/event clocks, exact SHOT09 V2 predecessor, all object geometry, request/response motion and controlled-admission behavior. Controlled admission remains an engineering design principle, not a claim about actual Microsoft remediation. Fleet scale remains schematic; no actual server count or topology claimed. The Director explicitly supersedes the earlier visual subtitle instruction for this shot only; factual accuracy remains mandatory.
- Regression: verify all three unwanted captions are absent and both original teaching headings remain. No paid render or voice generation started. Director MP4 acceptance pending.

## AT-VIS-0018 — TOP PRIORITY: persistent-world cinematic diagram transitions (SHOT12 V2)

- Date / decision: 2026-11-26 / Director APPROVED and LOCKED; explicitly requested permanent global reuse.
- Scope: GLOBAL — all Architectural Thinking episodes and future SHOTs, starting with EP004 SHOT13.
- Problem observed: SHOT12 V1 opening crossfade between full diagrams was chaotic, too slow and PowerPoint-like; the Director requested rapid modern focus and removal of three redundant captions.
- Approved correction and prevention: **Mandatory global motion grammar.** Reuse the Director-approved EP004 SHOT12 V2 repair transition as the default for a change of diagram that shares the same architecture. Keep one persistent living world and stable identities, ports, routes, traffic phase and anchor geometry. At the real spoken transition cue, use one finite, absolute camera reframe plus local geometric reveal/transform and route emphasis; the incoming focus must become readable promptly. The approved reference reaches full reframe in 12 frames (0.4 s at 30 fps) from IDENTIFY, rather than waiting 202 frames for FIX. Treat 12 frames as the default for comparable local refocus, not a mandatory duration for every change of scale or genuinely different diagram. Preserve readable holds and the actual later semantic event: fixing code starts at FIX, never at the camera cue. Avoid full-diagram crossfades, stacked translucent copies, slideshow-like dissolves, frozen holds, nested zoom loops and slow focus reveals. Use a motivated spatial change or clean cue-bound cut for a genuinely distinct viewpoint; no unnecessary transition for its own sake. Subtle local status/glow opacity is allowed; do not mistake this for permission to dissolve two whole diagrams. This complements AT-VIS-0014/0015: distinct narrative views, same coherent world. Always preserve the exact decoded Director-LOCKED predecessor frame at frame zero, real moving continuation, verified selected Take, event causality and approved source. Do not retroactively change locked scenes. Remove redundant explanatory captions rather than replacing them with other metadata (AT-VIS-0017); retain essential semantic labels and factual clarity. Before CPU, compare the pinned reference implementation, test bounded deterministic camera timing, one persistent opening scene, no overlapping full-view opacity, correct event separation, route/label bounds and actual motion; Director reviews the actual MP4.
- Evidence and affected assets: **Approved reference:** EP004 SHOT12 V2, source `00d06593da7c6d8893618f2d90daaba0a3de725f`, render `9728581f-632b-421f-b004-f96281b00569`, 2613 frames / 87.1 s / 1080p30; Worker completed 5,354,850 bytes, approved Take mux PASS, seam PSNR 44.69 dB and 30 distinct opening frames. Authenticated Director film-lock POST for SHOT12 HTTP 200; Director explicitly praised this transition and requested global reuse. Canonical source: `remotion-engine/src/episodes/ep004/Shot12ProductionScene.tsx` (RepairView, persistent world), `remotion-engine/src/components/architectural-thinking/EP004Shot12ProductionWorld.mjs` (openingMix), `remotion-engine/ep004-shot12-production.test.mjs` (V2 regression). Reuse the pattern, not hard-coded EP004 coordinates, cue names or assets.
- Verification: EP004 combined regression suite 49/49; shared Worker suite 179/179; Remotion and Factory builds successful; Backend and Worker SUCCESS at approved source; real readiness 2613 frames, 10 cues, 20 event anchors, blockers=[]; actual Director visual acceptance and authenticated lock confirmed.
- Promotion: top-priority AGENTS.md + Visual Constitution + sequential protocol; pinned reusable recipe. No shared runtime refactor or retroactive source edit in this documentation-only milestone.
- Supersedes: older interpretations that prescribe full-diagram fades as the default for same-world refocus. Does not supersede locked media, security, paid-resource consent, factual accuracy, or intentional distinct story viewpoints. The earlier SHOT12-specific note incorrectly reused AT-VIS-0006 (already assigned to SHOT05); AT-VIS-0018 is the unique canonical ID for this approved pattern.

## AT-VIS-0019 — TOP PRIORITY — Director LOCK: causally animated living architecture (AT-VIS-0019, 2026-11-26)

- Date / decision: 2026-11-26, actual Director-approved MP4, LOCKED. Positive reference, not a fabricated failure incident.
- Scope: global future Architectural Thinking episodes and SHOTs.
- Approved pattern: **Mandatory global visual quality floor for architecture storytelling.** EP004 SHOT14 V1 is a Director-LOCKED reference for visibly living, dynamic architecture. The Director explicitly praised the real rendered video: “Перфектно!!! Много добре! Ей това е раздвижена архитектура! Много ми харесва! Запиши си правилата в това видео!!! Локваме”. Make motion communicate engineering causality, not decoration. Keep a persistent recognizable map with stable component identities and connected ports. Reveal a new dependency geometrically on its actual spoken cue, animate traffic along the causal path, show a changing workload through packet frequency, and show successful responses only after modeled successful completion; blocked traffic waits rather than masquerading as success. Use distinct but coherent phases: inherited live state, earned overview, sequential causal landmarks, real failure propagation and recovery, simultaneous local-versus-system outcomes where the lesson requires them, then a motivated handoff. Keep subtle server activity and traffic alive during readable holds, reduce intensity for reflection, avoid arbitrary object shaking, repeated zoom loops, decorative particles, frozen maps and full-diagram dissolves. Keep labels short and physically anchored; preserve adequate spacing and legibility at the final camera pose. Reuse the SHOT14 motion recipe, not its topology, coordinates, fixed number of events or cue timing. A genuinely quiet narrative moment may remain quiet. AT-VIS-0019 strengthens, never replaces, AT-VIS-0014/0015/0017/0018, exact decoded predecessor continuity, approved Take/cues, factual accuracy, security and Director approval. Do not present schematic counts or topology as verified production measurements. Validate bounded camera progress, correct temporal event order, causal traffic and response gating, local/global contrast where applicable, final geometry and actual motion before rendering; actual MP4 acceptance remains Director-owned.
- Evidence: **Immutable approved reference:** EP004 SHOT14 — The Architecture Paradox, production commit `e1158d874c63205bffb55e4ea6e0e011e667ea75`, render `404832c1-0b7d-4de7-a95b-1971445d9a4d`, 2018 frames / 67.2667 s / 1920×1080 at 30 FPS, 3,842,133 bytes. Authenticated POST `/film/locks/SHOT14` returned HTTP 200; worker reported real selected Take mux PASS, exact locked SHOT13 SHA/decoded-frame preflight PASS, seam PSNR 44.41 dB and 30 distinct opening frames. Original 9 beats and 20 real event anchors verified; `ready=true`, `blockers=[]`. Backend and Worker SUCCESS at the exact source SHA. Canonical code: `remotion-engine/src/episodes/ep004/Shot14ProductionScene.tsx` (ParadoxWorld), `remotion-engine/src/components/architectural-thinking/EP004Shot14ProductionWorld.mjs` (shot14State, flow, phase, routeFor), `remotion-engine/ep004-shot14-production.test.mjs`. See `docs/visual/EP004_SHOT14_ARCHITECTURE_PARADOX_20261126.md` for the reusable recipe and real cue clock.
- Promotion: mandatory top-priority startup, visual constitution and sequential protocol; reuse reference code patterns, not an automatic shared runtime replacement. No edits to locked scene.
- Complements AT-VIS-0014/0015/0017/0018. No relaxation of factual, continuity, security or paid-resource gates.
