# EP002 — SHOT01 V2 Director LOCK and Full Eleven-SHOT Master

## 2026-11-12 Production supersession: **MASTER MP4 RENDERED AND STORED**

This section **supersedes the historical 2026-11-11 stage-not-live text below**. Live Backend and Render Worker now run the pinned, tested source commit `1e9dec4c4bd3dbdf77535a5f9f05045ad5f62565`. Railway deployments: Backend `4dce2c9c-bc2b-45fc-a0ca-df4b37798fdb` SUCCESS and Worker `bea2df3a-617d-49a4-921e-4811e14e5845` SUCCESS. Both healthy. PR #265 remains draft/unmerged; direct production source pin is live independently of merge status.

**403 cause proven by GitHub SHA diff:** the old `WorkloadRoute.java` did not authorize GET `/{masterId}/ep002-master-source/{sourceId}`. Fixed by adding strict UUID-checked route handling in both `resolve(method,path)` and `remotionCpuRoute(path)` without widening any other Worker permissions. The first failed job `b9e3f213-d6bf-4981-ab7a-084dad69640c` is retained for provenance; exact one-time chat-authorized technical repair created the new successful job `8876235a-8037-4f19-8f5c-d2398f3ef22f`.

**Real MP4 evidence:** 2026-11-11 23:07:20 UTC Render Worker logged `EP002_DIRECTOR_MASTER_REVIEW_READY`, exact 11 source files, 23,446 frames, source digest `996de37c5aa4e5e50d280b8cd4f1f454cfe8d7391ac9ed83d2bd48b8def7ee71`, 1920×1080/30fps, 13:01.53. 2026-11-11 23:07:21 UTC Worker logged `EP002 full eleven-SHOT Director review MP4 stored: 8876235a-8037-4f19-8f5c-d2398f3ef22f bytes=84647711`, after successful backend completion callback and QA. Originals unchanged; SHOT01 V2 is approved; SHOT02–11 are preserved. This is a **real single stored MP4**, not the front-end playlist.

**Director playback:** authenticated [EP002 Director Room](https://media-os-backend-production.up.railway.app/#/library/EP002), Full Episode Master panel, one MP4 playback and download. Direct session-protected MP4 path `/api/v1/remotion/renders/8876235a-8037-4f19-8f5c-d2398f3ef22f/video`. **Final creative approval of all ten seams and SHOT11 ending remains pending**. No direct authenticated browser playback probe has yet been recorded in this chat; distinguish successful Worker storage from personally observed Director playback.

---


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
