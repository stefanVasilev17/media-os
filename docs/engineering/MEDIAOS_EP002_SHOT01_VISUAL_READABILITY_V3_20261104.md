# EP002 SHOT01 — Director Visual Readability Pass v3

**Date:** 2026-11-04 · **Status:** Implemented source candidate; real MP4 Director visual QA pending.
**Director feedback:** v2 successfully matches EP001 style. Remove excess explanations, amplify Email/Password and their inputs, make login button and loading affordance clear, replace "Waiting" with "Logging in ...", lift image contrast without destroying depth.

## Scope

- `remotion-engine/src/episodes/ep002/Shot01LoginWaiting.tsx`: remove the precise overlays `ILLUSTRATIVE SHALLOW HEALTH PROBES` and `SHALLOW HEALTH DOES NOT GUARANTEE LOGIN COMPLETION`, keep concise `Liveness: PASS` / `Readiness: PASS` status evidence. Increase Phone/Auth/background-path context contrast while maintaining dim Gateway/Load Balancer and semantic depth. Preserve five existing beatStartFrames, camera/reveal choreography, Time Rail and 09:00 rewind.
- `remotion-engine/src/episodes/ep002/Shot01ReadablePhone.tsx`: **EP002-only** readable variant of the original approved EP001 Phone, retaining its metal/glass construction, status bar, login form and material treatment. Labels changed to 23px, field height to 73px with stronger outlines, legible field text/icons, button height to 88px, loader 35px/4px stroke, working button label exactly `Logging in ...`. The Phone is modestly enlarged, with Y adjustment to keep the lower button visible.
- The canonical `ATPhone` and all EP001 creative files **remain unmodified**. Use a scoped EP002 variant rather than a second floating overlay or CSS selector hacks that could cause misaligned duplicate fields or cover the original login button.
- `remotion-engine/shot01-readability.test.mjs` asserts the specific Director corrections, preserved Health status evidence and five-cue binding. Railway worker build runs the test alongside existing worker credential and lease tests, Node syntax, TypeScript baseline preflight and Remotion bundle.

## Production boundaries

No changes to selected EP002 Take 2, its 32.640s measured duration and five real speech cues, the Director-locked EP002 Script v4.0 / Visual Pass v1.0, Remotion backend render contract or EP001 approved assets. No automatic ElevenLabs generation, forced alignment or paid render. Only the existing Railway Remotion worker service is rebuilt. Existing MediaOS Backend continues to serve `Create new voice-synced preview` with a Director-confirmed unique renderRequestId, keeping prior successful MP4s as separate render lineage.

## Director acceptance

After a successful checked worker deployment, open EP002 → SHOT01 → Remotion Scene Blueprint and explicitly request **one** new voice-synced v3 preview. Assess visual read distance at MediaOS 1280×720 preview playback: Email/Password labels and outlines, button and 35px loader, `Logging in ...` text, balanced Phone/Auth contrast, no duplicate overlays or clipping, continuity with v2 and the selected voice. Do not claim final Director approval until playback is reviewed.

Accent/dialect parity with EP001 remains a separate comparison; no new TTS call was approved in this pass.
