# MediaOS — Episode Package Voice Studio v1

**Date:** 2026-11-04 (Europe/Sofia)
**Status:** Code candidate, subject to current Railway Java21 Maven tests, frontend build and Flyway V115 runtime verification.
**Director approved workflow:** One approved full-episode JSON file → source-only import of all SHOT records → Director-managed editable working narration and selected voice per SHOT → **all-voice preflight** → **separately consented bounded OpenAI API** → multi-SHOT visuals. Never charge AI/TTS merely because a file or plan exists.

## What this implementation adds

- PostgreSQL **V115** adds append-only `episode_package_shot_revision` (v1 seeded for all previously imported package SHOTs and newly imported ones), `episode_package_voice_take` (original audio bytes, real ElevenLabs alignment, TTS model and voice, ffprobe-measured duration where available), `episode_package_voice_choice` (versioned Director take choice history), and `episode_package_voice_request` (durable one-attempt ledger: `IN_FLIGHT`, `COMPLETED`, `UNCERTAIN`). One unresolved attempt per SHOT enforced at DB level.
- Existing imported `episode_package_shot.original_narration` and `original_voice_direction` are **immutable** and never updated; the working revision changes on Save. Narration may be up to 12,000 source characters to match Episode Package v1, but single paid ElevenLabs attempt is strictly limited to 5,000 characters.
- New `EpisodePackageVoiceStudioService` reuses **existing** `ElevenLabsTextToSpeechService` TTS with its timestamp API, existing EP001 voice/model identity guard, and the approved EP001 v4 delivery tag. It stores alignment as returned; a local ffprobe probe measures duration when possible (missing/invalid duration is explicitly reported). Voice direction is **editorial metadata**; it does **not** override ElevenLabs v4 delivery settings. It does not claim identical accent or timing with EP001.
- New Director-authenticated `GET /api/v1/episode-packages/{packageId}/shots/{shotKey}/voice`, `PUT .../script`, `POST .../generate`, `POST .../approve`, `GET .../takes/{takeId}/audio`; mutable actions require audited creation preflight, exact working revision, actor and package/SHOT membership. Cross-package/EP001/EP002 mutations not supported.
- The Episodes → Import Episode Package screen now expands each SHOT to **Open Voice Studio**. A Director may Edit/Save narration and delivery instructions, inspect all saved current/older take versions, listen with native audio controls, explicitly approve a take of the **current** script revision, and view paid spend safety status. Script revision change invalidates prior take **selection for current revision** while preserving old versions/audio.
- Imported episode overview shows derived per-SHOT statuses based on current choice/takes; it never blindly reuses the stale initial `PENDING_VOICE` column.
- **Paid Generate is default server disabled:** `mediaos.episode-packages.voice.writes-enabled=false` unless separately explicitly enabled in Railway. Even when enabled, the UI requires an opt-in checkbox **and a final confirmation**, and the server requires `confirmPaidElevenLabs=true`, current revision+SHA and a unique UUID. A ledger reservation is committed *before* provider network dispatch. Unresolved/uncertain failures **never auto-retry**. Four-take-per-SHOT safety ceiling. The UI does not call TTS on mount or when editing a script. Approval requires explicit `DIRECTOR_APPROVE` and has no paid provider call.

## Implementation boundaries

- Importing a package is free of third-party API charges. Clicking **Save** or **Approve** does not spend TTS/AI credits. Clicking Generate could incur ElevenLabs charges **only** after server paid gate enablement and direct Director consent.
- No OpenAI visual agent, GitHub agent branch/PR executor, automatic frame rendering, auto Voice Readiness release, auto assembly or new worker deployment in this PR.
- `VOICE_APPROVED_TIMING_REVIEW_REQUIRED` is a *preparation* status. Selecting a take does **not** yet assert full episode readiness, proper cue mappings, identical accent to EP001 or permit Multi-SHOT execution. Alignment metadata and measured duration are evidence to feed the next guarded readiness preflight.
- The old EP002 voice code and historical `UNCERTAIN` Take 1 alignment attempt remain untouched. EP001 approved components and SHOT01 v3 visual remain LOCKED.
- **No GitHub Actions.** Build/test using existing pinned Railway backend Docker build; do not create a permanent QA environment.

## Post-build verification and next

Record exact Java21 Maven test totals, frontend TypeScript/Vite PASS and Railway Flyway V115/startup success in `PROJECT_STATE.md`. Do not mark Director end-to-end browser voice QA as completed: browser Save and paid TTS must be manually tested by Director; no paid calls are authorized in this code deployment.

**NEXT:** Episode-wide Voice Readiness dashboard/gate with strict current-revision take, measured duration, timestamp/anchor matching, blocked uncertain paid attempts and narrator continuity A/B. Then independent finite OpenAI API budget approval before implementing all-SHOT Agent Executor.
