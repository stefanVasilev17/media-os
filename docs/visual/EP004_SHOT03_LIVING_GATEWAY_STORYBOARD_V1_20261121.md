# EP004 SHOT03 — Living Two-Gateway Architecture / EXECUTOR VISUAL FOUNDATION V1

**Status:** Coded STORYBOARD, **not** Director visual LOCK and **not** a voice-aligned production candidate. The Director requested more natural movement without visual clutter. No new paid render or ElevenLabs call is part of this foundation.

## Immutable source contract

- Original Director-LOCKED narration: `docs/episode-memory/plans/2026-11-18-ep004-script-v1-director-locked.md`, original locked source branch `feat/ep004-director-locked-production-foundation-20261118`, **SHOT03 — TWO GATEWAY SYSTEMS, ONE SHARED PRESSURE**. Keep exact three paragraphs byte-for-byte.
- Original Director-LOCKED visual story: `docs/visual/EP004_VISUAL_STORYTELLING_V1_DIRECTOR_LOCKED_20261118.md`, SHOT03 P01–P03 and transition into SHOT04. It is a conceptual model, not an alleged Microsoft internal topology.
- Successful SHOT02 H264/AAC Director candidate render **`20758da0-46f9-4973-9ef8-ec93eb437a5a`**, 1920×1080, 30fps, 2124 frames, 70.8s, approved original Take mux verified in real shared worker logs, source SHA commit **`714d7c31affb84793780eee42bc5062387b069a7`**. Director wrote **"Локваме"** after this candidate. This is explicit human visual approval in chat; the runtime DB lock marker, actual MP4 SHA256 and decoded frame-2123 still require authenticated verification. Do not invent them. SHOT03 is pinned to previous last encoded frame **2123**, ongoing world frame **4123** (2000 from V8 SHOT01 +2123). Never change SHOT02 MP4, original selected voice, failover glossary or source.

## What is actually built

`EP004Shot03LivingWorld.mjs` models a **true living architecture map**: persistent Outlook client inherited from SHOT02, dark navy/cyan/mint/violet identity, two visually distinct gateways (upper Primary, lower Alternative), genuine separate mailbox vs Teams destinations and six **explicit, deterministic cubic Bezier routes**. All requests are sampled mathematically on precisely the paths that the viewer sees. Cyan Outlook packets continue via Primary to Exchange Online; violet Teams packets initially cross Alternative to Teams. Later, **new** violet Teams packets follow an explicit diagonal failover connector into Primary, then a separate real route to the **Teams** destination; they never turn into Exchange or teleport from the old route. No fabricated named server counts or routing metrics.

The storyboard movement has four editorial layers: source-world packets continue during the first **60 moving frames**; the camera makes a gentle semantic pan/zoom to reveal the two gateway systems; the Teams traffic visibly switches after a `01:07 UTC` factual marker; then a single embedded primary-gateway workload mix rail changes from cyan to cyan+violet, and the camera approaches the `JULY GATEWAY UPDATE` marker **inside** the existing primary node for SHOT04 handoff. These are concise conceptual transitions, not estimated HEAR→SEE timings. Node indicators remain alive, no random glowing dots, no flashing general cards, no nested card.

**Important boundary:** a `540`-frame / 18-second **storyboard** condenses P01–P03 for visual development. **This is NOT the final SHOT03 duration**; production duration must come from the measured selected SHOT03 Take with a separate 60-frame narration-free visual lead and verified ElevenLabs word/beat cues. `Shot03GeneratedScene` currently accepts **previewOnly=true** and has no backend paid render endpoint. The shared worker still targets the previously approved SHOT02 composition; merely building this new scene does not authorize a paid SHOT03 render. Do not cite or render the storyboard as final voice-aligned content.

## Required completion gates before SHOT03 Director MP4 render

1. Read-only approved SHOT03 Take + current revision/narration source SHA + real verified provider alignment; **no paid TTS without Director approval**.
2. Authenticated S3-backed SHOT02 MP4 metadata and **actual MP4 SHA-256**; decode previous **encoded final frame index 2123**. Create first-frame continuity from the actual frame, including camera, nodes, labels, routes, and active particles. Frame zero may use authenticated prior pixel data; never cover frames 1–55 with a static full-frame image.
3. Match SHOT03 P01/P02/P03 and 01:07 UTC/July transitions to actual provider word timings. Retime editorial storyboard phases; no fabricated production cues. Preserve technical accuracy and the explicit conceptual-model qualifier.
4. Native worker factory AST security, TypeScript preflight, first 30 frames movement, geometric path location/anti-teleport checks, non-overlap text fit, complete H264/AAC voice mux, full cumulative SHOT01+02+03 **WIP** MP4 QA. Do **not** touch the protected locked SHOT01/SHOT02 media.
5. Only after **explicit Director bounded CPU approval**, render the full selected Take on the existing single-concurrency worker and private S3. Present real candidate + full episode WIP for Director visual review; never automatically LOCK.

## Source and native tests

- Living world and six routes: `remotion-engine/src/components/architectural-thinking/EP004Shot03LivingWorld.mjs` plus typed declarations.
- Composition: `remotion-engine/src/episodes/ep004/Shot03LivingArchitectureV1.tsx`, preview-only `Shot03GeneratedScene.tsx` and non-production Remotion Root ID `EP004-SHOT03-LIVING-WORLD-STORYBOARD-V1`.
- Native route/movement/no-fake-voice test: `remotion-engine/ep004-shot03-living-world.test.mjs`, included in the existing `Dockerfile.remotion-worker`.
- The actual tested and deployed statuses are recorded only after real native Railway evidence. Code existence, source tests and human approval are distinct from authentic cumulative-lock DB and decoded-video verification.
