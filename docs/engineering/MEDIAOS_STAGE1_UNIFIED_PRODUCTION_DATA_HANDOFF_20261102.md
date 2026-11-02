# MediaOS — Stage 1 Unified Production Data: Implementation Handoff

**Date:** 2026-11-02
**Roadmap:** [Director-LOCKED MediaOS Roadmap v1](MEDIAOS_ROADMAP_V1_DIRECTOR_LOCK_20261102.md)
**Status:** Implemented and deployed; **final Director session/browser verification outstanding**. Do not mark Studio visual generation or scene-code production as completed.

## Production evidence

- PR [#134](https://github.com/stefanVasilev17/media-os/pull/134) merged as commit `54dc95123f72724ce65bfe80d92502869006202d`.
- Backend Railway production deployment `33dbeb29-b116-4155-bda3-0fa68d8d5eb1` reached **SUCCESS**; Render Worker remains **SUCCESS**.
- Frontend Vite+TypeScript production build passed; backend Maven **264 tests, 0 failures, 0 errors, 37 skipped**.
- PostgreSQL Flyway **V108** successfully applied without changing EP001 creative data.
- **No** ElevenLabs generation, new paid request, render queue submission, or unreviewed code execution was initiated.

## Canonical contract endpoint

Authenticated GET:

`/api/v1/creative/episodes/EP002/shots/SHOT01/production-contract`

Also implemented for SHOT02–SHOT11. Direct MediaOS UI:

`https://media-os-backend-production.up.railway.app/#/library/EP002`

The new **Unified Production Data** panel appears within each SHOT and auto-refreshes after narration Save, ElevenLabs Generate and preferred voice take selection.

## Contract shape

- `contractVersion: EPISODE_SHOT_PRODUCTION_V1`; `episodeKey: EP002`; canonical `shotKey`.
- `script`: latest stored Creative Draft version + narration + voice direction + SHA-256; if no saved draft yet, the original immutable v4.0 English narration is shown as revision 0 (not a generated or saved draft).
- `voice`: explicitly selected current-revision take ID, voice/model, playable audio URL, **ffprobe-measured** duration when available and truthful provenance/status when missing. No voice selected means no validated render dependency signature.
- `visual`: source-pinned Director-approved **new** v1.0 Visual Pass, all per-SHOT beats, camera/assets, continuity guardrails and transition. The 11-shot source inventory validates to **59 beats**; SHOT01 has **5**. The original missing v4.0 timed visual tables are NOT claimed to be recovered.
- `visual.editorialDurationSeconds` and `visual.editorialWindow` are **planning values**, not observed audio durations. `beatTimingAuthority = EDITORIAL_ONLY_NOT_AUDIO_ALIGNED`: no fabricated word or cue timestamps. If narration differs from the original source, `cueReviewStatus = REVIEW_AFTER_NARRATION_EDIT`.
- `dependencies.dependencySha256`: content hash computed from episode, SHOT, current script revision/text SHA, chosen take ID and approved visual source SHA. A different script revision/take invalidates the prior render-match key.
- `render`: current matching lineage only; `NOT_RENDERED` and null references when none exists. No fake completed videos.

## Database changes

- `ep002_creative_voice_take.duration_seconds` stores lazily measured metadata without changing the audio bytes or selected take.
- `episode_shot_render_lineage` is a new indexable registry reserved for the Stage 3/6 rendering workflow. Stage 1 does not create lineage entries or render jobs.
- Approved source artifacts copied as immutable backend resources: `backend/src/main/resources/episode-production/ep002-locked-script-v4.json` and `ep002-approved-visual-source.json`. The visual resource retains the pinned Git blob SHA `5c43c7fd3bd66b5899f0956a9cfd80bdead834f1`.

## Follow-up / next gate

1. Director opens EP002 SHOT01 in the existing MediaOS page, expands **Unified Production Data** and checks that current saved script revision, preferred take, *actual measured audio duration* and five beats match real authored data.
2. If no preferred take exists, the contract honestly says `WAITING_FOR_PREFERRED_VOICE`; do not generate audio automatically.
3. **Stage 2** adds the typed, safe `Remotion Scene Contract` mapped from this unified production contract. Do not yet send arbitrary generated TSX to the render worker.
4. **Stage 3–4** build/render EP002 SHOT01, then implement feedback → versioned Remotion code change → test → incremental re-render → preview in MediaOS.

## Non-goals and guardrails

The current endpoint does not make creative LOCK/UNLOCK necessary, does not overwrite EP001 or EP002 locked sources, does not claim word-aligned visual timings or newly available videos, and does not authorize production agents to skip repository CI/review. MediaOS + Remotion remains the only active programmatic video pipeline.
