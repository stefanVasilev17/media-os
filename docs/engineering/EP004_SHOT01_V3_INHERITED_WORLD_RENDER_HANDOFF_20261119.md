# EP004 SHOT01 V3 — Inherited Living Architecture World / Next-Render Handoff

**Date:** 2026-11-19  
**Episode:** EP004 — *Why Microsoft 365 Went Down — And Why Failover Made It Worse*  
**Shot:** SHOT01 — *An Ordinary Workday Stops*  
**Status:** Implemented V3 source candidate / native Remotion build + frame QA + authenticated voice readiness still required / **NOT DIRECTOR LOCKED**.  
**Original approved episode source SHA-256:** `a47b5d2af200014828089bcfb0812017970a8ecfe623cefc67456359af4fe365`.  
**Branch:** `feat/ep004-shot01-v3-inherited-world-20261119`, based on production lineage `feat/ep003-owner-b-centered-and-header-safe-20261116`, NOT the diverged historical `main`.

## 1. Director's architectural decision

**Existing Architectural Thinking world + new Microsoft 365 scenario. Never draw a separate EP004 UI world.** Previous EP004 visual V1 and V2 video candidates were explicitly rejected. V3 must never use their synthetic Python/Pillow or Chromium frame art, layout, screenshot, pseudo-Remotion reproduction or video.

Canonical actual-source inheritance:
- `ATBackground`, `ATControlledRealismLayer`, `ATCameraRig`, `ATPrimaryNode`, `ATBackendNode` directly imported from the existing `ATArchitecturePrimitives.tsx` and `ATVisualPrimitives.tsx`.
- EP002 `SHOT02_NODES` immutable centers and sizes from `Shot02PremiumLayout.ts`. **Factory scene isolation forbids cross-episode imports**; V3 holds the exact reviewed EP002 coordinate snapshot inside `EP004V3InheritedWorld.mjs`, and a native Node test compares each coordinate to the real EP002 source. The V3 TSX does not import EP002 directly.
- The exact EP003 `premiumRouteD`, `premiumRoutePoint`, `PREMIUM_ROUTE_STYLE` implementation from `ep003-premium-routing-v2.mjs` computes BOTH visible rails and request coordinates.
- Existing worker/Root composition ID remains `EP004-SHOT01-ORDINARY-WORKDAY-V1-VISUAL`; `Shot01OrdinaryWorkday.tsx` is now a thin export alias to `Shot01InheritedWorldV3.tsx`. No new worker service/composition ID/volume/bucket required.
- EP002/EP003 files are **read-only**; the V3 implementation does not rewrite their approved creative material.

**Semantic adaptation (schematic reconstruction, NOT a claim about Microsoft's physical topology):** reuse EP002's architecture positions but change actual scene content to one Outlook client, gateway, conceptual traffic router, representative mailbox endpoints and subdued other M365 services. Never carry over misleading EP002 "Login", "Auth Service", "User Database" wording into a Microsoft outage illustration.

## 2. Frozen V3 geometry — 1920×1080 at 30fps

| Node | Center x | Top y | Width | Height | Role |
| --- | ---: | ---: | ---: | ---: | --- |
| Outlook client / human anchor | 260 | 190 | 410 | 535 | One human action and visible inbox |
| Gateway boundary | 650 | 410 | 258 | 250 | EP002 native gateway object/port |
| Traffic router | 927 | 410 | 246 | 250 | EP002 native balancer object adapted to conceptual router |
| Mail service endpoints | 1326 | 315 | 350 | 348 | EP002 native service cluster location |
| Other M365 services | 1697 | 368 | 252 | 280 | EP002 native supporting service location, stays subdued |

The real EP002 node positions for Gateway, Balancer, Auth and Database are deliberately preserved in V3, but their **semantic content** is adapted; original EP002 components themselves are not mutated. One human anchor is positioned inside the known left client zone. Layout validation rejects node overlaps and clipped world bounds. Main labels are readable, and node headings and phrases are tested using the existing conservative EP003 `shot10TextWidth` policy.

## 3. Source-of-truth network rails and only one mailbox request

All points are in the **same camera/world coordinate system**. Never transform packet and connector separately. Native `premiumRouteD` and `premiumRoutePoint` are the only route rendering/sampling implementation:

- `mailbox` — visible curved connection from **(457,713)** at the client, around the lower clear corridor, ending at **(650,660)** on the Gateway boundary. One real request at `ep004V3Point(EP004_V3_ROUTES.mailbox, routeProgress)`; the dot cannot detach because the rail uses `ep004V3Path` from the SAME `PremiumRoute` object.
- `gatewayToRouter` — quiet direct connector **(779,535) → (804,535)**.
- `routerToFleet` — quiet curved connector **(1050,523) → (1151,493)**.
- `standby` — muted conceptual choice corridor from **(927,660)** around lower world to **(1571,619)**. At the proper narration cue a *stroke segment* lights up; it is NOT a second independent request packet, and no earlier request teleports to it.

There are no detached dots, no random packet movement and no two simultaneous active mailbox requests. One allowed amber waiting indicator stays at the physical mailbox-gateway boundary. The original mailbox request progresses monotonically, stops at the boundary, and stays waiting. Other services are **not** globally marked failed.

## 4. HEAR → SEE map — exact eight approved anchors

The production schedule comes from **the saved approved ElevenLabs provider alignment**, not from editorial second guesses. V3 preview-only provisional cues are explicitly permitted ONLY inside `previewOnly:true`; production `previewOnly:false` fails closed until the selected Take and all eight real ordered cue frames are validated.

| Source beat | Approved spoken anchor / visual action |
| --- | --- |
| SHOT01_P01_B01 | "On November twelfth, twenty twenty-six, millions of people" — Inbox and familiar human action. The living request is already moving within the first 60 silent frames. |
| SHOT01_P01_B02 | "or send an important reply. For many, Outlook" — Track one cyan packet on the actual curved mailbox rail; it slows and becomes amber at the gateway boundary. |
| SHOT01_P01_B03 | "were affected too, even when their main features" — Keep other M365 symbols muted, NOT red/failed everywhere. |
| SHOT01_P02_B01 | "But behind that familiar error was a much" — Camera gently pulls out to reveal the traffic router and representative gateway endpoints. |
| SHOT01_P02_B02 | "away from trouble. That is normally how a" — Reveal an alternative path only as a route choice; brief conceptual endpoint echo; do not move the blocked request. |
| SHOT01_P02_B03 | "toward the remaining servers helped spread the failure." — Restrained one-system foreshadowing, not multiple flashing error cards. |
| SHOT01_P03_B01 | "The central question is not just why Microsoft" — Hold client left, junction central and alternate corridor quiet at right. |
| SHOT01_P03_B02 | "how can the very mechanism meant to rescue" — Brief light advances partway along choice corridor (drawn stroke, not packet) and stops before the unknown service fleet; camera gently approaches the router. |

The original narration is untouched. No added spoken text, new paid TTS, invented Microsoft topology or false outage metrics.

## 5. Camera, ambient world and seam

Use one persistent `ATCameraRig`. V3 camera is deterministic from real cue-aligned phase state: it begins slightly favoring the client, pulls back to expose the existing routing world, then approaches the choice corridor toward SHOT02. `ATControlledRealismLayer` and the actual node glow breathe based on the **worldFrame**, not a screenshot. The first **60 frames (2 seconds)** contain moving architecture/request without spoken narration.

- SHOT01 production exit is `ep004V3Exit(props)` at exactly `durationInFrames-1`.
- SHOT02 initial state is `ep004V3Shot02Entry(exit)`: same camera x/y/scale, same request x/y, same route progress, same waiting state and the same source SHA, with world time incrementing by **exactly one frame**. No camera reset, no static predecessor photo after frame zero.
- Future SHOT02 must CONSUME this state, rather than independently reinitializing the camera. The SHOT02 composition is not authored as part of this SHOT01 task; the contract is stored for it.

## 6. Implementation inventory

- `remotion-engine/src/components/architectural-thinking/EP004V3InheritedWorld.mjs` — Factory-approved shared world model with frozen EP002-verified geometry and read-only EP003 premium routing, real-source-gated cues, deterministic camera/motion, SHOT02 exit/entry. The original root `ep004-shot01-inherited-world-v3.mjs` is only a compatibility re-export for Node tools/tests.
- `remotion-engine/src/components/architectural-thinking/EP004V3InheritedWorld.d.mts` — state and layout type declarations; the original root declaration re-exports the public types for compatibility.
- `remotion-engine/src/episodes/ep004/Shot01InheritedWorldV3.tsx` — actual Remotion component importing real AT assets, Outlook adaptation, native gateway/router diagrams, service world and visible curves.
- `remotion-engine/src/episodes/ep004/Shot01OrdinaryWorkday.tsx` — integration to existing production composition ID and Root/worker.
- `remotion-engine/ep004-shot01-inherited-world-v3.test.mjs` — 11 contracts: exact source-verified EP002 layout, direct shared-primitives-only Factory imports, original locked SHA, 2001-frame no-detach/no-backwards sampling, moving 2s intro, boundary hold, text fit, no static screenshot, strict production cue and SHOT02 seam.
- Exact pending isolated fixes from PR #321 (correct persisted Slow Natural metadata/provider pause tags, no invented cue timing) and PR #319 (narrow EP004 worker target allowlist, claims off by default) are **copied into this V3 branch without altering approved Takes or Railway**.

## 7. Test evidence and honest limits

**Executed against retrieved source in this chat:** 10/10 V3 contract tests PASS in a custom V8 evaluator; 2001 phase/route samples were evaluated; text-width check initially found clipping and the labels were shortened; original EP002 geometry matched. This is NOT a native Remotion build or screenshot comparison, and is NOT permission to render paid video. Tests are committed for real Node CI as well.

Still to execute on runner with package dependencies and Java 21:
```sh
cd remotion-engine
npm ci
node --test ep004-shot01-inherited-world-v3.test.mjs ep004-shot01-world.test.mjs worker-claim-authorization.test.mjs
npm run typecheck
npm run build
npm run build:factory
cd ../frontend
npm ci
npm run build
cd ../backend
mvn -B -q verify
```

**Before any full MP4:** native Remotion stills at frames 0,1,20,59, each of eight provider-aligned HEAR→SEE starts, and final frame; direct human visual comparison to **ACTUAL Director-LOCKED EP001–EP003 MP4 decoded frames**, not recreated reference screenshots. Check readable content, no nested decorative cards, all labels inside nodes, the one request ON the drawn route, 60 moving intro frames and world density. If visual comparison fails, fix the source; do not run a paid full render.

## 8. Next prompt: exact render execution gate

1. Run the above true CI/native build and visual QA on PR V3. Do not falsely claim CI PASS when the native packages/runner are inaccessible.
2. Only if the Director source-locked real Take is `SLOW_NATURAL` with the persisted canonical delivery identifier `ELEVEN_V4_AUTO_SLOW_NATURAL_PAUSES_V1`, source SHA matches, and all **8/8 real aligned cue frames** exist, proceed to render readiness.
3. Keep P0 exactly three Railway production services and one shared render worker, concurrency 1; guard Postgres capacity and S3 private storage with object SHA/readback, no MP4 as PostgreSQL bytea. No new bucket/service/deployment workaround.
4. Explicit **one bounded render Director CPU consent** required by MediaOS. No paid ElevenLabs regeneration and no automatic retry. Keep `MEDIA_OS_REMOTION_CLAIMS_ENABLED=false` until the appropriate authorized render gate.
5. Render one 1920×1080, 30fps, H.264/AAC shot to existing private S3 via the existing worker with the original Take and 2s audio delay. Verify duration, real provider alignment, visible routed packet, 30 actual moving FPS, no unintended jumps, and protected storage SHA.
6. Deliver MP4 to Director for review. **Only Director may visually LOCK.** Then update `PROJECT_STATE.md` with actual job ID, source commit, Take ID, SHA, frame QA and next SHOT02 entry contract.

**No original EP001–EP003 MP4 was read or copied in this source-build pass; actual visual parity remains unverified.** No native Remotion MP4, deployment, or paid CPU operation was performed during V3 development.

## 9. 2026-11-19 — ACTUAL RAILWAY BUILD ATTEMPT AND FACTORY SOURCE-CORRECTION

The Director authorized **one bounded build/deployment of V3 on the existing worker, not a video render**. The staged change pinned `media-os-render-worker` to `44c27db7492b12b6ff1a9a961f90d055402237f6` and updated the exact pre-deploy source SHA guard atomically. Railway accepted exactly that one-service change; new deployment `a7a3dcfb-b31f-42c7-8b71-2f35d5b38638` is **FAILED**, and did not become the running worker. No new service, job, voice generation or S3 render was created. The prior worker build `75176054-88de-4d8f-9e79-4fa202feb554` remains SUCCESS and ONLINE.

Real build evidence: all prior Node tests, including the new V3/worker check (**12 PASS / 0 FAIL**) and prior regression batch (**173 PASS / 0 FAIL**) succeeded. At Docker build step **52/56**, `node validate-factory-scenes.mjs` correctly rejected two cross-boundary imports inside `Shot01InheritedWorldV3.tsx`: `../ep002/Shot02PremiumLayout` and `../../../ep004-shot01-inherited-world-v3.mjs`. This is a deliberate Factory security boundary; **do not disable or relax the validator**.

Source fix **committed after the single authorized build failure, NOT DEPLOYED or native-build-verified**: place the complete V3 world model/declarations under `src/components/architectural-thinking/EP004V3InheritedWorld.mjs` and `.d.mts`, import that reviewed shared module from EP004, and remove the forbidden EP002 runtime import. Preserve exact EP002 geometry via the test comparing frozen V3 values to real `Shot02PremiumLayout.ts`; preserve the original EP003 pure premium route implementation read-only from the shared module. Add a native `validateFactorySource` assertion to the test suite. Legacy root V3 model/declaration files remain compatibility re-exports. Verified with source inspection: all V3 direct scene imports now lie in the allowed episode/shared-primitives boundary; all 2001 frame positions still lie on the matching premium route, with exact EP002 geometry and camera/packet seam match. **This is source-only QA; a SECOND native Railway build is REQUIRED to prove compilation**.

**The original single-build consent is exhausted. No automatic retry.** Railway config still points to failed source commit `44c27db...`, while prior successful old code is serving. Before any newly approved second build, update **both** worker source commit pin and preDeployCommand SHA to the *new* PR head in the same production patch, review all staged resources, and leave claims OFF. Run the same Docker build checks followed by real native Remotion still-frame quality evaluation. A successful worker deployment is NOT authorization to generate voice or to render a full MP4.

## 10. 2026-11-19 — SECOND AUTHORIZED BUILD RESULT / TEST-SYNTAX FIX (NOT RE-DEPLOYED)

Director authorized precisely one second existing-worker Railway build/deployment, **no MP4 and no voice request**. Before deployment, an exact source pin and corresponding `preDeployCommand` SHA were staged together, reviewed as a single non-destructive existing-worker patch, then committed. Source pinned was `8b4b2316a751af553b01814222d6fe20e3994724`. New Railway deployment **`11ce95cb-55b1-4b93-abec-ea5a944e576a` FAILED** during Docker step `44/56`, `node --test ep004-shot01-inherited-world-v3.test.mjs worker-claim-authorization.test.mjs`, because the new Factory-path test contained **an invalid doubly-escaped JavaScript regex literal** on line 37 (`SyntaxError: Invalid regular expression flags`). This is a real Node parser error in test code; it is not proof of faulty Remotion runtime, blocked TTS or wrong story source. Docker stopped before native Remotion bundling and there was **NO worker activation**.

**Source-only correction, no third build:** Replaced the two malformed Factory-import regex assertions with simple exact `code.includes()` checks in `ep004-shot01-inherited-world-v3.test.mjs`, commit `1b4883aea9c09ea4b0c99f12d889d36fda6720f3` (later documentation-only commits may advance HEAD). Evaluated the corrected test source in isolated V8 with Node imports transformed and a **stub** Factory validator: **11/11 tests PASS with no JavaScript syntax errors**. This is useful syntax/model QA but **is NOT native `node --test`, nor a genuine Factory validator run or TypeScript/Remotion build**. The previous first build did execute the real Factory validator and detected cross-episode imports, which remain fixed in current V3 source.

**Operational safety:** The existing old shared-worker deployment `75176054-88de-4d8f-9e79-4fa202feb554`, source `e20727f74e3db27ff5954121826ee0049605b21b`, remains SUCCESS and the three production services remain ONLINE. The configured worker's source SHA / pre-deploy guard are still pinned to the **failed second-build commit** `8b4b231...`; don't confuse config source pin with active running deployment. No automatic retry, CPU render, new paid TTS, worker-claims enabling, database mutation or S3 MP4 write. **The second-build consent is exhausted.** Next possible build requires a fresh explicit Director authorization, exact new PR-head source pin and guard updated atomically, and a one-worker patch review.

**Render decision:** EP004 SHOT01 V3 remains **NOT NATIVE-BUILD VERIFIED, NOT RENDERED, NOT DIRECTOR-LOCKED**. After a future native build, inspect real Remotion stills against locked EP001–EP003 frames before requesting separate Director consent for one bounded MP4 render.
