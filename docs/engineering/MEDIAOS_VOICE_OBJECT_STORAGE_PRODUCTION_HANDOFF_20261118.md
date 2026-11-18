# MediaOS — Voice Object Storage P0 Production Integration Handoff

**Date:** 2026-11-18. **Status:** CODE CANDIDATE ON THE ACTUAL RAILWAY PRODUCTION BACKEND LINEAGE. **NOT BUILT, DEPLOYED, OR VERIFIED AGAINST A LIVE BUCKET YET.**
**Director goal:** resume EP004 voice and video production without new services, new volumes, new buckets, PostgreSQL binary growth, or accidental paid retries.

## Explicit production base decision

- Production `media-os-backend` Railway service currently tracks `feat/ep003-owner-b-centered-and-header-safe-20261116`, NOT `main`. Their Git histories diverged substantially: production branch 1,350 commits ahead and 114 behind main when compared 2026-11-18. Never redeploy the main-only voice code over the live branch or overwrite EP003 Slow Natural voice behavior.
- Actual production source schema already includes Flyway `V126`. The additive external-voice change therefore uses **`V127__episode_voice_external_object_storage_p0.sql`**, not the V121 candidate on main. Protect EP003 v4 `SLOW_NATURAL` delivery mode and all current selected Takes.
- Three normal Railway services only: existing backend, render worker, Postgres. Existing private Railway bucket `mediaos-production-recovery` (region `sjc`, S3 region `auto`, virtual-hosted URL style) is already provisioned. The GitHub/Railway OAuth connector exposes no bucket plaintext access-key values to the agent, and the backend currently has no `MEDIAOS_MEDIA_OBJECT_S3_*` references set. **Do not claim live object write until the client is wired, built, configured, and tested.**

## Source implementation

1. `MediaObjectStore.java`: AWS Java SDK v2 pinned at `2.36.0`; HTTPS/private client only, unique namespaced `mediaos/media/voice/v1/EP###/SHOT##/request-UUID/take-UUID.mp3|wav` objects. Strict key validator prevents traversal or `postgres/backups/` reads/writes/deletes. Fixed 24 MiB max per Take. Remote HEAD content-length and metadata SHA-256 check **plus full readback and local SHA-256 validation**; fail closed. Only synthetic preflight probes are deleted automatically by the adapter; never delete real Takes or backups.
2. `EpisodePackageVoiceStudioService.java`: uses actual **EP003 Slow Natural** production logic without rewriting the script/voice-lock flow; checked nonpaid S3 roundtrip **before** reserving or sending a paid provider request, plus per-episode retained voice quota 512 MiB. Existing unique paid request ID + `IN_FLIGHT/UNCERTAIN` guard remains. Real provider voice + alignment and measured duration preserved. Before storing a Take, upload to S3; persist its immutable object key/hash/bytes to `episode_package_voice_request`; insert only metadata and timestamps in `episode_package_voice_take`; preserve legacy binary playback only for existing Take rows. Director approval checks the selected Take's real bytes before changing the selected Take record. No automatic paid retry.
3. `V127`: default existing old Takes `LEGACY_DB`; new object rows `OBJECT_VERIFIED`; `audio` nullable only for object-backed Takes; DB CHECK constraint demands exactly one media location; immutable remote key unique index; **database BEFORE INSERT/UPDATE OF audio trigger rejects any NEW binary audio**. No rewriting or erasing approved EP001–EP003 audio.
4. `MediaObjectStoreTest.java`: code-level JUnit source for fail closed when unconfigured, protected voice keys, bad path tests, and SHA-256 constant. Tests are authored but **not executed in actual repository build**.

## Mandatory safe production activation steps (not yet performed)

1. Run full backend Java21 Maven test suite, Flyway V127 migration verify, smoke/QA on existing services (no separate Railway service or GitHub Actions). Verify no release regression in EP003 v4 `SLOW_NATURAL` and existing locked render/playback.
2. Wire the *existing* bucket to backend via Railway **reference variables** (do not copy/reveal secrets; never put credentials in GitHub):
   - `MEDIAOS_MEDIA_OBJECT_S3_ENDPOINT=${{mediaos-production-recovery.ENDPOINT}}`
   - `MEDIAOS_MEDIA_OBJECT_S3_BUCKET=${{mediaos-production-recovery.BUCKET}}`
   - `MEDIAOS_MEDIA_OBJECT_S3_REGION=${{mediaos-production-recovery.REGION}}`
   - `MEDIAOS_MEDIA_OBJECT_S3_ACCESS_KEY_ID=${{mediaos-production-recovery.ACCESS_KEY_ID}}`
   - `MEDIAOS_MEDIA_OBJECT_S3_SECRET_ACCESS_KEY=${{mediaos-production-recovery.SECRET_ACCESS_KEY}}`
   - `MEDIAOS_MEDIA_OBJECT_S3_ENABLED=true`
   - `MEDIAOS_MEDIA_OBJECT_S3_WRITE_ENABLED=true`
   The exact Railway bucket resource variable reference identifier and permissions must be confirmed in Railway UI before activation; never assume these examples have resolved. Keep `MEDIAOS_EPISODE_PACKAGES_VOICE_WRITES_ENABLED=false` until all live tests pass and Director separately authorizes first paid Take.
3. Start only an explicitly approved existing-backend production deployment on **the actual production lineage**, and inspect Railway Maven Java21 test summary, successful V127 startup, secure bucket access and zero extra services/volumes.
4. Conduct read/write/cleanup probe with NO ElevenLabs calls; current code's `verifyPreflightBeforePaid` performs this on actual Generate request before paid dispatch. Before enabling user-paid Generate, independently demonstrate a synthetic S3 upload/download/delete and SHAs under the same config without an ElevenLabs call. A dedicated guarded no-paid smoke test may be needed.
5. Verify new `episode_package_voice_take.audio` is NULL, its `audio_object_key` exists, complete SHA readback/playback succeeds, timestamps preserved, and old legacy Takes remain playable. Simulate S3 failures; ensure `UNCERTAIN` requests cannot trigger charged retries. Confirm no changes to three approved master MP4s.
6. **Retention:** Current patch prevents new voice DB blobs and bounds one Take and all Takes per episode, but it does **not yet implement final-video-LOCK-driven automatic retention/pruning**. Existing P0 policy protects Director-approved/pending-review assets. Do not delete selected takes, active review or backup objects; implement and test full lifecycle once a real EP004 final LOCK event and verified offsite archive exist.
7. **Global MP4 protection:** This patch solves new Episode Package voice storage only. The existing `remotion_render.video_data` pipeline still requires independent object-store writer/reader and strict P0 admission changes before EP004 video renders.

## Objective completion statement

**Code staged in GitHub, not in production.** The user may import the EP004 JSON source through Director browser without paying anything. **Do not authorize paid TTS until bucket variables, tests, V127, private access, SHA retrieval and paid gate checks have actually passed.** If it isn't verified, status is BLOCKED, not READY.
