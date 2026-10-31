# MediaOS — episode-aware Remotion CPU render linkage

**Scope:** Draft PR #110. Java backend + disposable PostgreSQL regression only. No production rollout, no live QA writes, no EP001 changes, no new video production, no Runpod/GPU.

## Original issue

The existing `RemotionCpuWorkerController.linkVoiceWorkflowRender` completed a CPU render, parsed `shotKey`, `scriptRevision` and `generationRevision` from render `input_props`, but then updated `voice_shot_workflow` with a fixed EP001 episode UUID. This could associate a future episode's completed render with the wrong episode's Shot/Voice workflow when shot key and revision happened to match.

The existing `remotion_render.episode_id` column has been present since Flyway V46. **No new migration is needed.**

## Corrected contract

- CPU worker claim now returns the **stored** `episodeId` alongside `renderId`, composition ID, properties, duration and output profile. The current CPU renderer ignores this extra response field; its existing encoding workflow stays unchanged.
- On `PUT /api/v1/remotion/renders/worker/{renderId}/complete`, after persisting successful completion, the backend links the render to Shot/Voice rows using `remotion_render.episode_id` rather than any hardcoded episode or any client-supplied episode from `inputProps`.
- Render must have status `SUCCEEDED`, non-null database episode UUID, a nonempty shot key and a positive script revision. `technicalRerender=true` never updates Shot/Voice linkage.
- The update checks **episode UUID + script revision + shot key**, and independently verifies that the referenced render belongs to the same episode and Architectural Thinking project and has status SUCCEEDED. No episode from another project, a different script revision, or an unbound render may be linked.
- Existing EP001 composition registration and EP001-specific CPU assets, code paths, voice approvals and video data are not modified. This patch changes only a generic worker controller to make **future** episode linkage safe.

## Isolated regression

`RemotionEpisodeAwareLinkTest` creates **two random, disposable, non-EP001 episodes** under the existing CI project. Both episodes have identical shot keys and script revisions, with an additional shot revision. It inserts matching temporary Remotion render rows, runs the real controller's database linkage, and checks that only the correct episode and revision are linked. Other cases verify that a render without an episode ID, a failed render and a technical rerender cannot change existing shot links. The fixture removes only its own temporary rows and never updates EP001 rows.

Build verification uses disposable PostgreSQL inside `Dockerfile.security-ci`, full Java Maven test suite and frontend TypeScript/Vitest. No real production worker or production database is contacted.

## Remaining steps before EP002 can render

1. **Episode-aware render creation/registration:** the existing `RemotionRenderController` composition registry is EP001-only. EP002 needs its own reviewed composition registry and render submission API, with validated episode ownership, Director approval and actor audit. Never silently rebind EP001 compositions to EP002.
2. **Media/render inputs:** future episode manifests must identify shot, script/visual revision, frame count and approved media assets. The CPU worker's EP001-specific cumulative-preview, audio mastering and sound-design branches remain protected, not reused for EP002 without explicit design.
3. **Isolated HTTPS QA:** add a temporary Director account and temporary EP002-like episode, then exercise Director LOCK → CPU claim → progress → complete/fail → Video Review. Do not run a real render on EP001; keep paid AI, Runpod/GPU and live production changes disabled.
4. **Release:** validate migration/rollback and backup/restore on disposable data, require separate Director sign-off before merging or deploying PR #110. The existing Railway `media-os-render-worker` stays on `main` until authorized.

**Note:** Correct linking is a foundation, not an end-to-end EP002 render workflow; do not treat green database tests as proof the EP002 Remotion composition exists.


## Verified CI acceptance — 2026-10-31

- **Tested code commit:** `f49212019bb787eeb8860e655263ed21d7a26f4d`.
- **Temporary Railway QA build service:** `mediaos-episode-aware-link-ci-pr110-temp`, deployment `7a6f6a8a-391a-4688-885c-d1c98ce84346`.
- **Maven/Java 21 + disposable PostgreSQL 16:** **210 tests passed, 0 failures, 0 errors, 0 skipped**; entire Docker build **SUCCESS**; Flyway 103 migrations validated.
- The frontend TypeScript/Vite and Vitest stages and CPU worker Node syntax checks also ran successfully within the same Docker build.
- First run discovered a test-only Spring `JdbcClient.query(UUID.class).single()` limitation when a deliberately unlinked shot has NULL `remotion_render_id`. The test was corrected to query an Optional nullable UUID; the actual production controller logic did not require changing. The full second run passed.
- QA data consisted only of temporary random episode UUIDs, shots and render IDs. It did not modify EP001 records, any existing persistent QA database, or the live `media-os-render-worker`.
- **Not yet tested:** creation of EP002 Remotion compositions and shot renders, a live HTTPS CPU-worker render, iPhone Safari authentication, full Shot Studio/Voice/Video Review lifecycle.
