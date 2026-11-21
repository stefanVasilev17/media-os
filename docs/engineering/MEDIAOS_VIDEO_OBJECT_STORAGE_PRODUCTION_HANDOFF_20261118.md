# MediaOS — P0 private S3 MP4 Storage: Production Handoff

**Verified:** 2026-11-18, Europe/Sofia. **Release:** [PR #317](https://github.com/stefanVasilev17/media-os/pull/317), merged SHA `1446a784d9e71013c66fad95ea246a52fe4698be`. Final existing backend Railway deployment `392bbf1b-6005-410b-984f-3826f3e89a93` **SUCCESS**, production `/actuator/health` successful. No paid ElevenLabs or Remotion CPU render.

## Goal and protections

The Nov 17 Director LOCK requires only the 3 normal Railway services (`media-os-backend`, `media-os-render-worker`, `Postgres`), no new media binaries in PostgreSQL, no unauthorized paid operations, no automatic loss of Director-approved or pending-review media. EP001–EP003 existing masters remain in their legacy storage without modification, migration or deletion. Use the *already provisioned* private Railway recovery bucket with separate namespaced video objects, never expose public S3 URLs.

## Implemented and deployed

1. `V128__remotion_video_external_object_storage_p0.sql`: additive `remotion_render.video_object_key`, `video_sha256`, `video_object_bytes`, `video_storage_verified_at`, `video_retention_class`, `video_expires_at`. Unique object-key index and format/retention constraints. Database BEFORE INSERT and UPDATE OF video_data triggers reject new/replaced bytea payloads, while old existing bytes may remain or be purged by existing approved legacy policies. No existing MP4 was rewritten.
2. `MediaObjectStore.java`: strict `mediaos/media/video/v1/{renderUuid}.mp4` namespace, private S3 upload with max 256 MiB, SHA-256 metadata + HEAD + complete **streamed full-file readback** before commit; private video Range stream and optional original legacy/full S3 verified download; uncommitted S3 objects removed when the database render-completion transaction fails.
3. `RemotionCpuWorkerController.java`: worker requires configured writable object storage before claiming a CPU render; authenticated MP4 completion checks ownership, stores S3 object, then persists only object manifest and protected review classification. It never writes a new `video_data` value. Any failed relational transaction attempts safe orphan cleanup.
4. `RemotionRenderController.java`: existing Director-session-protected `/api/v1/remotion/renders/{renderId}/video` streams S3 with verified HEAD + HTTP byte ranges, while old approved legacy media keep their bytea reader. Existing latest-successful review queries now recognize both storage types.
5. `EpisodeFactoryWorkerMediaController.java`: worker-only fetch of the current approved voice Take supports the S3 voice adapter from V127, and worker-only approved source MP4 supports S3 hash-verified object input with legacy fallback. `EpisodeFactoryRenderCoordinator` accepts verified S3 output in final review logic.
6. `MediaObjectStorageStartupSmoke.java`: guarded **synthetic/zero-provider-call** MP4 upload, complete SHA readback, ranged GET, byte compare and verified delete, alongside existing voice smoke. Enabled manually only for the live proof, then explicitly reverted to false.

## QA evidence — not claims of a real video

- Railway first backend code deployment `691fbae0-bac7-44b0-a8cc-53649f4b6e59` **SUCCESS**. Java 21 Maven PostgreSQL build **537 tests, 0 failures, 0 errors, 47 skipped**, Flyway V128 validated in isolated PostgreSQL.
- One-shot startup smoke deployment `948cbd28-52eb-41f6-bb65-823ad6bf19fd` **SUCCESS**. Production log exact markers: `MEDIAOS_P0_VOICE_OBJECT_SMOKE_PASS put/get/sha/delete, no ElevenLabs call` and `MEDIAOS_P0_VIDEO_OBJECT_SMOKE_PASS put/sha-full-readback/range/delete, no paid render`.
- Final merged SHA deployment `392bbf1b-6005-410b-984f-3826f3e89a93` **SUCCESS**, Spring Boot started, Railway healthcheck 1/1. `MEDIAOS_MEDIA_OBJECT_S3_SMOKE_ON_STARTUP=false` committed on final release.
- Inventory after release: **only** `media-os-backend`, `media-os-render-worker`, `Postgres`, all SUCCESS, 1 existing private bucket, no staged changes. Postgres `DISK_USAGE_GB=1.084850176` at final check versus about 1.08486656 before work, negligible change from the synthetic S3 proof.

## Evidence limits and next gates

**S3 MP4 writer/reader/migration is implemented and deployed with live synthetic object-store QA.** A *real* EP004 SHOT01 H264/AAC MP4 completion through the shared worker and true browser playback has **not** been executed or Director-reviewed. The user reported EP004 SHOT01 Slow Natural Take generated and Director-approved, but the connector has no authenticated Director Take UUID and true aligned cueFrame values. EP004 Remotion visual-only source is available separately as draft [PR #316](https://github.com/stefanVasilev17/media-os/pull/316); it is not a rendered or approved MP4.

**Next:** Verify actual approved Take and original word/phrase alignment in Director-authenticated MediaOS; finish the strict source-locked production composition (without fabricated voice timing), test worker source pin, bounds and 1080p frame/text/path geometry, obtain fresh Director CPU budget and audited consent, run exactly one job on the *existing* worker, check full encoded MP4/ffprobe/audio/seam QA and provide protected Director review. Only explicit Director visual approval may LOCK.

**Retention boundary:** New MP4 objects are `DIRECTOR_REVIEW_PROTECTED` while pending human decision; **do not auto-expire them**. Synthetic and uncommitted scratch objects are deleted and verified; full post-LOCK/superseded-review lifecycle automation, total object-byte quota, and active monitoring/alerts are **still outstanding** P0 implementation tasks. Never claim a universal retention engine exists from the schema or synthetic smoke alone. Final EP004 end-to-end cost/disk admission gates also require full verified acceptance. Grandfathered 3 masters remain protected.
