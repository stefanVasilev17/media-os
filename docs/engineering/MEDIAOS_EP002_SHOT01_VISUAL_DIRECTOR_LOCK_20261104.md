# EP002 SHOT01 — Director Visual LOCK

**Recorded:** 2026-11-04 (Europe/Sofia)
**Director decision:** `харесва ми. LOCKED!` following the final TimeRail overlap correction.
**Scope:** **Visual composition and choreography of EP002 SHOT01 only**. This approval is a Director statement about the preview as experienced, not a new backend response or an independent frame-by-frame MP4 inspection by the agent.

## Approved visual baseline

- Maintain the approved EP001 Living Architecture visual continuity and unified world: reused architecture atmosphere, Phone foreground, Auth Service, controlled camera focus and background nodes.
- Preserve the v3 readability improvements: Email / Password labels and input borders/contents; enlarged Login button and more visible animated loader; loading-state label **`Logging in ...`**.
- Preserve the removal of two unwanted explanatory captions: `SHALLOW HEALTH DOES NOT GUARANTEE LOGIN COMPLETION` and `ILLUSTRATIVE SHALLOW HEALTH PROBES`. The small `Liveness: PASS` and `Readiness: PASS` statuses remain, as illustrative shallow health, not a claim of end-to-end login completion.
- Preserve the refined contrast hierarchy among Phone, Auth, secondary nodes and connections; do not brighten the whole world at the expense of depth.
- Preserve the lower-right **TimeRail safe area**, avoiding the enlarged Phone and the health panel. Source geometry: `TIME_RAIL_SAFE_AREA = {left:1040, top:885, width:440, height:82}` in the 1920×1080 design. This fixes the Director-reported collision.
- Preserve the voice-derived five beat start frames and existing CameraRig choreography: tap Login, time passes, Auth shallow healthy, still waiting, rewind 09:00.
- The selected Take 2 audio, 32.640-second timing contract, and existing saved ElevenLabs cue timestamps remain unchanged by the visual LOCK.

## Source provenance / protected boundary

- **Locked visual source:** `remotion-engine/src/episodes/ep002/Shot01LoginWaiting.tsx`, `remotion-engine/src/episodes/ep002/Shot01ReadablePhone.tsx`.
- Last visual change: [PR #162](https://github.com/stefanVasilev17/media-os/pull/162), merged into main as commit `10c294f5ba1593646a923bcbc1e49612498923d6`; worker was deployed from its exact tested pre-documentation source commit `d65a7884e0cf9bfffb884f0cc731750edf79e53f`, deployment `4dd008ff-58ac-4590-afeb-1a2038f94a8f` SUCCESS / ONLINE.
- Previous visual passes: [PR #159](https://github.com/stefanVasilev17/media-os/pull/159) (EP001 continuity), [PR #161](https://github.com/stefanVasilev17/media-os/pull/161) (Phone/form/button/contrast readability).
- Existing verification for the final visual source: **22/22 Node tests PASS**, Remotion bundle PASS; TypeScript preflight zero new errors with one documented protected EP001 baseline diagnostic. Director acceptance is an additional human creative gate, not a replacement for technical verification.
- Keep **EP001 approved source and EP002 original Script v4.0 / Visual Pass v1.0 archival content untouched**.

## LOCK rules for the next agent

1. Do **not** modify these two SHOT01 visual files, move TimeRail, change existing camera moves, or change the five cue bindings while implementing SHOT02 or other SHOTs unless the Director explicitly requests a new SHOT01 revision. SHOT02 should use the same visual system and should connect to the approved 09:00 transition.
2. No automatic new MP4 render, paid voice synthesis, forced alignment or unapproved infrastructure. Keep previous versions and render lineage.
3. The Director previously noted **accent/dialect mismatch** between EP001 and EP002 narration. That voice issue is **not** addressed by this visual LOCK. Take 2 remains the working selected audio, with its actual delivery/playback previously reviewed. Narrator parity requires a separate A/B comparison and explicit approval before a paid re-generation; do not declare the voice/whole episode fully audio-locked.
4. This LOCK is not final approval of the entire EP002 episode. It permits moving forward to the next planned work item while preserving SHOT01.

## NEXT

Continue the locked Roadmap v1 in MediaOS, using the successful SHOT01 pipeline and reusable EP001 assets. Confirm the next planned SHOT and its voice/HEAR→SEE dependencies from the approved source; build only that SHOT. Keep the in-app automated AI Director Revision Loop (Stage 4) as a separately planned product capability unless it is independently verified. No silent regeneration of SHOT01.
