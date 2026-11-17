# MediaOS — Railway historic one-shot service retirement COMPLETE (2026-11-17)

## Director request and scope
Director explicitly requested: "нека изтрием ненужните сървиси сега". This record documents work executed in live Railway production and post-change verification. The separate previous cost-reduction milestone removed the EP002 canary and isolated secondary PostgreSQL service, bringing Railway from 50 to 48 services. **This task removed the remaining 45 historical, stateless one-time SHOT, QA, voice, review and render services, leaving exactly 3 live services.**

Railway project `a2b47ba1-385e-4410-93ee-b2198492b724`; production environment `ffce6002-aa51-4a11-a23f-73c9a05d3cb1`.

## Pre-delete protection and backups
- Inventory of **all 45 service names, IDs, source GitHub repository/branch, latest deployment ID/status/timestamp, region and volume/cron flags** archived at `docs/engineering/MEDIAOS_RAILWAY_ONESHOT_RETIREMENT_INVENTORY_20261117.md` (commit `b285d698bfd18708ad48095c7d1eee3eb2aebd0c`).
- The production Railway descriptions for all 45 services (Git sources, Dockerfiles, region/replica settings, variable **names only**, public domains, TCP proxies, volumes and deployment metadata — **no secret values**) archived across 7 JSON files: `docs/engineering/railway-cleanup-snapshots/20261117-batch-01.json` through `20261117-batch-07.json`.
- All 10 Railway Function one-off source bodies captured before deletion in three safe archived JSON files: `docs/engineering/railway-cleanup-snapshots/20261117-legacy-functions-a.json` and `-b.json` contain 5 raw sources and placeholders; the five long-render-ID/path false positives are captured as full source in `20261117-legacy-functions-uuid-literals.json`. The long literals were checked for credential patterns before publication; no live variable values copied.
- Every one-off target had **zero attached volumes**, **no cron** and **no live public service domains or TCP proxies**. Every individual target had current **CPU_USAGE=0** and **MEMORY_USAGE_GB=0** in a live pre-deletion Railway metric read over the latest hour; no active one-off work was intentionally terminated. They were removed in 7 controlled batches of 7+7+7+7+7+7+3, with Railway asynchronous operations waited through until there was no pending work before subsequent batches.
- No database SQL deletes, no PostgreSQL volume deletes, no video rendering or voice synthesis, no cloud agent or added paid resources.

## Railway deletion verified
- **Start:** 48 services (3 protected + 45 historical one-shot).
- **End:** exactly 3 services, all live with deployment status SUCCESS:
  - `Postgres`, ID `5573c99f-dce7-4798-93f1-1b44ce594282`.
  - `media-os-backend`, ID `d28a8117-8fe2-4e9d-93ee-ebf936d053b9`.
  - `media-os-render-worker`, ID `e78e8e8d-9ad7-4307-aae0-e08037c30134`.
- All 3: Railway `environment_status` **online, 1 running replica, 0 crashes, 0 warnings, 0 critical issues**, pendingWork=0, staged=null.
- Protected storage unchanged: primary `postgres-volume` (5,000MB provisioned, main DB attached), separate **detached but retained** recovery `postgres-volume-WZQw` (5,000MB provisioned, not deleted); bucket `mediaos-production-recovery` remains.
- Primary database `MEMORY_USAGE_GB.current=1.105113088`, `MEMORY_LIMIT_GB.current=1.49999616`, `DISK_USAGE_GB.current=4.112982016` (RAM cap from previous milestone retained); backend RAM 0.432218112GB, shared render worker RAM 0.0617472GB. Approx total baseline RAM for remaining 3 = **1.59908GB**. No disk compaction in this task.
- Latest 1-hour public backend HTTP request count 0, 5xx count 0: successful service status verifies infra health **but not active film playback**. Previous read-only PostgreSQL checks confirmed only 3 full protected video payloads; this service cleanup did not access or mutate them. Preserve director-locked EP001/EP002/EP003 masters, scripts, assets, Git code and history.

## Business impact
- **45 obsolete services retired, 93.75% reduction in Railway service count from 48 to 3**. Together with the two earlier retired isolated test services, the wider optimization lowered service count from 50 to 3.
- Since all 45 removed services showed zero CPU and RAM in latest hour, **do not claim large extra recurring dollar savings from THIS cleanup**. The ~67% baseline RAM reduction and ~$33/month indicative run-rate improvement were accomplished in the earlier primary PostgreSQL RAM-cache cap and isolated canary retirement milestone; those remain in effect.
- Removes accidental re-deploy / unauthorized paid voice/render risk from 45 historical production deployments and frees service quota. Future production renders and QA should be processed through the existing shared `media-os-render-worker`, with Director consent for any paid rendering/AI operation.

## Follow-up, no unauthorized changes
1. Reconcile **exact Railway Usage bill** from the Nov13 billing cycle; current connected tools do not expose invoice line items.
2. Monitor primary Postgres 1.5GB memory cap under actual playback and rendering traffic; raise limit if OOM, degraded request latency or errors.
3. Validate film playback via authenticated MediaOS GUI or existing authorized access; no final 3-film HTTP playback check has been performed during this service-removal task.
4. Separately plan PostgreSQL physical bloat compaction with verified backup, safe disk headroom and explicit Director approval: DB disk still ~4.113/5GB. Do not use VACUUM FULL in current conditions.
5. Detached secondary Postgres volume remains preserved; decide future retention only with Director approval.
6. Source snapshot and this report are on branch `ops/railway-cost-reduction-20261117`, in draft PR #308 stack, not assumed merged to main. Update `PROJECT_STATE.md` accordingly.
