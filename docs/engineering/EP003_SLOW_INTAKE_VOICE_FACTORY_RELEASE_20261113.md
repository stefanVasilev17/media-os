# EP003 — Director-locked Script v0.4 → Real Slow Intake Voice Factory

**Requested by Director:** 2026-11-13. **Intended result:** sign in to MediaOS → Episodes → **EP003: What Happens When One Database Is No Longer Enough?** → auto-prepared, persisted EP003 imported package owned by verified Director → SHOT01–SHOT11 each opens exact approved narration and **ONE paid Generate (slow intake) action** → listen and manually approve the saved Take.

**Production truth gate:** Committed code is NOT evidence the functionality was deployed. Production is READY only after backend frontend Java/PostgreSQL build passes, exact Railway deployed SHA is checked, Director authenticates and sees EP003 with all 11 shots and `canGenerateSlow=true` for an ungenerated SHOT. No user credits spent until they approve one explicit paid call. Voice Directions, HEAR→SEE and visuals are NOT automatically Director-LOCKED.

## Source and identity
- Source: [Director-LOCKED EP003 Script v0.4](../episode-memory/plans/2026-11-13-ep003-script-v0-4-director-locked.md) (main). Exact 11 narration passages, cleaned solely of Markdown emphasis markers for spoken delivery. No speech editing, no missing lines, no added material.
- Bundled backend data: `backend/src/main/resources/ep003-director-locked-voice-package-v1.json`; 11 SHOTs, 33 **editorial anchor suggestions** (NO fabricated frames), three Shorts candidates, natural voice directions. The script is DIRECTOR_APPROVED; the *visual storyline remains VOICE_ONLY_DRAFT* and cannot be falsely presented as visual LOCK.
- SHA-256 source import checks, strict byte-identical bundled source check for EP003 voice-only exception, Director actor identity, audited project-scoped preflight, deterministic idempotent request ID and protected EP001/EP002 native source.
- `POST /api/v1/episode-packages/prepare-ep003` creates the 11 source and voice-job records on first verified Director visit only, with no paid AI/TTS/render. Repeat visits return same original package and never duplicate it; another Director identity cannot claim another person's package.
- Episode selector routes to `#/episode-packages/import?ep003=1`; page prepares package then opens SHOT01. No manual JSON upload.

## Strict first-Take TTS policy
- EP003 Voice Studio does NOT allow editing approved v0.4 narration or show the `STANDARD` paid button.
- Backend `EpisodePackageVoiceStudioService` rejects `STANDARD` for EP003 at generation request and refuses ANY second attempt/Take for the same SHOT even if a UI is bypassed. An uncertain paid request remains unresolved; no re-generation.
- `SLOW_NATURAL` mode requires configured verified creator clone, Eleven v4 provider model, 5000-character limit, original current revision 1 and exact SHA, provider pause plan, authenticated Director, signed-in safe session/CSRF, explicit one-call fee confirmation and one-request UUID. The selected standard profile for EP001/EP002 remains unchanged.
- The approved Take is stored with original audio bytes, real measured duration, ElevenLabs response alignment if available and persisted mode; user listens and explicitly selects. No automatic Take approval and no automatic visual generation.
- New EP003 `Voice Studio` server payment flag `MEDIAOS_EPISODE_PACKAGES_VOICE_WRITES_ENABLED` must be enabled separately only after deployment QA and verified provider mode; without it, intentionally fail closed.
- Script's original 16:35 working timeline does not match its 2,917 words; current placeholder editorial durations ~1322 seconds (22:02) are **planning only**. Do not speed the spoken narration or invent HEAR→SEE timestamps to fit.
- Any changing of the locked script or a replacement Take requires a new version and a new explicit Director decision, never an automatic agent retry.

## Verification and release gates
1. Production branch based on current Railway Backend/Worker release `release/ep002-v4-clean-cut-shot10-20261112`. NO alteration to approved EP002 SHOTs, Worker Remotion source, audio or MP4s.
2. Backend Java21 Maven test including PostgreSQL integration, source preflight tests; frontend TypeScript/Vite build. Verify 11 exact source texts and safe voice-only unapproved visual state.
3. Server-side role and CSRF authorization: `EpisodeFactoryDirectorRoutes` includes EP003 prepare and package voice generation/approval. No unauthenticated or editor-paid path.
4. Deploy BACKEND only from the exact SHA-pinned source using Railway; keep existing Worker on its approved SHA/branch. Respect any predeploy source pin guards, do not alter Worker or other services. Inspect successful backend deploy, Flyway, actuator health, and UI.
5. Read-only inspect `GET .../voice` for first SHOT via authenticated Director; ensure `canGenerateSlow=true`, no prior requests/Takes, `STANDARD` is never offered or accepted. Do not issue a paid TTS call as a test.
6. If a provider-specific model gate, clone identity, paid flag or login authorization fails, report exact blocker and STOP rather than claiming READY or using a standard voice.
7. Director separately authorizes one real Slow Intake paid Take via the visible `Generate (slow intake)` button for each SHOT and listens before approving.

**Explicit limits:** This is not final HEAR→SEE synchronization, visual scene construction, paid voice generation, or a guarantee that ElevenLabs will produce perfect speech on one request.
