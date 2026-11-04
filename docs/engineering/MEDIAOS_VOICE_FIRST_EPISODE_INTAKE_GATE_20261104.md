# MediaOS — Voice-first Episode Package and explicit AI execution gate

**Director decision: 2026-11-04 (Europe/Sofia).**
**Scope:** A binding product sequence for future episodes, recorded before implementing the Multi-SHOT Agent Executor. This is a design/acceptance contract, **not a claim the universal importer or multi-SHOT executor is implemented**.

## Exact Director workflow (do not reorder)

**Phase 0 — Director + ChatGPT, outside MediaOS:** Collaboratively create ONE final machine-readable **MediaOS Episode Package** with Director-approved script + complete cinematic visual storyline. The package is the original content truth for the episode. Schema: [`mediaos-episode-package-v1.schema.json`](../contracts/mediaos-episode-package-v1.schema.json). It has all shots, narration, voice direction, HEAR → SEE beat cues, assets, camera, transitions, style references and 3+ Shorts candidates. No actual voice takes or provider credentials are included.

**Phase 1 — Import, validation and shot preparation, NO paid calls:**
- Director uploads the single file in MediaOS. Backend validates JSON schema, contiguous `SHOT01…SHOTNN` order, shot/beat counts, narration and anchors, Shorts references, episode identity, allowed extensions/size, uniqueness and source integrity; reject incomplete packages. Treat content as untrusted instructions for display, not commands to execute.
- Store file bytes/hash, source provenance and an immutable imported content revision. Create editable working narration and visual plan records for ALL shots in one operation. Preserve the original Director-approved file as immutable archival source; allow later working revisions without forced content LOCK/UNLOCK.
- Display all shot narratives, voice instructions and visual storyboards in the Episode Workspace. Import should **not** call OpenAI API, ElevenLabs API, GitHub, Remotion worker or Railway deploy.
- Imported file acceptance is a **source approval**, NOT authorization for agent code generation, video rendering or third-party spending.

**Phase 2 — Voice Studio, Director-managed, no OpenAI visual-agent execution:**
- MediaOS automatically prepares the voice **tasks** for all shots, NOT the paid audio files. Show a voice overview for the entire episode (pending / generated / selected / approved). Director chooses one or more shots and explicitly confirms any ElevenLabs **paid Generate/Regenerate**; editing and Save incur no provider cost.
- Director plays takes, adjusts narration and voice direction, regenerates only when explicitly paid-approved, selects/approves preferred take tied to the precise saved narration revision. Existing approved takes cannot be silently overwritten.
- Preserve original ElevenLabs character timestamps when returned; measure audio duration via existing ffprobe/metadata, map HEAR → SEE to measured cues only when evidence is available. **Never fabricate word timestamps** or run paid Forced Alignment without separate permission.
- Narration consistency is a real review gate: use the same approved narrator identity/settings and allow an A/B check against EP001 final audio where relevant. EP002 prior accent/dialect mismatch is not resolved merely by selecting a take.
- Status `VOICE_READY` requires **every active shot** has a Director-approved take of the **current script revision**, measured valid duration and an explicit timing-readiness status; exact cue alignment needs sufficient real evidence or must be separately reviewed/marked blocked. Selected but unapproved, stale, missing or uncertain recordings **block** visual agent dispatch.
- The Director can freely edit a working shot later; that invalidates the affected voice approval and pending production authorization. Unrelated approved shots remain reusable.

**Phase 3 — Episode-level Director release gate:**
- When all voices are ready, MediaOS enables `Review for Visual Production` but does **not** start anything.
- Director sees the full snapshot: imported source hash, shot count, approved narration revision/Take ID/durations/cue status per shot, canonical visual source, asset gaps, code scope, estimated OpenAI token budget and max spend, and separate Railway CPU rendering budget (which may be deferred).
- Director explicitly presses **`Authorize AI Visual Production`**, with a finite per-run OpenAI API USD cap, target shot set, immutable episode-input fingerprint, bounded number of agent attempts and expiry. **No authorization is inferred from file import, selected voice, voice approval or Prepare Batch Plan.**
- This consent authorizes **proposal generation only** within the specified budget and repository allowlist. Code merge/deployment remains a separate review gate; rendering and any ElevenLabs calls each need their own explicit spend approval.
- The authorization is **consumed once** and cannot silently reactivate for stale inputs, failed jobs or a revised script/voice. Cap exhaustion stops execution and asks for Director re-approval.

**Phase 4 — Multi-SHOT Agent Executor (OpenAI API tokens only after Phase 3 release):**
- Executor consumes the **snapshotted, approved Episode Package + voice manifest**, dispatching bounded batched jobs for all unbuilt/changed shots, not requiring the Director to select SHOT02/03/etc one by one.
- Plan dependencies and reusable EP001/EP002 components; generate Remotion TSX and tests on a controlled GitHub branch/PR, verify scopes and protected LOCKs, run build/tests **without GitHub Actions** and present batch diff/results for Director review.
- Existing Director-LOCKED EP002 SHOT01 remains unchanged unless explicitly reopened. Never overwrite approved canonical EP001 components or archived episode sources.
- Incremental preview render requires its own explicit Railway CPU spend consent; reuse unmodified renders and transitions. Subsequent Director notes generate bounded patch proposals instead of full episode re-generation.
- Assemble the complete episode and three or more Shorts only after required approved material exists; return master preview for explicit Director QA/LOCK. Never mark whole episode approved from automatic checks.

## Required persisted states and blockers

The importer and voice flow should expose:
`SOURCE_FILE_UPLOADED` → `SOURCE_VALIDATED` → `SOURCE_ACCEPTED` → `VOICE_TASKS_READY` → `VOICE_REVIEW_IN_PROGRESS` → `ALL_VOICES_APPROVED` → `AWAITING_AI_BUDGET_APPROVAL` → `AI_EXECUTION_AUTHORIZED` → `AGENT_BATCH_PROPOSALS` → `DIRECTOR_CODE_REVIEW` → `RENDER_AUTHORIZATION_REQUIRED` → `RENDERING_CHANGED_SHOTS` → `EPISODE_REVIEW` → `DIRECTOR_FINAL_APPROVAL`.

Source import approval and voice approval are independent. Backend must reject agent-dispatch POST unless:
1. Imported package has immutable approved script and approved complete visual plan (all shots/anchors present).
2. Each active shot has a current-revision approved, measured voice take, with defensible cue timing readiness for any required event.
3. Current immutable episode fingerprint matches authorized one; any changed narration, selected voice, visual plan or renderer/asset revision invalidates the affected authorization.
4. A unique unexpired Director execution authorization explicitly permits OpenAI API use within a specific finite budget/attempt cap; consumption is auditable and fail-closed.
5. Safety checks protect `SHOT01` Director-LOCKED visual source, GitHub allowlists, source provenance and historical render data.

## What currently exists and what must be built

**Already verified before this design:** EP002 original approved Script v4.0 (11 shots), Visual Pass v1.0 (59 beats), editable per-shot Creative Voice (Save/Generate/Approve), preferred voice choices and measured audio integration, Stage 4 single-SHOT Director feedback intake, EP002 whole-episode Batch Planner v1 (PR #165, PostgreSQL V113), approved SHOT01 Remotion preview and worker.

**Not implemented:** general Director file upload → dynamic episode import, universal generated shot/beat records for EP003 onward, episode-wide voice preflight gate and execution authorization, OpenAI API budget/attempt controller, multi-SHOT agent executor and task queue, automatic incremental render and complete film assembly. Existing `Ep002EpisodeBatchPlanService` reads two fixed EP002 classpath files; its `Prepare all 11 SHOTs` is a **non-executing plan snapshot**, not the new universal import or a token-spending action. Do not misrepresent it as a generic importer.

## Revised immediate engineering order

**Before** connecting any OpenAI API Agent Executor:
1. Implement **universal Episode Package import/validation**, with source archive, immutable SHA and dynamic episode/shot/beat records (no per-episode Java code).
2. Implement **episode-wide Voice Readiness Overview + current-version approval/timing preflight**. Reuse existing ElevenLabs voice actions, no second voice engine.
3. Implement **explicit Director AI execution authorization and finite cost envelope**, with hard server-side guard and audit, independent from upload/voice selection.
4. Only then implement the **bounded Multi-SHOT Executor**, grouped PR checks and selective render pipeline. This maintains the Director's batch-first priority while avoiding premature token expenditure.

This sequence supplements the still-locked [MediaOS Roadmap v1](MEDIAOS_ROADMAP_V1_DIRECTOR_LOCK_20261102.md) and [Batch-first Episode Factory plan](MEDIAOS_BATCH_FIRST_PRODUCT_DELIVERY_PLAN_20261104.md). Do not alter their formal stage acceptance criteria without another explicit Director decision.

## Acceptance demonstration before any token-spending agent

- Upload a valid new episode file → one episode with all its shot/visual/voice task records, **zero API-paid calls**.
- Reject missing/invalid assets, duplicate/non-contiguous shot keys, missing narration, mismatched source hashes and unsupported episode format.
- Editing narration and generating takes is possible; any TTS call requires explicit confirmation; no OpenAI agent may execute while even one shot lacks an approved current take.
- All shots voice-ready does **not** automatically authorize AI code generation; UI shows the separate episode-level budget confirmation.
- If a selected Take changes after consent, reject dispatch as stale; earlier approved takes and SHOT outputs are preserved.
- With one approved finite OpenAI budget, allow only the specified batch jobs; never change LOCK-guarded files, execute GitHub Actions or start Railway renders without separate Director approval.
