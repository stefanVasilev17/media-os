# MediaOS — POSTGRESQL PHYSICAL DISK RECLAIM COMPLETE (2026-11-17)

## Director request and completed result
Director ordered immediate resolution of the production PostgreSQL disk capacity problem. **DONE and verified at both PostgreSQL SQL/file and Railway physical-volume levels**, without losing approved masters, metadata, or any table. Production project `a2b47ba1-385e-4410-93ee-b2198492b724`; environment `ffce6002-aa51-4a11-a23f-73c9a05d3cb1`; main Postgres service `5573c99f-dce7-4798-93f1-1b44ce594282`; volume `postgres-volume` ID `47b2b23a-0704-473d-a1c8-42e3de122180`.

**Railway actual volume metrics before / after:**
- `DISK_USAGE_GB` approx **4.113031168 before → 1.082474496 after**; actual filesystem space reclaimed **3.030556672 GB** (decimal); volume capacity **5 GB**, free now approx **3.917525504 GB / 78.35%** (up from approx 0.887 GB / 17.74%).
- Last measured Postgres RAM `MEMORY_USAGE_GB=0.82696192` during recovery; unchanged `MEMORY_LIMIT_GB=1.49999616` from prior P0 cost optimization. Main backend/worker/Postgres remain online.

**SQL level, exact `pg_database_size` from maintenance job:**
- BEFORE: **3,480,663,743 bytes** / approx 3,480.66 MB; `remotion_render` **3,287,916,544 bytes** with bloated TOAST **3,287,261,184 bytes**; 242 render metadata rows.
- AFTER small audio-table vacuum: DB **3,408,778,943 bytes**, reclaimed **71,884,800 bytes** from five voice/audio tables without deleting rows.
- AFTER main `VACUUM (FULL, ANALYZE, VERBOSE) public.remotion_render`: DB **463,681,215 bytes**; `remotion_render` **342,769,664 bytes**, TOAST **342,310,912 bytes**; **242 metadata rows preserved**. Net DB size difference **3,016,982,528 bytes**. WAL dir **268,435,456 bytes** still present / unchanged. Railway filesystem delta above also reflects other file changes and sampling.

## Backup first — no dependence on sole live copy
Railway's standard **manual** volume backup cannot be assumed available at >50% allocated 5GB volume (provider limit), so used an off-volume logical archive before any physical rewrite. The maintenance job (a temporary Docker service, no volume) ran:
- `pg_dump` PostgreSQL 18 custom-format complete database logical archive, gzip1, `--no-owner --no-acl`.
- `pg_restore --list` succeeded and showed `TABLE DATA public remotion_render` in archive TOC (archive structurally readable; **no full restore drill was performed**).
- Archive size **384,672,654 bytes**, SHA-256 **`b50ea9891ada26dab1c61b4634fcb4d625660b222642f5a6f79442f01f7fe3ad`**.
- Uploaded into **existing** private Railway bucket `mediaos-production-recovery` (bucket data name `mediaos-production-recovery-bidiro`, region auto), object key `mediaos/production-postgresql/pre-toast-compaction-2026-11-17-verified.dump`.
- **Read the complete remote object back** and independently checked that remote size and SHA-256 match the local archive. Remote SHA verification was repeated **before each** of the two physical vacuum phases; both passed. Recovery bucket was not deleted or modified outside the new archive. No bucket key or database secret was printed or committed to Git.

## Protected films: SHA-256 byte-equivalence verified before AND after
Both before any write, and after each successful stage, PostgreSQL `sha256(video_data)` was used to compare exact bytes of all three original Director-selected final MP4s:
| EP | Render ID | MP4 bytes | SHA-256 (unchanged) |
|---|---|---:|---|
| EP001 | `904b3075-c5ee-49a3-9d3b-7d4a36f8fbf8` | 94,164,846 | `5c9dcbba1a5293d9a8bb19654b4aacaa0b752e1a8a8f63f26937b1fcc8192066` |
| EP002 | `56c2a4b7-8bc0-465b-baea-80fa3707e709` | 83,569,046 | `3a295b5952780a8fe9ecb795332bb7edc229aad5fde70b91daa53bf505f13d09` |
| EP003 | `63827ce6-2ea8-4853-a61b-8549fe8db967` | 152,025,545 | `1560d46f8067c735a2578d769bfcda465f651e46babdf4bd7dfa1090f6ce8ff6` |
Exactly 3 non-null MP4 payloads before and after; exactly 242 historical render metadata rows. No mp4 byte altered, no audio generation, no SHOT re-render and no historical metadata deletion. Authenticated browser playback after physical rewrite **not separately verified**; byte identity provides strong preservation proof.

## Controlled implementation, sources and proof
One-off maintenance service `mediaos-pg18-safe-reclaim-20261117`, ID `11e60aaa-5fc0-4925-9a83-7c2485e848b7`, 1GB container RAM / 1 vCPU, restart policy NEVER, no attached volume or public endpoint. Git branch `ops/postgres-physical-disk-reclaim-20261117`, Dockerfile `Dockerfile.mediaos-postgres-reclaim-20261117`, shell source `ops/postgres-reclaim-20261117.sh`. It received DB and private S3 credentials **via Railway variable references**, not hardcoded values or Git, and explicitly required write gate `ALLOW_PHYSICAL_REWRITE=DIRECTOR_DISK_RECLAIM_20261117` plus remote backup SHA verification to start any rewrite.

- **BACKUP** Railway deployment `4eb94e10-7039-4373-9819-0bef7470bc2a`: `MEDIAOS_DB_MAINT_BACKUP_COMPLETED` + `MEDIAOS_DB_MAINT_BACKUP_REMOTE_SHA256_PASS` confirmed. SQL SHA of all 3 MP4s verified.
- **RECLAIM_SMALL** deployment `af8a12ae-d653-44e1-8740-700617fc6dba`: `MEDIAOS_DB_MAINT_SMALL_TOAST_RECLAIM_COMPLETE` after `VACUUM (FULL, ANALYZE)` of five old audio tables `ep002_creative_voice_take`, `episode_package_voice_take`, `voice_clip_workflow`, `studio_clip`, `episode_shot05_voice_revision_archive`. All individual operations succeeded with timeout gates, 71.88 MB DB size reduction, full-film hashes unchanged.
- **COMPACT_MAIN** deployment `889c1ce6-c6f4-44e4-8253-66c4c8737282`: `MEDIAOS_DB_MAINT_BACKUP_REMOTE_SHA256_PASS`, `MEDIAOS_DB_MAINT_VACUUM_FULL_SQL_SUCCESS`, `MEDIAOS_DB_MAINT_THREE_MASTERS_SHA256_PASS`, `MEDIAOS_DB_MAINT_COMPLETE`. PostgreSQL reported the main VACUUM finished in **12.45 seconds** with 242 live rows, 30 removable, no unreclaimable dead rows. SQL database size down to 463,681,215 bytes and `remotion_render` down to 342,769,664 bytes.
- Railway production metrics after operation: **1.082474496 GB actual disk usage**, all critical services `online`, 0 crashes/warnings/criticals. No WAL manual deletion. No Postgres restart or production volume detach/resize.

## Safety/next steps
1. **No repeat VACUUM FULL** unless a new audit shows genuine physical bloat and a newly verified, independent backup exists. The 2026-11-17 issue is now fixed and the main database is under ~22% disk use.
2. The existing private logical backup is a useful off-volume copy, but its S3 cost will continue until a future approved retention decision. A full `pg_restore` drill has **not** been run; it is an explicit future resilience task. Preserve backup until restore has been tested and retention agreed.
3. **COMPLETED:** Permanently removed the temporary maintenance service `mediaos-pg18-safe-reclaim-20261117` after verified final SHA/SQL/log results; it had no attached volume, public endpoint or persistent data. Railway final production inventory verified exactly **3 services**: backend, Postgres and shared render worker, all online with 1 running replica, 0 crashes/warnings/critical alerts; pendingWork=0, staged=null. Both database volumes and recovery bucket remain, with verified off-volume archive.
4. Continue watching RAM cap 1.5GB, backend request errors, and full-film playback. No owner-approved automatic rerender/voice/coding charges.
5. Longer-term move final MP4 content to object storage with Postgres holding metadata and content hashes; only after separate Director-approved storage migration and playback contract, not as an undeclared modification to the three locked films.

**Status: STORAGE PROBLEM SOLVED, TEMPORARY WORKER REMOVED, THREE CORE SERVICES HEALTHY.** Neither metadata nor films were deleted; off-volume full logical dump verified. Draft branch requires selective review before merging into main.
