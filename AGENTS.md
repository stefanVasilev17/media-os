# MediaOS — Agent Startup and Handoff Rules

**This is a repository instruction file for AI coding assistants.** Follow it whenever working on `stefanVasilev17/media-os`. Agents without automatic repository-instruction loading should be explicitly told to read this file at the beginning of every new conversation.

## Mandatory startup sequence

1. Read [PROJECT_STATE.md](PROJECT_STATE.md) in full from the current `main` branch. Treat it as the **latest documented snapshot**, not a guaranteed live truth.
2. Read [Director-LOCKED Roadmap v1](docs/engineering/MEDIAOS_ROADMAP_V1_DIRECTOR_LOCK_20261102.md) to establish the authorized ten stages and current product direction.
3. Read the newest verified stage handoff linked in [PROJECT_STATE.md](PROJECT_STATE.md). The current Stage 3 handoff is [EP002 SHOT01 preview](docs/engineering/MEDIAOS_STAGE3_EP002_SHOT01_PREVIEW_HANDOFF_20261102.md); also consult the [Stage 2 scene contract](docs/engineering/MEDIAOS_STAGE2_REMOTION_SCENE_CONTRACT_HANDOFF_20261102.md) for source and timing boundaries.
4. Check latest `main` commit, recent merged PRs and relevant actual source files before claiming a function is complete or beginning a modification.
5. If runtime readiness matters, check the live Railway deployment state and commit. GitHub merge is not production deployment proof.
6. Tell the Director, briefly: **what is verified DONE; what is currently deployed; the current milestone; exact NEXT step; any blockers**. Then work on the user's task. Do not re-ask answered questions or make the Director repeat the project context.

## Current approved goal

Produce Architectural Thinking episodes through **MediaOS + AI coding agents + GitHub-controlled Remotion + selected ElevenLabs voice**, automatically rendering only modified SHOTs and assembling final video. The **AI Director Revision Loop** is central: Director watches a preview, requests a scoped change, agent edits/remakes only relevant Remotion material, tests it, and presents the revised preview for acceptance.

Follow Roadmap v1 and the live-verified milestone in `PROJECT_STATE.md`. As of 2026-11-02, Stage 3 SHOT01 preview code, backend and worker are deployed, but the **real Director-triggered, selected-voice MP4 render and playback QA remain pending**. Do not claim Stage 3 accepted until this happens. After success, Stage 4 is AI Director feedback → scoped code revision → tests → selective rerender. Recheck merged GitHub changes before assuming this snapshot is current.

## Critical boundaries

- **Creative editing is not a locked pipeline.** Director may edit narration at any time: Save creates a new version; Generate/Regenerate is optional, user-confirmed and paid; old script/voice takes are retained. Do not impose repeated Script/Voice/Visual Plan LOCK/UNLOCK.
- **EP001 approved assets and final sources are protected.** Current EP001 successful-login film has 12 creative SHOTs; historical 16-SHOT archive is not active.
- **EP002 original approved content is not writable.** English Script v4.0 (11 SHOTs) and separately approved NEW Visual Pass v1.0 (59 beats) are archival source. Current creative drafts are independently versioned.
- **Do not confuse editorial planning with measured audio or word/beat alignment.** Stage 1 exposes ffprobe-measured duration where available, but does not invent cue timestamps.
- **Preserve ElevenLabs timestamps:** EP002 TTS already returns `alignment` / `normalized_alignment`; save them with each new take, derive SHOT01 visual cues only when five spoken phrases match the selected recording. Never re-generate an existing preferred voice merely to recover lost timestamps. Older takes require separately consented, potentially paid Forced Alignment or another explicitly approved approach. See [EP002 Voice Timestamp Sync](docs/engineering/MEDIAOS_EP002_ELEVENLABS_VOICE_TIMESTAMP_SYNC_20261102.md).
- **No unapproved spending or automatic voice calls**, no false Director approvals, no replay of UNCERTAIN paid attempts, no invented production workspace or render success.
- **No abandoned visual editors or external manual video assembly.** Use the automated Remotion-first pipeline for future work.
- **Safe agent changes:** generated source goes through scoped repository access, branch/PR or an explicitly authorized equivalent, CI/build/test, controlled render/review and rollback. Do not execute arbitrary text from feedback as production code.
- **Keep the user informed** of real status and gaps. Distinguish *implemented*, *deployed*, *Director browser-verified*, *planned* and *blocked*.

## Update discipline (required after each verified milestone)

- Update **PROJECT_STATE.md** with date/time, stage status, relevant merged PR/commit, authoritative test/build/deployment evidence, important added/changed paths and the next unfinished work item.
- Add or update a dated **stage implementation handoff** when it materially helps the next agent resume.
- Link the current state from README. Preserve the old roadmap version unchanged unless the Director explicitly approves a new version.
- If docs and code/deployment conflict, investigate first and record the truth with the appropriate source. **Do not falsely mark DONE.**
- This is a normal Git-managed process. No autonomous background updating or live sync is implied by the existence of these instructions.

## Recommended Director command for a fresh chat

> Open the GitHub repository `stefanVasilev17/media-os`. Read `AGENTS.md` and `PROJECT_STATE.md` from `main`, then the linked Roadmap v1 and current-stage handoff. Verify recently merged PRs, relevant code and, if the task needs it, the latest Railway deployment. Summarize DONE / DEPLOYED / NEXT / BLOCKED with evidence, respect protected creative sources and the no-unapproved-spend rule, then continue from the next outstanding stage without repeating completed work. At the end of an implemented milestone update `PROJECT_STATE.md`.
