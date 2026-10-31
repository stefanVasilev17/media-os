# MediaOS EP002 — Source-Exact Native SCRIPT Draft Import

**Prepared:** 2026-11-01. **Environment:** QA only. **Native episode:** EP002 `95b8a4a2-728e-47fe-ad4c-a16748773588`. **EP001:** protected.

## Objective and editorial authority

Transfer the approved **Director Full Script Pass v4.0** into the native episode-aware MediaOS `SCRIPT` stage as a DRAFT for separate review. Do **not** generate a second script, change words, invent new visual choreography, spend any ElevenLabs/AI credits, or apply a native `DIRECTOR LOCK` in the import step.

**Exact source asset:** `frontend/src/data/EP002_FullScript_v4_0_LOCKED.json`, a byte-for-byte copy from `docs/episode-memory/voice/EP002_FullScript_v4_0_ElevenLabs_VoiceInput_LOCKED.json` on GitHub branch `feature/ep002-director-shot11-script-lock-package-20261031`. Source Git blob SHA **`e0f8ee8b9c7c22bd7b9947c2cba40b1072a440d0`**. This manifest is the accepted approved voice narration input, separate from the full Director v4.0 choreography reference. The 11 immutable narration strings, per-shot original editorial times/revisions and word count are preserved; all audio statuses remain ungenerated.

**Validation contract:** 11 SHOT 01–11; **1948** original approved words; **810 seconds (13:30)** total editorial target; original `englishNarration` transferred byte-for-byte to native `timeline[].narration`. Stable `shotKey`, original `directorScriptRevision`, `title`, `editorialStart`, `editorialEnd`, `editorialDurationSeconds`, `wordCount`, `voiceDirection` and `audioStatus` are preserved. No word-level voice alignment exists.

## Implementation

- `frontend/src/lib/ep002LockedScriptImport.ts`: pure deterministic payload builder that fails closed on provenance and shot count/timing/word count mismatches; never calls paid AI.
- `frontend/src/lib/ep002LockedScriptImport.test.ts`: every original narration string and editorial metadata compared against the checked-in approved source.
- `frontend/src/api/episodePreparationApi.ts`: invokes pre-existing authenticated, CSRF-protected, audited `POST /api/v1/episodes/{id}/stages/script/draft`, with `expectedRevision=0` and full immutable `artifact.timeline`; does not invent an API or bypass `GlobalCreationPreflightFilter`.
- `frontend/src/pages/EpisodePreparationPage.tsx`: renders **Import approved EP002 Script v4.0 (no AI cost)** only when `episodeId` is exact QA EP002 ID, `SCRIPT` is active with revision 0, and native `RESEARCH` is already `LOCKED`. The button is a real Director-authenticated click. No automatic write happens on visiting the page.

## Expected Director procedure

1. Open https://qa-media-os-backend-qa.up.railway.app/#/episodes/95b8a4a2-728e-47fe-ad4c-a16748773588/prepare in the already-authenticated personal Safari instance.
2. Under Script click **Import approved EP002 Script v4.0 (no AI cost)** once. Do **not** use Generate Draft (paid AI).
3. Verify 11 timeline entries, English original narration preserved, stage `READY_FOR_REVIEW`, revision 1. Do not claim this happened until observed by a follow-up QA read.
4. Director personally compares original narration and chooses `Review & Lock` with meaningful approval note. Only the Director's actual click may create a native `SCRIPT LOCK`.
5. Next `SCENE` draft requires visual choreography from Director v4.0; the locked narration manifest itself must **not** be mistaken for full visual directions.

**Production safety:** QA only; never change EP001 or production; no paid generation. Passing automated frontend tests or successful QA deployment alone does **not** mean the user already imported a draft or issued a LOCK.
