# MediaOS — Production Recovery Backup Evidence

**Date:** 2026-11-01. **Scope:** Production database read-only copy, stored privately in Railway object storage, verified independently by downloading and restoring it. **Do not confuse this with an approved production cutover.**

## Observed results

- Railway private bucket: `mediaos-production-recovery` (production environment only, project MediaOS). Private S3-compatible object storage with Railway-managed AES-256 encryption at rest. No public domain.
- The backup helper ran without production database writes using PostgreSQL 18 `pg_dump --format=custom` and `PGOPTIONS=default_transaction_read_only=on`.
- Archive object prefix: `postgres/backups/production-v85-`; see the one-time Railway deployment logs for the exact private object key (not copied into source control).
- Backup object size: **817,308,076 bytes**.
- SHA-256: `784be788d64f9103e2f2c571d99353d348dd3d4721b0a8f9d61024add612c101`.
- Evidence observed: `READ_ONLY_SOURCE_BACKUP=PASS`, `DURABLE_PRIVATE_S3_BACKUP_UPLOAD=PASS`, `DURABLE_PRIVATE_S3_BACKUP_REDOWNLOAD_SHA256=PASS`.
- The job downloaded the archive back from Railway S3, compared its SHA-256/size against the original, and used that **downloaded** archive for an isolated PostgreSQL 18 restore.
- Independent validation: `PRODUCTION_COPY_RESTORED_TO_ISOLATED_POSTGRES18=PASS`; Java `ProductionCloneUpgradeAcceptanceTest` `Tests run: 1, Failures: 0, Errors: 0, Skipped: 0`; `LOCAL_CLONE_UPGRADE_V85_TO_V105_AND_EP001_HASHES=PASS`. The test verified existing EP001 episode/studio shot/audio/revision-history checksums and applied all 20 new migrations only against `127.0.0.1`.
- All one-time services must be deleted after capturing logs. **The private bucket and the verified object remain durable.**

## Recovery instructions and limits

1. In the Railway **MediaOS** production project, locate the private `mediaos-production-recovery` bucket, and identify the `production-v85-20261101...` object using the exact key recorded in the one-time backup deployment log. Do not expose S3 credentials or the dump to chats, GitHub or logs.
2. Launch an isolated recovery environment **with a different PostgreSQL service and a new empty volume**, not the live Postgres service or its current volume. Read the bucket using Railway reference variables `ENDPOINT`, `BUCKET`, `REGION`, `ACCESS_KEY_ID` and `SECRET_ACCESS_KEY`.
3. Download the object, verify SHA-256 against the recorded value, restore the dump with `pg_restore --no-owner --no-acl --exit-on-error` and verify source Flyway V85 and EP001 production invariants. Use the guarded local-only acceptance test before applying migrations. Do **not** point any test or Flyway at a production database URL.
4. For a production cutover, independently prepare app rollback, Director login migration and asset invariants. Do not regard this backup as a live automated restore or zero-downtime solution.

**Security and operational limitations:** Railway bucket is private and platform-encrypted at rest, but this snapshot is *not* client-side encrypted with a separately-held key and is *not* off-platform. Railway S3 buckets have no object locks/versioning, so administrator deletion remains a risk. This is a one-time snapshot, not a daily backup schedule or Postgres PITR. Configure native Railway Postgres PITR/volume backup schedules and off-platform retention separately before considering full operational recovery complete.

**Release approval:** Draft PR #112 remains NO-GO until Director credentials/recovery, live Safari security acceptance, worker identity rotation, complete approved media workflow, Remotion advisory handling and final explicit Director GO are satisfied.
