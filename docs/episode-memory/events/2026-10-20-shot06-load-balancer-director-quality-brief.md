# EP001 — SHOT 06 / Load Balancer — Director Quality & Story Brief

**Status:** PRE-PRODUCTION BRIEF. Not a script revision, voice approval or visual LOCK.
**Director direction:** 2026-10-20. Match or exceed the quality of the final SHOT 05 API Gateway. Make the mechanism intuitively understandable, visually alive, coherent and technically realistic. Use zero decorative microcopy.

## Continuity and the question that drives the story

Carry the **same canonical green Login Request** from the LOCKED SHOT 05. It reaches the incoming edge of the original Load Balancer node and stops. The camera moves into the same Living Architecture Map node without a cut to a synthetic explainer card. The immediate visual question is: **"There are multiple running copies of the login service. Which one receives this request, and why?"**

Make the viewer first see three candidate service instances, then understand the selection mechanism before technical terms appear. The packet is held outside the target while the reason for the choice is explained. Do not show authentication or a password verdict: that is the Auth Service's responsibility in SHOT 07.

## Story design — one coherent system with real failure examples

1. **Arrival / establish the choice:** Show one ingress into Load Balancer and three available destinations, representing *separate running instances of the Auth Service*. Their health/load state is visible without reading footnotes. Never imply the user interacts directly with each destination. Camera frames the fork so a viewer understands it at a glance.
2. **Traffic Distribution / Route Mode:** Demonstrate a concrete configured strategy on a small batch of *diagnostic* requests: one request goes to an eligible instance, the next goes to another. Use discrete, smooth paths; do not claim every load balancer uses round robin or that it always knows instantaneous free capacity. The real green request remains held until the actual chosen target is clear.
3. **Hash Key, only when it helps the existing narration:** Show two related diagnostic requests selecting the same configured destination from a stable key, compared with an unrelated key potentially selecting a different destination. Hash routing depends on the actual configured algorithm and membership; do not suggest it proves authentication, saves session state, or gives absolute stickiness during topology changes.
4. **Health Checks / Timeout:** Show a realistic diagnostic case: instance C fails a configured health check or times out, changes from candidate to unavailable, and disappears from eligible egress paths. Distinguish probe-based health from a real request timeout and do not imply instant infallible failure detection. Keep the canonical green request healthy and separate from the failed example.
5. **Target Choice / Instance / Zone:** Show exactly which eligible Auth Service instance is chosen and its zone. Emphasize causal sequence **health eligibility → routing decision → selected instance**, then animate the single green request down one route. Label only essential concepts: Healthy, Timeout, Instance, Zone, and the selected destination. Avoid generic error response codes unless justified by the specific system model.
6. **End / Auth Service handoff:** Close the local view with a continuous, justified camera motion to the original wider architecture. Follow the original green request to the chosen Auth Service boundary. The next question becomes: *"Now that the request has reached the authentication service, can its credentials be trusted?"* Do not display "successfully logged in" or fabricate HTTP 200.

## Visual system and readability

- Use the same 1920×1080 Remotion Living Architecture Map, established node positions and premium indigo/blue-purple Load Balancer identity. The LB should read as **one ingress → several eligible egress branches → one chosen target**, not a generic box.
- Make health and target selection legible by **state, geometry, glow, movement and controlled camera focus**, rather than cluttering the frame with captions. Do not overload a frame with all paths and all counters at once.
- Build and preserve persistent module navigation when needed. Smoothly move highlighting and only swap the focused central example. Avoid mounting/reintroducing all static UI on each subsection.
- Treat timeline pacing as essential. Introduce one new visual fact at a time. Hold after an important decision so the audience can understand it; do not cram multiple diagnostic scenarios into one shot.
- **No tiny disclaimers, "LIVE EXAMPLE" counters, progress metadata, unnecessary subtitles, boilerplate footers or unrequested decorative labels.** Put configuration caveats in the production notes and spoken script when needed.
- Error paths/diagnostics must remain explicitly distinct from the canonical request. Exactly one canonical green packet persists through the architecture.
- Strong authored motion and visual causality, no template infographic. No jumps, disappearing navigation, cut-off cards or ungrounded cinematic effects.
- Every moment must answer at least one of: *where is the request, what changed, why did it change, what happens next?*

## Production constraints and approval gates

Follow the authoritative currently LOCKED script/approved narration and semantic anchors for SHOT 06. The existing conceptual sequence includes Traffic Distribution, Route Mode, Hash Key, Health Checks / Healthy / Timeout, Target Choice / Instance / Zone. This document is a director brief, **not permission to rewrite existing locked words**. Proposed expansions or pacing shifts require Director approval before voice generation or changes.

Before asking for Director LOCK: verify continuity with SHOT 05, inspect a representative frame at every beat, run automated technical and post-render QA, preserve any previously approved audio, and supply an actual ready MP4 for visual review. The Director, not the agents, makes the final LOCK decision.

**Quality benchmark:** EP001 SHOT 05 final Director LOCK, render ID `f74baee9-7389-4d42-b03c-e41b63b3817a`.
