# Architectural Thinking — Director P0 — Technical Terms and Definitions Only for Informational Cards

**Director instruction, 2026-11-14:** EP003 SHOT02 architecture graphics are good, but recurring information containers have low educational value and distract from the map. **Only create a floating informational container when the locked narrator introduces a technical term AND an accurate short explanation of its meaning.** This applies to ALL future SHOTs and EPs, not only EP003. Existing LOCKED SHOT01 V2 must remain immutable.

## Non-negotiable editorial contract

1. **A floating callout is earned, not decorative.** The only valid reason for a separate overlay information container is to teach a specific technical expression that is genuinely spoken and explained in the approved narration. Display **TERM + ONE concise, correct DEFINITION** (not a generic takeaway, repeated narration, promotional hook or superficial metric). If there is no such term and explanation in the narrator script, show NO floating card.
2. **Architecture tells the story itself.** Successful/rejected requests, status, capacity, relative counts, services, active paths, and operational causality are illustrated in the same existing Living Architecture World through node/path/particle animation; do not repeat them in separate text boxes. Essential permanent names inside nodes, phone UI, existing architectural headers and accurately integrated architecture measurements are NOT new floating explanation cards and remain permitted.
3. **Audio-grounded.** Use the true selected Director-LOCKED ElevenLabs Take's verified alignment, with a first-occurrence anchor for the term and sufficient surrounding narration explaining it. No fabricated cue seconds and no TTS reruns. A word appearing in narration without useful explanation is insufficient to justify a card.
4. **Readability still mandatory.** A glossary card requires real uninterrupted reading time at the actual audio cue (initial >=5.5s total on screen, extended for word count, natural ~18-frame fade-in/20-frame fade-out, long fully opaque center). A smaller time window means OMIT the card; never flash it. Prefer one term on screen at a time, allow empty periods rather than cycling captions, and cap overly persistent cards when the narration has progressed.
5. **P0 world + collision invariants.** Do not overlay the Phone, Gateway, Auth, DB, visible request path, packets, architectural connection ports or any existing container; no text overflow or tiny type. All particles move along original visible paths, modern EP001/EP002 consistent style, deterministic frame-based smooth camera and visual state, and exact former SHOT final actual encoded frame → next SHOT first frame. Do not modify prior Director-LOCKED MP4/voices.
6. **Fail-closed quality:** Source tests verify the selected term strings really have approved spoken explanations, the exact verified alignment anchors, no generic cards, valid overlay duration, content fit, collision checks and preserved world variables. Actual coded MP4 QA and Director human review remain mandatory. A source PR or numerical PSNR does NOT equal Director visual LOCK.

## EP003 SHOT02 Director correction

**V1 already rendered but NOT Director-LOCKED:** MediaOS render `c77410f6-3e9a-4848-aa87-7674d598ad3a`, full 112.77s, real pixel handoff from Director-LOCKED SHOT01 V2. Director explicitly approved the architectural graphics, **not** repetitive overlays. Preserve old V1 as history.

**V2 content-approved direction, still needs human review:** keep V1 Living Architecture World, Phone/Gateway/Balancer/3 Auth/one DB, same camera and request flow, same SHOT01 V2 exact end frame 2513 (render `b6fd7f30-7c78-414b-a88c-387c0ee8c43a`), original SHOT02 Slow Natural Take `c4131401-2b42-4bac-873f-05de50040c99`. Replace nine general callouts with ONLY the following glossary candidates, subject to actual verified narrator cues:
- **THROUGHPUT** — Work completed in a given period.
- **LATENCY** — Time one operation takes to complete.
- **BOTTLENECK** — The component limiting total Login capacity.
- **ADMISSION BUDGET** — A limit on DB work, including permitted retries.

The nine former generic cards (e.g. “ONE ARCHITECTURE”, “INCOMING DEMAND”, “MORE AUTH SERVERS?”, “THE ARCHITECTURAL QUESTION”) are disallowed in V2. Keep meaning in the living diagram and narration. If any approved voice cue cannot provide adequate dwell, OMIT that term card as well. This policy supplements [P0 readable text or omit](AT_DIRECTOR_P0_TEXT_DWELL_OR_OMIT_20261114.md) and [P0 world/motion constitution](AT_DIRECTOR_P0_GLOBAL_VISUAL_MOTION_AND_QA_20261113.md).

**Status contract:** `POLICY_DIRECTOR_APPROVED` is separate from `SHOT02_V2_RENDER_SUCCEEDED` and `SHOT02_V2_DIRECTOR_LOCKED`. Only user Director can issue a final SHOT02 V2 LOCK after watching its actual saved MP4.
