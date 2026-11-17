# MediaOS — Three finished full-episode MP4s only (2026-11-16)

## Director instruction and actual result

The Director explicitly requested that **only the three complete EP001, EP002 and EP003 movies remain**, and that all individual SHOT renders, superseded full films and standalone voice/audio recordings be erased because the audio is already embedded in the full MP4s.

**Completed in production** on Railway project `a2b47ba1-385e-4410-93ee-b2198492b724`, production environment `ffce6002-aa51-4a11-a23f-73c9a05d3cb1`. Only *the media binaries* were deleted. Keep Git source code, production memory, narratives, prompt rules, lock/provenance metadata, source scripts and referential integrity for MediaOS. The erased standalone voice takes **cannot be reused without new synthesis**; the three MP4s retain their original voice soundtracks. Deleted source SHOT MP4s **cannot be reassembled without rerendering**. No new voice synthesis, Remotion rendering or paid storage expansion was performed.

## Exactly three protected full films

All three were read **directly from the actual production stored `video_data` bytes**, subjected to FFprobe, found H264 1920x1080 at 30fps and AAC with embedded sound, and individually SHA256 hashed.

| Episode | Render ID | Exact video SHA-256 | Actual stored bytes | Frames | Film duration | Embedded sound |
|---|---|---|---:|---:|---:|---|
| EP001 | `904b3075-c5ee-49a3-9d3b-7d4a36f8fbf8` | `5c9dcbba1a5293d9a8bb19654b4aacaa0b752e1a8a8f63f26937b1fcc8192066` | 94,164,846 | 37,703 | 20:56.767 | AAC stereo, 48 kHz |
| EP002 | `56c2a4b7-8bc0-465b-baea-80fa3707e709` | `3a295b5952780a8fe9ecb795332bb7edc229aad5fde70b91daa53bf505f13d09` | 83,569,046 | 23,446 | 13:01.533 | AAC mono, 48 kHz |
| EP003 | `63827ce6-2ea8-4853-a61b-8549fe8db967` | `1560d46f8067c735a2578d769bfcda465f651e46babdf4bd7dfa1090f6ce8ff6` | 152,025,545 | 38,593 | 21:26.433 | AAC mono, 48 kHz |

EP001 is the sound-design full 12-SHOT review master (`EP001_SOUND_DESIGN_V1`), EP002 the newest complete V4 clean-cut master (`DIRECTOR_V4_CLEAN_CUT_NO_BRIDGE`), EP003 the fully Director-LOCKED 11-SHOT official master. EP001/EP002 end-to-end *creative* Director LOCK was not separately claimed or manufactured by this housekeeping operation.

## Actual deletion

**One-time video cleanup:** Worker `cumulative-engine/mediaos-prune-obsolete-ep001-ep002-ep003-mp4-once.mjs`, Dockerfile `Dockerfile.mediaos-three-only-mp4-prune-once`, final run on Railway deployment `41df3d0f-4143-4a88-b19e-f509b86dd979`. A total of **103 obsolete MP4 payloads** across EP001/EP002/EP003 were cleared with `SET video_data=NULL,size_bytes=NULL` in bounded batches; no row metadata or visual approvals were deleted. The final worker event was `MEDIAOS_FINAL_THREE_ONLY_ALL_SHOT_MP4S_PRUNED`, `remainingCount=0`, and exact source sizes of all three protected masters verified on every batch. This 103 count includes late-stage older masters; a prior separate EP003 cleanup had already purged another 43 obsolete MP4 payloads in previous work.

**One-time standalone voice cleanup:** Worker `cumulative-engine/mediaos-remove-standalone-voices-three-finals-once.mjs` from source pin `8096f3b67abb1bf06b87e9a06ff08033df4f2e80`; Railway deployment `8284b8d6-5da6-48a2-937f-d9c264b28a26`. Event `MEDIAOS_THREE_FINAL_FILMS_ALL_STANDALONE_VOICES_REMOVED` showed **114 rows, 66.02 MiB** standalone audio payloads cleared, `allResidualVoices=0` across ten scoped tables. `voice_clip_workflow`, `studio_clip`, archive tables and `ep002_creative_voice_take`, `episode_package_voice_take` cleared. Required-NOT-NULL `audio` columns were set to zero-length bytes instead of dropping whole rows, preserving FKs from approval and choice metadata. Original audio **inside all three MP4 files** remains unaffected.

**Legacy Spline media:** Canonical project filter `11111111-1111-1111-1111-111111111111` found zero source `spline_shot_render` video payloads and zero snapshots in that project. Other project data intentionally was not touched.

## Final independently verified production QA

Isolated read-only worker `cumulative-engine/mediaos-three-final-episode-only-verify-once.mjs`, Dockerfile `Dockerfile.mediaos-three-final-episode-only-verify-once`, commit `d2454ebf5fc7777eb600ee7435f1a597bb1da06e`, successful Railway deployment `70f56953-385e-4fd1-82c1-d5bb165baad6`. Runtime event:

`MEDIAOS_ONLY_THREE_COMPLETE_MP4S_FINAL_STORAGE_QA_PASS`: `masterCount=3`, **exact three selected UUIDs, sizes, codecs and frame counts**, `oldEP001EP002EP003VideoBlobCount=0`, `standaloneAudioBlobCount=0`, `voiceTableChecks=11`, all zero. `dbMiB=3319.36`, `walMiB=256`, `walSizeSetting='256MB'`.

All one-time destructive worker flags were reset to false when deploying this final read-only verifier: `MEDIAOS_FINAL_FILMS_PRUNE_EXPLICIT`, `MEDIAOS_VOICE_DELETE_EXPLICIT`, `MEDIAOS_FINAL_FILMS_SPLINE_DELETE_EXPLICIT`, `MEDIAOS_RECLAIM_WAL_CONFIRMED`, `EP003_FINISHED_MASTER_PRUNE_CONFIRMED`.

## Production UI

Frontend `frontend/src/pages/ThreeFinishedEpisodes.tsx` and routes `frontend/src/App.tsx` now show **only the chosen complete MP4** for `#/library/EP001`, `#/library/EP002`, `#/library/EP003`. Episode selector shows finished masters, not individual SHOT cards or voice players. EP003 package-import workspace shows one full movie rather than VOICE Studio/SHOT list. Historical EP003 SHOT URLs normalize to full-episode route.

Production backend deployment **`1bea4e84-b93a-4a96-b643-49360c536415` SUCCESS**, source SHA `66426207811e7b3a2f2535f4d09e3551283ecfb7`, frontend tests passed, full Maven integration suite **532 tests, 0 failures, 0 errors, 1 skipped**, healthcheck succeeded.

Live links:
- https://media-os-backend-production.up.railway.app/#/library/EP001
- https://media-os-backend-production.up.railway.app/#/library/EP002
- https://media-os-backend-production.up.railway.app/#/library/EP003
- https://media-os-backend-production.up.railway.app/#/ep003/full

## PostgreSQL physical storage caveat

Production 5GB Postgres volume approached 4.94GB used before this job. Bounded SQL deletion and guarded PostgreSQL WAL adjustment `ALTER SYSTEM SET max_wal_size='256MB'` plus checkpoint allowed WAL to recycle from 1,024MiB down to 256MiB. Railway metric `DISK_USAGE_GB.current=4.112924672` after cleanup, vs 4.93768704 before. Allocated PostgreSQL table/TOAST files remain larger than live data (MVCC); physical file size may be reused internally and has NOT been VACUUM FULL compacted. Do not VACUUM FULL at this headroom or manually delete WAL files. The 256MB WAL setting is deliberately smaller than original 1GB and can increase checkpoint frequency; monitor production and revisit with adequate disk headroom.

**Future Executor rule:** never delete the only verified complete master. For new episodes, retain each selected working source/voice until a corresponding newly approved full MP4 with embedded audio exists and is verified; then archive metadata and remove superseded blobs in bounded transactions. Preserve reusable Git, production bible, corrections and source narration. User remains Director; assistant executes.

PR #305 remains open DRAFT and unmerged; Railway production uses pinned source deploy independent of PR merge.

## Forward-looking Director P0 prevention contract — 2026-11-17

**This document is a historical verified incident record, not a workflow to repeat.** The Director now permanently forbids new per-SHOT / QA / preview / canary Railway services, unlimited render CPU or PostgreSQL storage of *new* media binaries. Only existing `media-os-backend`, `media-os-render-worker`, and `Postgres` are the normal production services. Future media must use a tested authenticated object-store read/write path with SHA-256, retention and bounded cleanup; database metadata only, with the three existing protected final film MP4s unchanged. **Fail closed before new MP4 writes until the object-storage contract and source-level enforcement have been verified**. Full binding policy: [MediaOS Permanent Lean Infrastructure & Storage Policy](MEDIAOS_PERMANENT_LEAN_INFRA_AND_STORAGE_POLICY_20261117.md) (policy ID `MEDIAOS-OPS-P0-20261117`). This does not alter or revoke the historical successful cleanup or existing Director-selected masters, and does not assert the new automatic cost/storage guards are already deployed.
