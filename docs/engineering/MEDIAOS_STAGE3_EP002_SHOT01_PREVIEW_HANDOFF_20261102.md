# MediaOS Stage 3 — EP002 SHOT01 Preview Implementation Handoff

**Date:** 2026-11-02 (Europe/Sofia)
**Roadmap:** [Director-LOCKED MediaOS Roadmap v1](MEDIAOS_ROADMAP_V1_DIRECTOR_LOCK_20261102.md)
**Status:** Implementation merged and **both backend and Remotion Worker deployed successfully**. **A real selected-voice MP4 render and Director creative review remain unverified.** Do not claim Stage 3 acceptance or automatically advance to Stage 4 until that evidence exists.

## Verified implementation and release

- [PR #140](https://github.com/stefanVasilev17/media-os/pull/140) merged feature code as `54533536614607b281e1f30b3c8453a43965283e`.
- [PR #141](https://github.com/stefanVasilev17/media-os/pull/141) fixed a backend Java return-type compile issue, merged `9219e8e388458ad8421a2268c17b4f260139a526`.
- Production backend deployment `c9c88cb1-2e8f-4428-8446-7141ae85181d`, commit `9219e8e388458ad8421a2268c17b4f260139a526`: **SUCCESS**, 271 Java tests with **0 failures / 0 errors / 37 skipped**, frontend Vite + TypeScript build PASS, Spring Boot started normally.
- Production Remotion Worker deployment `c3ad08bf-4431-4e43-b5b8-aa9583e20a10`, commit `54533536614607b281e1f30b3c8453a43965283e`: **SUCCESS**. Independent Remotion TypeScript preflight passed with **zero new TypeScript errors**; one pre-existing EP001 locked diagnostic remains an allowed documented baseline. Remotion bundle built successfully.
- Both Railway services Online / SUCCESS, no service warning or critical issues in final check.
- No voice generation, no new paid ElevenLabs request, no original EP001 source modification, no change to original approved EP002 script or visual-pass source, no new Director final approval.

## Actual implemented SHOT01 visual

- `remotion-engine/src/episodes/ep002/Shot01LoginWaiting.tsx`: runnable 1920×1080, 30fps storyboard with Phone/Login press, persistent spinner, provisional time-progress rail, Auth shallow health-probe status, focus return to unresolved Phone, 09:00 rewind marker.
- `remotion-engine/src/Root.tsx`: registers `EP002-SHOT01-DRAFT`, duration measured voice derived at runtime; falls back to 1200 frames only for standalone development with no chosen voice. A full Director render always requires measured duration.
- **Editorial timing caveat:** distribution of five visual actions is provisional storyboard timing, based on normalized episode progress. **Not** confirmed word/phoneme-aligned beats. UI explicitly requests acknowledgement of this limitation.
- Visual rendering preserves dark software-architecture design language, but custom new shot geometry has not been finally approved for visual match against EP001 or final Director quality.

## Safe Director-triggered preview pipeline

1. Open `https://media-os-backend-production.up.railway.app/#/library/EP002` → SHOT01 → **Remotion Scene Blueprint**.
2. Use existing preferred voice take for the *current* saved narration revision; measured audio duration must be present. If missing, show honest blocker — do **not** generate or spend ElevenLabs automatically.
3. Click **Create storyboard preview** and explicitly acknowledge provisional editorial cue timing. The UI sends the current scene `contractId`, not arbitrary code or audio URL.
4. Director-only POST `/api/v1/creative/episodes/EP002/shots/SHOT01/render-preview` verifies the Stage 1/2 contract, chosen current-revision take, audio duration, dependency digest and expected contract ID, then queues the already registered `EP002-SHOT01-DRAFT` profile via the existing Remotion render service.
5. `RemotionCpuWorkerController` limits the worker audio GET `/api/v1/remotion/renders/worker/{renderId}/ep002-selected-voice` to a keyed, active worker-owned `EP002-SHOT01-DRAFT` render, latest chosen take and latest script revision. It is not a public file URL.
6. Worker renders the visual, fetches this voice through existing worker-authenticated transport, and muxes it into MP4 using FFmpeg, then uploads through the established render job protocol. It never makes a paid ElevenLabs generation call.
7. Frontend periodically refreshes GET `/api/v1/creative/episodes/EP002/shots/SHOT01/render-preview`; shows live render status and playable video on success, keyed to *current* script/take dependency.
8. Stage 3 writes a scoped row to `episode_shot_render_lineage`, and the Stage 1 panel now joins the authoritative `remotion_render` row for live progress/status. Legacy `render_status` in lineage is not treated as the runtime state. `remotion_commit_sha=WORKER_SOURCE_UNVERIFIED` is an explicit placeholder; a worker build provenance link is a future refinement.
9. A script/voice change invalidates the current dependency match; stale voice cannot be silently muxed into a new visual. Prior audio and previews stay preserved.

## Outstanding verification before declaring Stage 3 DONE

- Director must open SHOT01 and confirm there is an explicitly selected current script version voice take with measurable duration.
- Director must click **Create storyboard preview** once, review the result and report real render success; inspect audio presence and synchronization, frame dimensions/duration, shallow health-check semantics, visual accuracy, and transition quality.
- If worker returns a failure, inspect the exact render error and CPU logs. Do not claim full end-to-end success based only on compile/build/deploy.
- Check that the preview and status refresh correctly after switching the preferred voice or editing narration.
- If cue timings are poor, adjust after measurement/Director feedback rather than label guessed editorial times as exact.

## Next work

Finish the Director end-to-end SHOT01 render/QA gate. Then proceed to **Stage 4 — AI Director Revision Loop**: inline feedback → scoped change to Remotion code in GitHub → build/test/redeploy only relevant scene → new preview → Director review, with safe history and rollback. Stage 5 later formalizes revision and rollback UX; Stage 6 optimizes incremental rendering across shots.
