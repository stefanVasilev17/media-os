# MediaOS Shot Revision Agent — Director QA Draft

## Director request
Episode -> Director -> specific SHOT -> Revision Chat (AI ON/OFF) -> review narration + voice + visual direction -> explicit Director LOCK -> updated per-shot Voice/Video handoffs. EP001, EP002 and EP003 are separate by episode ID; never mix assets or approval states.

## Design and data contract
- New isolated `episode_shot_revision` and `episode_shot_revision_message` tables in V88.
- The canonical episode SCRIPT is **not modified**, and old locked audio and video binaries are **not overwritten**.
- A proposal is always a `DRAFT`; each edit gets a new monotonically increasing revision.
- Only the current DRAFT may transition to `LOCKED` after a Director typed approval note and `decision=DIRECTOR_APPROVE`.
- A revision LOCK becomes effective for the selected shot's Director, Voice and Video **read surfaces**. The previous voice and render remain archived and approved as historical media; current-workflow badges move to PENDING because the new content has no new approval yet.
- EP001 old generators remain isolated: untouched shots open normal EP001 agents; revised shots open the new scoped read-only handoff, not an old generator with stale text.
- EP002/EP003 only show data registered in their own MediaOS episode workspace. No invented shot rows or cross-episode imports.

## AI OFF
- All edits and chat notes are stored locally in the selected episode/shot.
- Saving a DRAFT and publishing a LOCK are separate explicit actions.
- No paid OpenAI requests happen from AI OFF.

## AI ON
- Uses the configured OpenAI API via `OPENAI_API_KEY`, not the ongoing ChatGPT conversation's private state.
- An explicit AI ON toggle does **not** itself spend credits.
- Preview issues a short-lived single-use authorization bound to episode UUID, shot key, upstream SCRIPT revision, current draft revision and exact prompt.
- A separate confirmation runs one model call; the global MediaOS Paid AI flag must also be ON. Usage is recorded.
- Result is a complete narration, voice direction and Remotion direction **DRAFT**. Model output cannot LOCK.
- New text should be checked against Production Memory and story truth before Director approval.
- No automatic TTS or Remotion render on LOCK.

## Acceptance tests
1. Open EP001 SHOT 12 Revision Chat. Verify it reads EP001 only.
2. AI OFF: save note, create manually edited narration/voice/video draft; no AI ledger debit.
3. Before LOCK: original Voice and Video approvals/statuses unchanged; new draft is orange.
4. Director LOCK with a meaningful approval note: new text/visual instructions visible on scoped Voice/Video; statuses orange Pending; no existing approved audio or render deleted.
5. Existing EP001 unrelated SHOT 11 statuses remain unchanged; EP003 never loads EP001 content.
6. AI ON preview: zero OpenAI tokens, no generation. Toggle back OFF: pending authorization no longer actionable in UI.
7. AI ON confirm: requires global Paid AI ON, configured OpenAI key, valid single-use token and preflight; no duplicate free model calls.
8. Modify prompt or revision after preview: model run rejected. Replayed token rejected.
9. Try to lock a stale revision or without Director approval note: 409 / 400; no handoff mutation.
10. Re-edit a previously locked shot: previous approved revision remains available until a new DRAFT is explicitly locked.
11. Test narrow-screen chat and revision editor. No automatic generation on route navigation.
12. Verify Flyway V88, Java 21 tests and frontend TypeScript/Vite build.

## Release limits
- **PR #100** episode-scoped core and **PR #101** episode-first Director must be reviewed before this stacked PR merges.
- **Default episode writes remain disabled**, protecting production until Director authentication and migration rollout are approved.
- Full episode-aware ElevenLabs Generation, Remotion render, post-render QA and reapproval are a *follow-on dependency*: revised source appears in Voice/Video read screens now, but those screens do NOT yet regenerate/lock media.
- Full integration tests and physical QA are pending; this is not production-complete.
