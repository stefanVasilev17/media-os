# MediaOS — episode-aware Director QA render intake

**Status:** Draft PR #110; code and disposable PostgreSQL/Remotion TypeScript verification only. No production or existing QA deployment. No EP001 modification. No real EP002 video production. No Runpod, GPU or new paid provider.

## Why this exists

Previously the CPU render queue and worker could handle an episode-linked Remotion record, but the production composition registry was EP001-only. No safe API existed to submit an approved EP002+ shot into the common CPU queue without reusing or mutating the locked EP001 compositions.

This step adds a clearly identified **technical storyboard QA-only** composition and an opt-in Director API. The storyboard animates generic Request → Service → Response nodes using the approved visual direction as read-only text. It is not a substitute for the future episode's actual visual design, word-aligned animation, voice mix, or final video.

## New API and allowed state transitions

`POST /api/v1/episodes/{episodeId}/shot-revisions/{shotKey}/render-qa`

Example request (non-secret values):

```json
{
  "shotRevision": 1,
  "decision": "DIRECTOR_APPROVE_QA_PREVIEW",
  "directorNote": "Director-approved storyboard rendering on disposable QA only.",
  "durationInFrames": 150
}
```

Requires **all** of the following:
- verified local Director identity + CSRF validation; explicit Director-only POST security allowlist
- `mediaos.local-auth.enabled=true`, `mediaos.episodes.writes-enabled=true`, and **`mediaos.remotion.qa-intake-enabled=true`** (default false)
- Architectural Thinking project episode matching `EP002+` and not the immutable EP001 UUID
- Script stage `LOCKED` at a positive revision and Scene stage `LOCKED`
- current shot revision `LOCKED`, with non-null Director lock time and the same base Script revision
- one specifically approved `episode_revision_voice_take` for the same episode, shot and shot revision
- explicit `DIRECTOR_APPROVE_QA_PREVIEW` decision, review note and duration of **150–900 frames** at 30fps
- storage capacity guard before inserting any render

The backend creates `remotion_render` with the stored episode UUID, composition `AT-EpisodeShot-QA`, `FAST_PREVIEW` output (1280×720), 30fps and a server-derived manifest (episode, shot, revisions, approved Voice Take ID, visual direction and duration). No arbitrary user-supplied file URL or media binary is trusted. The source Voice Take is approved but is **not embedded or mixed into this QA storyboard**.

It also writes one `episode_workspace_event` with event type `REMOTION_QA_RENDER_QUEUED` and the verified Director issuer/subject; no raw credential is stored. Identical approved requests return the existing render ID; failed previous renders are not silently requeued. Existing generic GET render-status and video-download endpoints provide future review retrieval, subject to their security configuration.

## Renderer integration

New original component: `remotion-engine/src/episodes/shared/EpisodeShotQaPreview.tsx`.
The root registry includes one additional `AT-EpisodeShot-QA` composition. No existing EP001 component source, imports, IDs, timings, media, scripts, approved snapshots or assets have been changed. The deployed `media-os-render-worker` stays on `main`, so **this new composition is not yet available on the running worker**. No live render claims or media were produced by this task.

This composition is intentionally QA-only, with a visible on-video QA watermark. It cannot generate the final cinematic architecture diagrams for EP002. The actual new episode must receive its own Director-reviewed shot-level Remotion visual plan and production composition/asset manifests before release.

## Automated verification

- Three initial integration tests against a disposable PostgreSQL 16 database check queued render manifest and audit, idempotency, disabled flags and lack of Director identity, and rejection of missing Script/Scene/Shot/Voice locks.
- A separate regression verifies the immutable EP001 UUID is explicitly rejected without queuing any QA composition.
- `Dockerfile.security-ci` now includes Remotion's existing `build-typecheck-preflight.mjs`, which accepts only the documented EP001 baseline diagnostic and fails on any new TypeScript error. Java 21/Maven, frontend build/Vitest and the existing offline Python test suite run in the same test-only Docker build.
- The first full code build passed **213 Java tests, 0 failures, 0 errors**, with 103 Flyway migrations, frontend/Vitest and zero new Remotion TypeScript errors.
- A separate follow-up build including the new EP001 immutability regression passed **214 Java tests, 0 failures, 0 errors, 0 skipped**; full Docker build SUCCESS. Verified code commit `f336bc3a1146427c6cc880350b9475460b866447`, temporary Railway build-only service `mediaos-episode-shot-qa-intake-ci-pr110-temp`, deployment `940307a3-a4dc-42d4-bd5e-775fb95a71eb`. Includes PostgreSQL 16 with 103 migrations, Remotion typecheck, Node syntax, frontend build/Vitest and offline GPU Python regression. GPU remains out of scope.
- EP001 is explicitly rejected before any database mutation; no protected episode is used as a test fixture.

## Remaining gates

1. Review the new QA composition as a **technical diagnostic**, not final video creative.
2. In a fully isolated, Director-approved HTTPS QA application + disposable PostgreSQL, use synthetic EP002-like data to validate actual CPU worker claim → progress → complete → render retrieval, without real EP001 inputs.
3. Build genuine episode-neutral Remotion visual asset/shot composition plans and validated audio delivery for new episodes. A green storyboard proof does not equal a completed episode.
4. Verify browser session/MFA/CSRF in iPhone Safari separately; no emulator-only claim of real-device success.
5. Restrict production release to a separate approved pull request stack, migration/backup/restore rehearsal and explicit Director sign-off. Do not enable the QA-only endpoint on production.
6. **GPU / Runpod remains out of scope.** The existing Railway Remotion CPU rendering worker is our current renderer.

**No permanent QA service, production deployment or EP001 source/data modification is authorized by this document.**


## Director HTTP boundary verification — 2026-10-31

- Added `LocalDirectorHttpLifecycleTest.shotQaRenderRouteRequiresDirectorSessionAndCsrf` with a disposable Local Director login and a probe controller using the exact new `POST /api/v1/episodes/{episodeId}/shot-revisions/{shotKey}/render-qa` **route shape**.
- It verifies an anonymous POST with valid CSRF returns **401**, an authenticated Director POST without CSRF returns **403**, and an authenticated Director POST with valid CSRF is authorized. This checks the **HTTP security route**, not the real controller's database write; the separate `EpisodeShotQaRenderIntakeTest` covers the business rules and PostgreSQL inserts.
- A first attempt used a pre-encoded space in the MockMvc URI and incorrectly double-encoded it, causing the probe to fail before it reached Spring MVC. The test URL was corrected to a safe `SHOT-01` probe segment, without changing production authorization logic.
- **Verified code commit:** `e5641e0768bbc0cf2d00095cdf93243d78246840`. Isolated Railway build service `mediaos-shot-qa-route-ci-pr110-temp`, deployment `6eb561ad-e1ac-4802-8dc5-d99e1baaed38`: **215 Java tests, 0 failures, 0 errors, 0 skipped**, Maven SUCCESS on disposable PostgreSQL 16, including V1–V103; frontend 12 Vitest tests; Remotion typecheck with zero *new* diagnostics. The final image has no running backend or database.
- Local authentication and QA render intake remain disabled on existing QA/production. EP001 remains immutable and no live media generation has been performed.
