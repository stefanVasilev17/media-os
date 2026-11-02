# MediaOS — Stage 2 Remotion Scene Contract: Production Handoff

**Date:** 2026-11-02 (Europe/Sofia)
**Roadmap authority:** [Director-LOCKED Roadmap v1](MEDIAOS_ROADMAP_V1_DIRECTOR_LOCK_20261102.md)
**Status:** Implemented and deployed for **EP002 SHOT01**, browser-level Director acceptance remains to be recorded. Stage 3 is **not** complete.

## Evidence and release

- Main implementation: [PR #137](https://github.com/stefanVasilev17/media-os/pull/137), merged commit `b1460a0a0063a2262b742da371238ab8250ae5d2`.
- Compile correction: [PR #138](https://github.com/stefanVasilev17/media-os/pull/138), merged commit `ce6c7eac85e1be04ff41032e5036ffb65ef9e76d`. First build failed because of a duplicated Java local variable; correction succeeded.
- Railway production backend deployment **`416f3d1b-19aa-4d23-a638-4be53db53f9d` SUCCESS**, service online, Render Worker separate service SUCCESS. Version `ce6c7eac85e1be04ff41032e5036ffb65ef9e76d`.
- Frontend TypeScript/Vite production compilation PASS; Java Maven **269 tests, 0 failures, 0 errors, 37 skipped**, BUILD SUCCESS.
- No database migration, paid ElevenLabs operation, created video render, automatic generated code execution or new production creative approval in this release.
- Remotion engine Zod schema was committed in source; this backend Railway build does **not** independently run the Remotion engine TypeScript typecheck. Validate it in Stage 3 before worker execution.

## Implemented API / UI

Authenticated, **read-only** `GET /api/v1/creative/episodes/EP002/shots/SHOT01/remotion-scene-contract`.

Open `https://media-os-backend-production.up.railway.app/#/library/EP002`, expand SHOT01 then **Remotion Scene Blueprint** underneath Unified Production Data. It automatically refreshes after saved script changes or preferred take changes. This view is not a video player or active composition.

Files:
- `backend/src/main/java/com/architecturalthinking/mediaos/workflow/Ep002RemotionSceneContractService.java`: source-bound builder and strict validation.
- `backend/src/main/java/com/architecturalthinking/mediaos/workflow/Ep002RemotionSceneContractController.java`: read-only endpoint, existing Director security.
- `remotion-engine/src/contracts/remotionSceneContract.ts`: strict Zod schema for consumer validation in the next stage.
- `frontend/src/api/ep002RemotionSceneContractApi.ts`: UI contract types.
- `frontend/src/components/Ep002RemotionSceneContractPanel.tsx`: inspect camera, operations, asset inventory and blockers.
- `backend/src/test/java/com/architecturalthinking/mediaos/workflow/Ep002RemotionSceneContractServiceTest.java`: five source beats, boundaries, frame calculation, stale fingerprints, review blockers.

## Safe typed plan / provenance

`REMOTION_SCENE_V1`: **1920×1080, 30 FPS, REC709**, intended unregistered composition `EP002-SHOT01-DRAFT`. Frames use `ceil(measured_voice_seconds × 30)` only when measured voice exists. **No render is queued**. All individual beat `startFrame/endFrame` are `null` because the approved source provides editorial cues but no measured word/phoneme alignment.

Five Director-approved SHOT01 beat directions remain source-exact in the blueprint:
1. Close Phone; press Login; spinner stays unresolved.
2. Hold Phone; show proposed TimeRail; **no invented real duration**.
3. Focus Auth; small shallow-probe green pulse; show `Liveness: PASS`, `Readiness: PASS` only in this illustrative shallow-probe configuration.
4. Rack focus back to Phone; Auth remains faintly healthy.
5. Retract TimeRail to `09:00` marker; prepare transition/rewind to SHOT02.

Operations, camera intents and asset keys are allowlisted enums, not arbitrary code. Asset inventory distinguishes 5 referenced existing concepts (Phone/Login, Spinner, Auth, CameraRig, DimLayer) and 2 **new proposals** (TimeRail, Rewind overlay). **Existence in actual Remotion reusable component inventory is UNVERIFIED** until Stage 3 asset audit.

Blocked when no explicitly chosen current-revision take, audio duration unavailable, or edited text requires cue review. Rejects invalid episode/SHOT/source SHA, stale narration hash, selected take revision mismatch, noncanonical voice URL and render fingerprint mismatch.

**Readiness means only ready for controlled code generation**, not permission to execute arbitrary code or publish production video.

## Exact next actions — Stage 3

- Verify the real Remotion asset/component inventory and the `remotion-engine` schema with its own TypeScript typecheck.
- Map this source-safe SHOT01 blueprint to real React/Remotion implementations; create approved missing primitives if needed, in scoped GitHub branches.
- Resolve actual cue alignment or require explicit Director choices for visual beat timing; never fabricate timestamps.
- Wire selected voice to a real registered Remotion composition with reproducible render props, preview audio/video, build/test/QA and no unexpected paid operations.
- Then Stage 4 adds Director feedback → scoped Remotion revision → selective re-render → new preview on the same SHOT page, with the original creative sources untouched.

## Required safeguards

Continue allowing unlimited creative Save/Edit without LOCK/UNLOCK. Protect EP001. Preserve EP002 Script v4.0 and separately approved new Visual Pass v1.0. Do not rebuild voice or charge ElevenLabs during stage setup. Production code changes are reviewed/tested and reversible. Stage 2 only scoped to **SHOT01**; SHOT02–11 have approved visual plans but not the typed Stage 2 blueprint yet.
