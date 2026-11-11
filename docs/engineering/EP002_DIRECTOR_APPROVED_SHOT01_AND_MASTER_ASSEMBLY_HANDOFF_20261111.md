# EP002 — SHOT01 V2 Director LOCK and Full Eleven-SHOT Master

**Date:** 2026-11-11 (Europe/Sofia)  
**PR:** [#265](https://github.com/stefanVasilev17/media-os/pull/265) — **OPEN/DRAFT, unmerged**.  
**Base:** stacked on [#264](https://github.com/stefanVasilev17/media-os/pull/264), exact initial source SHA `0b1c62c4592f5cffcee9ae92ade9986e42f93530`.  
**LIVE ACCEPTANCE:** **NOT DEPLOYED / NOT RENDERED / NOT FINALLY LOCKED.**

## Director decision and evidence

Director replied **“Одобрен”** to new SHOT01 V2 and asked for **one complete EP002 MP4** combining SHOT01–11. Verified source of the selected SHOT01 recording: `8f46fafd-9613-4375-bce2-ea98854e8b20`, composition `EP002-SHOT01-DRAFT`, **1920×1080, 30 fps, 1172 frames**. Railway Worker 2026-11-11 18:36 UTC logged successful complete; backend served bytes by HTTP 206. Current real voice-aligned five cues confirmed in live read-only logs; Director's chat supplies current visual creative approval. Prior SHOT01 v3 `447f2846-3d1d-4d6c-924c-ea3918520625` remains stored, protected as historical provenance. No approved SHOT02–11 originals or Takes were edited.

## Source implementation staged in PR #265

- `Ep002LockedCutReviewRoom.tsx`: exact new SHOT01 V2 Director pin (original archived), existing exact SHOT02–11 unchanged. <u>Existing Play all is still sequential players, not one exported file.</u>
- `Ep002FullMasterPanel.tsx`: a Director Room preflight for all 11 source IDs, confirmed CPU render button and progress, then actual **single stored MP4 video player**, with final creative LOCK explicitly remaining pending.
- `Ep002DirectorMasterController.java`: Director-only GET `/api/v1/creative/episodes/EP002/master/preflight`, exact immutable UUID/format/frame metadata DB checks, source content-derived digest, read-only existing master, audited POST `/render` with UUID, fingerprint and `confirmPaidCpuRender=true`. Existing matching queued/running/finished master is reused. No generic arbitrary composition POST.
- `Ep002DirectorMasterWorkerMediaController.java`: authenticated scoped Worker GET `/api/v1/remotion/renders/worker/{targetId}/ep002-master-source/{sourceId}` serves only the eleven approved source MP4s to the active source-SHA-matching Director-created master job, never public raw arbitrary IDs.
- `RemotionRenderController.java`: private `EP002-DIRECTOR-MASTER` composition and standard stored MP4 record, progress and Range-capable video endpoint.
- `RemotionCpuWorkerController.java`: only exact explicitly scoped master target claim; worker release SHA and explicit paid consent required; stale master never auto-requeued.
- `GlobalCreationPreflightFilter.java`, `EpisodeFactoryDirectorRoutes.java`: Director role and audited creation plus strictly verified callback continuation.
- `remotion-engine/cpu-worker.mjs`: fetch exact pinned MP4 source bytes via signed scoped Worker auth, no public URLs/voice re-generation, run `inspectLockedMaster` and `assembleLockedMaster`, verify actual result, PUT stored MP4 through existing authorized completion API. Streaming progress uses normal CPU Worker ledger.
- `remotion-engine/ep002-locked-master-assembly.mjs`: FFmpeg stream-copy only with each input H264/AAC+FullHD/30fps+actual frame count and matched codec parameters; all 11 files required, source originals immutable, output cannot overwrite anything, frame count/duration validated.
- `EP002_DIRECTOR_LOCKED_MASTER_INPUTS_20261111.json` and `remotion-engine/ep002-approved-master-manifest.json`: exact eleven IDs in order; **unknown SHOT02–SHOT06 frame counts remain `null` pending actual FFprobe**. No fake durations.
- Node and Java unit tests authored; Worker Dockerfile configured to run syntax and exact-ID guard tests before image build.

## Runtime gates: NOT COMPLETE

**Do not report EP002 master as created.** Connected GitHub readback confirmed source files and static eleven-ID consistency, and Code Mode parsed the new Node JS modules; there is **no verified Maven compilation/test run, TypeScript/Vite run, Worker Docker build or actual eleven-file FFprobe on production stored MP4s** from this chat. PR remains draft/unmerged. Railway Backend and Worker still live on source SHA `0b1c62c4592f5cffcee9ae92ade9986e42f93530`, which **does not include** this master implementation. No new MP4 has been created or uploaded. Backend release gates `MEDIAOS_EP002_MASTER_RENDER_ENABLED` default false and `MEDIAOS_EP002_MASTER_RELEASE_WORKER_SHA` default blank; no worker target switched and no paid CPU operation authorized/executed.

## Required acceptance sequence

1. Run Java 21 PostgreSQL Maven tests (including `Ep002DirectorMasterContractTest`), frontend targeted Vitest/TypeScript/Vite and full Worker Docker build with new Node tests. Fix any failure; do not treat source-level checks as test execution.
2. Review staged PR against deployed feature baseline, then merge/roll out authorized production Backend+Worker with **exact same tested source SHA**, verify health/security/callback gates, and separately enable master feature flag and pinned Worker target `EP002-DIRECTOR-MASTER`.
3. Authenticated Director GET preflight: confirm **all 11 exact stored source MP4 records**, non-null source digest, total actual frames, and ready gates. Verify Worker ffprobe compatibility on real bytes; mismatched codecs or missing audio must fail closed rather than silently re-encode.
4. Director separately clicks **Render full EP002**, confirms billable Railway CPU; only then the job may download eleven approved files and assemble one MP4. Do not infer consent merely from opening the room, approving SHOT01 or requesting engineering.
5. Real finished master must be HTTP playable, 1920×1080/30fps with audio, exact summed video frame count, explicit source provenance, and pass a human review of all 10 shot boundaries and SHOT11 ending. Director final creative LOCK is separate. Then update `PROJECT_STATE.md` with real production evidence and Stage 7 acceptance.

**Roadmap v1 remains authoritative.** EP001, EP002 original source Script v4 and Visual Pass v1, saved Takes and all individual locked MP4s remain protected. No ElevenLabs, OpenAI credits, Railway CPU render, GitHub Actions, YouTube publication or automatic creative approval was invoked for this staged work.
