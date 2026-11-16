# EP003 — Director correction: Owner B rail and Independent Primary Owners

**Date:** 2026-11-16. **Status:** new candidate revisions. Do not claim Director LOCK before review.

## Exact Director feedback

The line from **OWNER B** to **REPLICA B** is slightly off center, unlike OWNER A. It must leave exactly below the horizontal center of OWNER B and arrive centered on the top of Replica B. The heading **INDEPENDENT PRIMARY OWNERS** touches the Auth Service container on its left edge and must be moved right. Apply the same correction everywhere those elements appear, **not only SHOT10**.

## Verified source occurrences

Current active film sources containing both artifacts are:
- **SHOT08 V3** — `Shot08WhenCopiesAreNotEnoughV3.tsx`
- **SHOT09 V2** — `Shot09WhenPrimaryDisappearsV2.tsx`
- **SHOT10 V1** — inherits `Shot09FinalWorldForShot10V1.tsx`.

SHOT03–07 show earlier Primary/Replica architecture, but do not contain the Owner A/B pair or `INDEPENDENT PRIMARY OWNERS` text. Their previously recorded broader legacy Bezier issues are tracked separately. The approved master sources and all old saved render files remain untouched.

## Exact replacement geometry, source of truth

New versioned primitive: `remotion-engine/ep003-premium-routing-v2.mjs`. Original `ep003-premium-routing.mjs` remains frozen for reproducing approved V3/V2 renders.

**OWNER B rail** starts exactly at **(1771,667)**, aligned with `SHARD_NODES` Owner B x=1771 and below the label baseline y=644. Its **first segment is vertical**, `(1771,667) → (1771,681)`. It runs via a tight upper-right external corridor x=1842, then left in the safe gap at y=839, and enters **Replica B's top center at (1690,852)** (Replica B card x=1578,width=225,top=852, center x=1690.5). No line passes through Replica A card y=709–825 or over any replica text. Request dots are sampled from the *same actual visible route* with `premiumRoutePoint`; no independent motion path.

**Owner heading:** two clean rows `INDEPENDENT` and `PRIMARY OWNERS`, 22px each, centered at **x=1744**, baselines **y=316 and y=343**. Font-size is preserved at a legible level. `shot10TextWidth` verifies both lines remain between x=1585 and x=1885, giving a clear margin from Auth Service and frame edges. Content remains exactly the same; only fitting and safe position change.

**New candidates:** SHOT08 V4, SHOT09 V3 and SHOT10 V2. Dedicated new compositions and render keys. The SHOT10 continuation world forks the newly corrected SHOT09 rather than accidentally reusing the old fork.

## Non-negotiable render chain

SHOT08 V4 takes the actual saved Director-LOCKED SHOT07 V3 last decoded frame with PSNR≥27dB. SHOT09 V3 uses the **actual saved SHOT08 V4 candidate ID+SHA256+pin**, then SHOT10 V2 uses the **actual saved SHOT09 V3 candidate ID+SHA256+pin**. Do not render a later revision against historical predecessor. Each updated review MP4 must pass first-frame decoded seam, at least 18/23 early moving steps, original Slow Natural selected audio with unchanged real voice anchors, all rendered card-safe layouts and strict source SHA checks. No paid TTS. Do not change the official locked 9-shot master or SHOT10 V1 review output until the Director reviews the corrected candidates.

## Regression tests

`ep003-premium-routing-v2.test.mjs` checks exact Owner B start, vertical first segment, Replica B top-center entry, protected safe whitespace, request sampling and use of the same module from all new scenes. Per-shot isolated worker tests gate real predecessor + original voice + P0 QA. MediaOS has strict saved-MP4-only candidate routes, does not serve historical fallback as new versions.

## Director sign-off

**Pending.** Visual Director acceptance is required separately from technical QA. Once approved, pin new render IDs and SHAs, update official master by source stream-copy and recheck all decoded seams, without silent changes to older independent Primary/Replica scenes.
