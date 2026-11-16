# MediaOS EP001 + EP002 storage audit — 2026-11-16

## User instruction

The Director asked to delete unnecessary EP001 and EP002 information, continuing the EP003 master-only/superseded-MP4 cleanup policy. This **does not authorize erasing approved source content, original voice recordings, scripts, reusable scene code, or unapproved-but-required input clips**.

## Production read-only audit

Source: `cumulative-engine/ep001-ep002-production-retention-audit-once.mjs` at immutable commit `cd00452db75a1cc0ffd7f103ff2cc81567f3b8b4`, Railway worker deployment `9549b8c9-d6a9-4a5b-95cb-f24076cb94ea` SUCCESS, event `EP001_EP002_STORAGE_AUDIT`. Read-only transaction, zero deletes or metadata changes.

| Episode | Render records | MP4 payloads | Total MP4 logical payload | Unpinned / unreferenced initial audit pool |
| --- | ---: | ---: | ---: | ---: |
| EP001 | 135 | 64 | 741.90 MiB | 50 MP4s / 561.40 MiB (not all confirmed obsolete) |
| EP002 | 54 | 41 | 560.64 MiB | 29 MP4s / 399.18 MiB (not all confirmed obsolete) |
| Combined | 189 | 105 | 1,302.54 MiB | 79 MP4s / 960.58 MiB (merely potential review; **NOT approved for deletion**) |

The initial candidate set is intentionally **conservative in reporting**: it only excludes the manifest-pinned IDs, `visual_shot_lock`, `voice_shot_workflow`, `episode_shot05_voice_revision_archive`, external `object_url` and non-SUCCEEDED rows. It does NOT yet prove every remaining row is superseded: further filtering is required for latest master candidates and any additional production references. These numbers are NOT a final delete allowance.

### EP001 source protection

The full 12-shot source set contains an approved SHOT01–09 cumulative master `fd1046d0-6b20-4267-8135-8b67add2ca33` and separately Director-approved SHOT10 `7e55c59a-3102-4d4c-b23e-96c68ad1f286`, SHOT11 `3a09dbd5-7ef8-4c0e-9621-12ca8a4b99a0`, SHOT12 `5d8c7db2-b34e-4781-af1a-2aa236691ea5`. The 2026-10-27 source handoff states the fully exact-frame 12-shot master was **not yet Director-approved**. Protect all four source MP4s.

Also protect original voice takes, every visually locked/voice-referenced render, and the three special EP001 audio review renders the current backend retention specifically exempts:
`e03c87c6-3f68-40cb-adba-24020bca28af`, `96699a27-7615-4ce1-a092-53cdf1e9d1af`, `904b3075-c5ee-49a3-9d3b-7d4a36f8fbf8` (about 269 MiB total). None may be deleted automatically.

### EP002 source protection

`remotion-engine/ep002-approved-master-manifest.json` pins exactly 11 approved source MP4 IDs; all are present. The selected SHOT01 V2 is `8f46fafd-9613-4375-bce2-ea98854e8b20`. The first stored full eleven-shot master is `8876235a-8037-4f19-8f5c-d2398f3ef22f` (13:01.53, 1920×1080/30fps, 23,446 frames, 84,647,711 bytes). The source documentation states the final creative approval of every seam and ending was still pending. Three other successful `EP002-DIRECTOR-MASTER` videos exist, 86.28, 79.70 and 71.04 MiB; **do not presume newer versions are obsolete or delete them until the latest accepted one and its provenance are verified.** Protect the eleven selected input MP4s and all EP002 full master candidates until explicit approval/selection.

### Why actual deletion was blocked

Railway production Postgres primary `5573c99f-dce7-4798-93f1-1b44ce594282` is on a **5,000 MB volume**. The observed `DISK_USAGE_GB` was **4.93768704 GB**, reaching **4.971081728 GB** within the last hour. The database logical allocated size was ~3,334.9 MiB and `remotion_render` relation was ~3,135.59 MiB. The discrepancy may include PostgreSQL WAL, transaction overhead, or other physical files. Following EP003’s pruning, logical MP4 deletion did not decrease physical file allocation; extra WAL temporarily increased disk usage.

At this quota, more bulk `UPDATE ... SET video_data=NULL` risks database outage from disk exhaustion. No EP001/EP002 deletion was performed. **Do not** run VACUUM FULL, CLUSTER, REINDEX or destructive disk compaction with this headroom. Do not resize volume or incur cost without explicit authorization. Once usable physical headroom is established and actual accepted versions identified, prune only small batches with exact source and active-render guards, verify saved master after each batch, then stop on disk pressure.

## Completed non-destructive actions

- Implemented and executed reproducible isolated read-only Railway audit.
- Identified exact source/voice/visual lock protections and risky alternate full masters.
- Preserved 100% of EP001/EP002 MP4 payloads, related voice audio and reference metadata pending safe cleanup.
- Production MediaOS remains on successful backend deployment `7786c7ee-23e9-4d29-a4bf-bf886354bfb3`.
