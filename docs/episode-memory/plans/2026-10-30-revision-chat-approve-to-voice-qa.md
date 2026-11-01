# MediaOS — Chat proposal → Approve → ElevenLabs Voice production (QA draft)

## Intended Director experience
1. Open MediaOS → select episode → Director Overview → select a SHOT → Revision Chat.
2. Turn AI ON, request a change to an excerpt in plain Bulgarian.
3. Preview the charged model request and confirm it. Chat displays the AI reply **and the complete proposed English narration**; an editable draft also appears in the review panel. No old script is overwritten.
4. Click **Approve → Open Voice** under the AI reply. Backend performs an explicit Director APPROVE / LOCK for the currently saved DRAFT and redirects to the same `episodeId + shotKey` Voice Agent. Unsaved edits must be saved before approval.
5. Voice Agent loads the exact locked revision's narration and displays approved voice direction. Only an explicit **Generate with ElevenLabs** action can spend TTS credits.
6. Listen to each generated take, then select **Approve Voice Take**. The approved take gets the green Voice LOCKED badge for precisely that shot revision.
7. An old approved recording from an earlier shot revision is never counted as the current Voice LOCKED result. A newer approved script needs new audio.
8. Video remains pending until a later Remotion production integration; voice approval does not approve video or render.

## Data and backend
- New V89 table `episode_revision_voice_take` with episode+SHOT+revision foreign key, take number, binary audio, alignment and approval timestamp.
- `GET /api/v1/episodes/{episodeId}/shot-revisions/{shotKey}/voice` reads the effective script and available takes.
- `POST /.../voice/generate` validates current Director-LOCKED revision and MediaOS write feature gate, then calls existing configured ElevenLabs service. On completion, a transactional revision check prevents stale audio from being attached after a newer LOCK.
- `POST /.../voice/approve` approves a selected take only for the exact active shot revision, with an audited creation preflight and Director APPROVE decision.
- `GET /.../voice/takes/{takeId}/audio` serves an audio clip only for its episode/SHOT.
- Audio files, alignment and legacy EP001 approvals are **not changed** by this flow.
- Director Overview uses only a take approved for the active revision as green; stale media never qualifies.
- Video still reads the approved revised narration/visual direction as a handoff, but no Remotion generation is claimed by this PR.

## Release gates and manual QA
- Dependencies: PR #100 → PR #101 → PR #102 → this PR #103, **all Draft** until each passes review.
- Default `mediaos.episodes.writes-enabled=false` remains unchanged.
- Confirm Director authentication/authorization gates and production preflight before enabling writes.
- Verify chat answer includes full revised English narration and button, and a modified unsaved editor disables Approve.
- Verify correct `episodeId`, `shotKey`, and revision on redirect, generation, audio retrieval and approval.
- Verify double-approval blocked and old voice take can still be listened to but cannot be approved as current after newer revision.
- Verify at least one real ElevenLabs test shot in non-production environment, with QA for pronunciation, content hash and audio alignment.
- Confirm there are no automatic AI, TTS, or Remotion calls on navigation or Director LOCK.
- Run Java 21 backend tests, frontend TypeScript/Vite build, and exact episode-aware integration tests.
- Check the storage cost of retaining versioned audio. Current implementation stores binary takes in PostgreSQL; production may later move to object storage with audited integrity.
- No current claim that the new UI is deployed, CI-approved, or complete for Remotion.
