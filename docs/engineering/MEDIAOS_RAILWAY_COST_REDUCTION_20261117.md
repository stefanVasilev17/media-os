# MediaOS — Railway production cost reduction, verified 2026-11-17

## Decision, scope and authorization

The Director explicitly requested **immediate, substantial reduction of Railway's continuing spend**. Billing cycle reported by Director starts 2026-11-13; the user sees about $5 by 2026-11-17, but connected Railway tools expose resource metrics **not exact invoice / workspace Usage line items**. This document records real infrastructure changes and measured resources, **not a claim of an updated invoice**. Production target is Railway project `a2b47ba1-385e-4410-93ee-b2198492b724`, environment `ffce6002-aa51-4a11-a23f-73c9a05d3cb1`.

**Protected:** primary PostgreSQL volume `postgres-volume`, director-selected full MP4 render rows EP001 `904b3075-c5ee-49a3-9d3b-7d4a36f8fbf8`, EP002 `56c2a4b7-8bc0-465b-baea-80fa3707e709`, EP003 `63827ce6-2ea8-4853-a61b-8549fe8db967`, all Git source, scripts, lock and provenance metadata. No MP4s, scripts, voices, or source media were changed. No paid voice generation, rendering, cloud agent tasks or storage expansion. **No restart of the primary PostgreSQL service**.

## DONE 1 — remove obsolete EP002 canary service

- Deleted *stateless* service `mediaos-ep002-voice-isolated-canary` (ID `0607088a-bc75-4ebb-92e7-1fd30cae70c4`) **only from production environment**. Latest source was historical Git SHA `1bcbefa4032d725181a4dfa90afa8922a0b6d4c9`, Dockerfile `Dockerfile.voice-mvp-fresh`, test endpoint had zero public HTTP requests over prior 96 hours. It continued minute-by-minute retention logging against isolated ~12 MiB test DB and used **~0.3917 GB RAM / ~0.0019 vCPU** near continuously. No attached volume; service deletion was verified. Git source persists.
- Estimated savings from avoiding 0.3917 GB RAM continuously at $10/GB-month: **~$3.92/month**, plus small CPU.

## DONE 2 — stop obsolete secondary Postgres runtime, KEEP ITS DATA

- Deleted *service only* `Postgres-urOW` (ID `5f794554-379b-4d25-adb4-4f23bafbe45f`) from production. It was the historical isolated voice-clone canary database, ~0.0636 GB RAM, near idle CPU, ~0.1603 GB disk. No public TCP proxies/domains. Main backend uses primary `Postgres` and remained online during removal.
- **DO NOT DELETE ITS DATA VOLUME:** Railway returned `detachedVolumes:[{id:'0ec0f486-e0d4-46c4-a1db-670985a34fea',name:'postgres-volume-WZQw'}]`. Subsequent Railway inventory confirmed 48 services, secondary DB absent, and `postgres-volume-WZQw` exists unmounted. Its data remains and storage charge continues (minor); can be recovered/reattached if needed.
- Estimated ongoing memory savings **~$0.64/month**, plus negligible CPU. Main Postgres and its separate `postgres-volume` were never removed or detached.

## DONE 3 — read-only proof of why primary PostgreSQL used ~4 GB RAM

- Using a *reused* existing one-off QA worker `ep003-shot09-nine-shot-director-wip-once`, executed read-only `cumulative-engine/mediaos-pg-cgroup-memory-audit-readonly-once.mjs` from Git SHA `b5169492661a1d46f02d93df408dc3a30f30be6e`, isolated Dockerfile `Dockerfile.mediaos-pg-cgroup-memory-audit-readonly-once`, SUCCESS deployment `0604dc86-10a5-4d04-95b6-c573e844e4af` with runtime `MEDIAOS_PG_CGROUP_MEMORY_AUDIT_SUCCESS`.
- **Before optimization**, real PostgreSQL cgroup: `memoryCurrentMiB=3772.89`, `file=3646.19 MiB`, `inactive_file=3486.33 MiB`, `anon=26.12 MiB`, `shmem=159.86 MiB`, `kernel=98.34 MiB`. `shared_buffers=128 MiB`, `work_mem=4 MiB`, `max_connections=500`, 11 active+idle backend connections. Huge cost was mostly **inactive Linux page cache from historical large media reads** rather than high actual PostgreSQL anonymous memory usage. No deletion or configuration mutation during diagnostic.

## DONE 4 — reversible primary DB RAM cap, actual reduction measured

- Applied Railway `update_service` **only** to PRIMARY `Postgres` (ID `5573c99f-dce7-4798-93f1-1b44ce594282`) in production: `limits:{memoryGB:1.5}`. This is a live reversible container resource limit, not a PG restart, volume resize, SQL setting or image rebuild.
- Railway metric `MEMORY_LIMIT_GB.current=1.49999616` confirmed. Primary `MEMORY_USAGE_GB.current` dropped **from ~3.954 GB to ~1.104 GB**, ~72% RAM reduction.
- **Post-change live QA:** same exact pinned, read-only worker re-run (deployment `2ec900aa-bb05-4c1a-977c-dc9935b22ef8`) returned `MEDIAOS_PG_CGROUP_MEMORY_AUDIT_SUCCESS`: `memoryCurrentMiB=1055.4`, `memoryMaxMiB=1430.51`, `file=991.38 MiB`, `inactive_file=831.50 MiB`, `anon=25.84 MiB`, `shmem=159.86 MiB`, `kernel=35.94 MiB`, `connections: active 1, idle 10`, and **all 3 protected master render rows remained SUCCEEDED with video data present and expected frame counts**.
- Railway runtime status explicitly showed **primary Postgres online / running 1 replica / 0 crashes / no issues**, and **media-os-backend online / running 1 replica / 0 issues**. Railway current Postgres disk remained `4.112965632 GB`; this task did not compact/reclaim the previously measured 2.8 GiB PostgreSQL TOAST bloat. No primary DB restart was performed. The RAM cap must be revisited before high-concurrency production load, multi-hundred-MB media processing or maintenance, and immediately reversed if any OOM/restart/performance degradation is observed.

## Measured effect vs estimated spend

| Resource | Before live changes | After live changes |
|---|---:|---:|
| Main Postgres RAM | ~3.954 GB | **~1.104 GB** |
| Obsolete EP002 canary RAM | ~0.392 GB | **0 (service removed)** |
| Obsolete secondary Postgres RAM | ~0.064 GB | **0 (service removed, volume retained)** |
| Main backend RAM | ~0.431 GB | ~0.431 GB |
| Shared Remotion worker RAM | ~0.062 GB | ~0.062 GB |
| **Total continuously used RAM** | **~4.903 GB** | **~1.597 GB** |
| Registered services | 50 | **48** |

This yields a reduction of **~3.306 GB ongoing RAM use, ~67% of original total**. At Railway's indicative $10 per GB RAM per month, a sustained monthly **RAM-only run rate** falls from **~$49.0 to ~$16.0** (savings **~$33/month / ~$1.10/day**). These are *projections* based on actual RAM usage measurements, **not measured invoice savings**; CPU, disk, egress, temporary Remotion builds/renders and user plan/credits are not included. Usage billing can lag.

**DON'T** turn off or sleep core `media-os-backend`, `media-os-render-worker`, or primary `Postgres`. **DON'T** remove the two volumes, delete the only selected full master MP4s, attempt `VACUUM FULL` with <1 GB disk headroom, or reduce PostgreSQL RAM further without ongoing health and full-film playback checks.

## Remaining follow-ups

1. Read actual workspace billing/Usage breakdown for the new 2026-11-13 cycle (connected Railway API does not expose invoices). Distinguish $5 Hobby subscription/included credit from actual resource consumption. Inspect video render spikes Nov13–16.
2. Observe Postgres 1.5GB cap under genuine application load; provide alert/rollback if OOM or slow MP4 playback (raise Railway memoryGB limit back to 3–4GB if necessary).
3. Audit 44 historical no-volume one-off Railway SHOT/QA services for dependencies and retire them in batches for service-count/operational cleanliness, **not** to claim significant ongoing RAM savings (many are already at zero resource usage). Preserve Git SHA, build settings and approval metadata before deletion.
4. Keep the detached secondary PG volume `postgres-volume-WZQw` until explicit owner-reviewed retention/backup decision; it is cheap (~0.16GB used) and preserves recovery.
5. Plan safe physical PostgreSQL TOAST compaction/migration (previous audit `docs/engineering/MEDIAOS_POSTGRES_PHYSICAL_STORAGE_AUDIT_20261117.md`, PR #306) **separately** with backup and adequate disk headroom.
6. Consolidate future Remotion/QA tasks onto the existing shared render worker rather than creating new services; avoid unauthorised paid AI/voice/render calls.

GitHub issue #307 tracks the ongoing cost/cleanup work. This work is a **production Railway configuration change verified in runtime**, with code and report on a separate feature branch; it is **not merged to main**.
