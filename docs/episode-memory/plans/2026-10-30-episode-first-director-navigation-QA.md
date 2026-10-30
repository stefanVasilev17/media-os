# MediaOS — Episode-first Director Navigation (QA Draft)

## Director request
Opening MediaOS at its root opens the episode picker. Every registered episode has a separate Director overview; clicking Voice or Video for any SHOT opens only that episode's corresponding workspace. A Director-approved Voice/Video result is green. An unfinished result is orange. Changing episode never carries data from EP001 to another episode.

## Scope of this branch
- Built on top of draft PR #100 episode-aware foundation; does **not** modify deployed `main`.
- `#/ ` (without space: `#/`) and `#/episodes` show the available episode catalog from `GET /api/v1/episodes`.
- `#/episodes/{episodeId}/director` loads server-side `GET /api/v1/episodes/{episodeId}/director-overview`.
- This endpoint validates episode ownership in the current project, reads per-episode stage revisions, and retrieves shot/voice/video state using `episode_id` and current `script_revision`.
- A Voice SHOT is green only when all stored relevant voice clips have `voice_approved_at` (or a single shot's generated voice was approved). Visual SHOT is green only when a `visual_shot_lock` exists. A preview alone never means LOCKED.
- EP001 Voice/Visual deep links use existing legacy routes and explicitly carry `episodeId` and `shot` (e.g. `#/agents/voice?episodeId=22222222-2222-2222-2222-222222222222&shot=SHOT+12`). Visual Agent now honors that shot selection during initialization.
- Non-EP001 Voice/Video links go to a separate isolated screen. There is deliberately **no cross-episode generation** via legacy EP001 API.
- Non-existing episode numbers are not fabricated; they appear in the picker only after an audited creation workflow registers them.

## Manual acceptance tests
1. Open `#/`: see episode selection, not legacy EP001 Director.
2. Click EP001: Director title/shot rows reflect only EP001. Select VOICE SHOT 12: EP001 Voice Agent shows SHOT 12.
3. Select VIDEO SHOT 12: EP001 Visual Agent shows SHOT 12, without starting a render or automatically locking anything.
4. If Voice SHOT 12 is approved, its Director badge is green; if Video SHOT 12 is not Director-locked, its badge is orange. Pending preview renders are not green.
5. Return to Episodes, select a registered EP003: show only EP003 stages/shots, never EP001 voice or video. If EP003 has no script/shot records, show an explicit empty state, never fabricated rows.
6. Directly open a legacy URL carrying an EP003 episodeId: route guard shows episode picker rather than loading EP001 data.
7. Verify existing EP001 generated voices, rendered videos, approved assets and lock rows are unchanged.
8. Verify episode context survives bottom-nav navigation.
9. Test narrower mobile widths; all statuses have text/icons as well as color.
10. No legacy voice render, approve, lock, regenerate or paid ElevenLabs request is run merely by opening Director/episode list.

## Pending platform work before activating production EP002/EP003 Voice/Visual generation
- Dedicated episode-scoped Voice/Visual APIs, audio/render storage, validation and Director LOCK workflow.
- Explicit Director authentication and authorized episode creation, required audit preflight gates.
- End-to-end QA against real EP001 data and newly created EP002/EP003 test workspaces.
- PR #100 remains DRAFT, not deployed. This work must be reviewed and integrated in order; no production rollout or database writes performed.
