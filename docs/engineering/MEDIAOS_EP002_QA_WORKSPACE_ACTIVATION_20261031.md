# MediaOS — EP002 QA workspace activated with source-bound Research DRAFT

**Date:** 2026-10-31  
**Environment:** Isolated Railway `MediaOS-Shot-QA-20261031`, not production  
**Episode ID:** `95b8a4a2-728e-47fe-ad4c-a16748773588`  
**Episode number:** `EP002`  
**Episode title:** *Why Login Fails Even When the Server Is Healthy*  
**Current episode status:** `DRAFT`  
**Direct browser route:** https://qa-media-os-backend-qa.up.railway.app/#/episodes/95b8a4a2-728e-47fe-ad4c-a16748773588/prepare

## Canonical Director source preserved

- Source of truth: **EP002 Full Script Pass v4.0**, 11 Director-locked shots and separate 2026-10-31 explicit full-script Director approval.
- Exact narration assembly: `docs/episode-memory/plans/2026-10-31-ep002-full-script-v4-0-11-shot-director-lock-assembly.md` pinned at commit `4b964a950f7c0a449483a28151ceeed18a9d0aff` on the `feature/ep002-director-shot11-script-lock-package-20261031` branch.
- Final creative approval event: `docs/episode-memory/events/2026-10-31-ep002-full-script-pass-v4-0-director-lock.md` in that feature branch.
- This QA registration **does not modify** the exact English narration, original Director visual choreography, or any EP001 assets.
- GitHub **creative Director LOCK** does **not** imply a native MediaOS production-stage LOCK. No stage approval was copied or invented.

## Real native episode creation verification

Using the existing QA Director bootstrap identity through a one-time Railway Function, via ordinary HTTPS and Spring CSRF/session flow:

1. `GET /api/v1/auth/csrf`: obtained valid CSRF and secure cookies without exposing their values.
2. `POST /api/v1/auth/login`: completed password + TOTP authorization. Credentials and session contents were not logged.
3. `GET /api/v1/episodes`: verified **only EP001** existed before activation; `/next-number` returned **EP002**.
4. `POST /api/v1/episodes`: sent exact EP002 number, approved working title and a source-bound episode brief describing the approved login failure mechanisms. Result **HTTP 200**, episode UUID as above, native `DRAFT` status.
5. `GET /api/v1/episodes/{id}/stages`: verified exactly **seven** stages with no inherited lock:
   - `RESEARCH`: `DRAFT`, revision 0
   - `SCRIPT`, `SCENE`, `VOICE`, `VISUAL`, `QA`, `PUBLISH`: `WAITING`, revision 0
   - Zero `lockedAt` values.
6. `GET /api/v1/episodes`: verified **EP001 and EP002** after creation, no additional episode number.
7. `POST /api/v1/auth/logout` returned HTTP 200. Ephemeral Railway Function deleted with no volumes.

## Research source-bound QA DRAFT: actual API save and verification

Second separate one-time QA Function logged in with QA Director credentials, checked the exact new EP002 UUID, confirmed the Research stage was still `DRAFT` revision 0 and none of the seven stages were locked. It then performed `POST /api/v1/episodes/{id}/stages/RESEARCH/draft`, **HTTP 200**. A follow-up read verified:

- Research stage `READY_FOR_REVIEW`, **revision 1**, `lockedAt=null`.
- Research draft contains `centralQuestion`, `viewerPromise`, **ten** `truthMap` entries sourced only from the approved EP002 script, explicit `outOfScope` items, `technicalSources` pointing to the immutable English assembly and the Director GitHub lock, and `unresolvedQuestions`.
- Preserved the explicitly illustrative throughput/arrival rates, 8-connection Auth pool, distinct Requests A/B, bounded read-only retries, scale-out bottleneck, mitigation and SLI/SLO claims from the Director script.
- The Research draft states the original Director `EP002_Research_Truth_Map_v0_4.md` was named but **not independently read or validated** by this operation. The approved script is the provenance for the draft; this is **not** independent fact-checking.
- No language model re-generation, script rewrite, provider voice generation, stage LOCK, scene creation, shot revision, render queue entry, producer deployment or EP001 modification.
- Function logout returned 200 and its temporary Railway service was deleted after confirming a successful draft write.

## Exact next Director action

Open the MediaOS QA preparation page above and review **Research / Truth Map**, revision 1. Verify the ten example-specific truth statements and approve/lock Research **only if** satisfied with the scope and referenced sources. The review is a genuine Director decision and must not be simulated with automation or translated into a false approval.

After the Director Research LOCK exists in MediaOS:

1. Import **verbatim** Script Pass v4.0, 11 shots, into native `SCRIPT` DRAFT (not a new AI-generated script).
2. Require Director review/LOCK of the imported SCRIPT artifact (do not silently assume GitHub creative lock is enough).
3. Import and review original EP002 visual choreography into `SCENE` DRAFT and obtain separate Director review/LOCK.
4. Import shot revision material, obtain native shot/voice approval and a genuine approved Voice Take. **Do not create an audio approval by inserting a fake row** or spend ElevenLabs credits without a properly scoped voice-generation action.
5. Then test real authenticated `AT-EpisodeShot-QA` render intake through the queue and worker → progress → MP4 completion → secure video retrieval. Keep all test media separate from EP001.

## Production gate remains closed

No production deploy or production DB writes were done. Still pending: real full QA approved render acceptance, renewable scoped worker credential process, real mobile Safari login acceptance, production-schema-copy Flyway upgrade + backup/rollback rehearsal and Remotion npm advisory resolution or audited acceptance. Existing QA worker credential is temporary and expires **2026-11-01 07:40:36 UTC**; a later QA render requires secured reissuance/rotation.

**Result:** EP002 native QA workspace created, Research revision 1 `READY_FOR_REVIEW`; all Director stage and voice locks still explicitly ungranted.
