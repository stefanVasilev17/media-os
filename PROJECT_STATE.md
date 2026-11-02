# MediaOS — CURRENT PROJECT STATE
**Canonical cross-chat handoff for Architectural Thinking / MediaOS**

> **Snapshot last checked:** 2026-11-02 (Europe/Sofia).  
> **Status class:** verified repository/deployment facts + explicitly labeled Director reports; not an automatically refreshed live dashboard.  
> **How to use:** read this file, then `AGENTS.md`, the latest linked roadmap/handoff, and verify live GitHub/Railway evidence **before** modifying code. A newer merged PR or deployment can supersede this snapshot.

## 0. The answer in 20 seconds

- **Product:** MediaOS, an AI-assisted, Director-controlled, automated Remotion video production system for the Architectural Thinking YouTube channel.
- **Canonical repository:** `stefanVasilev17/media-os`, working branch `main`.
- **Current milestone:** Roadmap v1 **Stage 1 / 10, Unified Production Data, implemented, merged and deployed**. Final authenticated Director-browser verification of the new per-SHOT panel is **not yet recorded**.
- **NEXT implementation:** **Stage 2 — Remotion Scene Contract**, first scoped to **EP002 SHOT01**. Stage 3 builds/renders SHOT01; Stage 4 delivers the **AI Director Revision Loop** (Director feedback → scoped Remotion code change → tests → new preview).
- **Important:** Stages **2–10 are planned, NOT complete**. No generic agent-driven visual-generation loop or universal full-episode assembly is proven yet.
- **Do not change approved content or spend money just to catch up on project context.**

## 1. Active stack and creative contract

| Layer | Active and verified implementation / role |
|---|---|
| Director UI | React + TypeScript + Vite, mobile-friendly MediaOS frontend |
| Server | Java 21 + Spring Boot |
| Data | PostgreSQL + Flyway |
| Audio | ElevenLabs; editable per-SHOT narration, save-before-paid-confirmation, version-bound recordings, playback, preferred-take selection |
| Video | React/Remotion source code in GitHub, Remotion render worker and Railway deployment; existing EP001 renders |
| Control | Verified Director auth and audited operations; safe PR/build/test/deploy workflow |
| Source truth | Original locked editorial source and separately editable creative versions; Director review controls final creative decisions |

**Never propose reintroducing abandoned visual-editing or manual-montage software.** The current design uses programmatically authored Remotion scenes, audio synchronization and automated composition/assembly.

**Director freedom:** narration can be edited repeatedly. Pressing Save does not incur a TTS cost. Generate/Regenerate requires an explicit paid confirmation. Preferred voice takes may change without resetting editing locks; earlier versions and recordings remain accessible. Production release/approval controls are separate from routine creative editing.

## 2. Current evidence: what actually works

### Existing foundations — complete or Director-confirmed, NOT counted as future stages

1. **EP001:** current successful-login **12-SHOT** creative production, separate historical 16-SHOT archive. Director-approved EP001 source/renders must not be overwritten. A prior assembled render with QA PASS exists; **final Director full-film watch approval must not be assumed**.
2. **EP002 editorial:** **11-SHOT Director-LOCKED English Script v4.0**, with **1,948 words** and **810-second editorial plan**. Source `frontend/src/data/EP002_FullScript_v4_0_LOCKED.json`.
3. **EP002 visual:** separately Director-approved **NEW Visual Pass v1.0**, **11 SHOTs / 59 visual beats**, source `frontend/src/data/EP002_VisualPass_v1_0_DIRECTOR_APPROVED.md`. It is **not** the lost original v4.0 HEAR→SEE storyboard.
4. **EP002 Creative Voice:** in-place narration Edit → Save → optional Generate/Regenerate and history/playback/preferred take, no forced creative LOCK. Implemented in PR [#132](https://github.com/stefanVasilev17/media-os/pull/132), additive Flyway **V107**; Director reported it **working**. Current source in `frontend/src/components/Ep002CreativeShotEditor.tsx`, `frontend/src/api/ep002CreativeVoiceApi.ts`, `backend/src/main/java/com/architecturalthinking/mediaos/workflow/Ep002CreativeVoiceService.java`.
5. **Voice ↔ HEAR→SEE synchronization workflow:** **Director reported confirmed** on 2026-11-02; no need to re-request basic validation. **Do not equate this claim with proven phoneme/word-level cues for every visual beat:** the new production contract deliberately labels beats as editorial until measurement/explicit alignment is supplied.
6. **Remotion engine & CPU Render Worker:** deployed and working for established EP001-specific compositions. The existence of the renderer **does not mean** EP002 automatically generates new visual code today.

### Roadmap Stage 1 — implemented and deployed

- **Unified Production Contract** per EP002 SHOT: latest saved script revision and SHA, source-safe approved visual plan/beat list, explicitly selected take ID, real audio duration via `ffprobe` where available, honest timing authority, render dependency hash and registered render lineage status.
- **GET API:** `/api/v1/creative/episodes/EP002/shots/SHOT01/production-contract` (SHOT01 through SHOT11). Requires Director session.
- **UI:** existing `#/library/EP002` → expand a SHOT → **Unified Production Data**. Auto-refreshes after Save, Generate or choosing preferred take.
- **Source:** `backend/src/main/java/com/architecturalthinking/mediaos/workflow/Ep002ProductionContractService.java`; presentation `frontend/src/components/Ep002ProductionContractPanel.tsx`.
- **DB:** additive Flyway `V108__ep002_production_contract_audio_duration_render_lineage.sql`. The render lineage table is an index/registry for future render work: **Stage 1 does not create a render job or pretend an EP002 visual preview exists.**
- **GitHub:** implementation [PR #134](https://github.com/stefanVasilev17/media-os/pull/134), merged commit `54dc95123f72724ce65bfe80d92502869006202d`.
- **Checks:** Maven **264 tests / 0 failures / 0 errors / 37 skipped**, TypeScript + Vite PASS, Flyway **V108** migration successful.
- **Railway on 2026-11-02:** production backend deployment `33dbeb29-b116-4155-bda3-0fa68d8d5eb1`, **SUCCESS** at commit `54dc95123f72724ce65bfe80d92502869006202d`; render worker **SUCCESS**. Live deployment must be rechecked if later releases occur.
- **Documentation-only handoff:** [Stage 1 source and evidence](docs/engineering/MEDIAOS_STAGE1_UNIFIED_PRODUCTION_DATA_HANDOFF_20261102.md), merged [PR #135](https://github.com/stefanVasilev17/media-os/pull/135). **Documentation-only main commits need not equal the production backend commit.**
- **Pending:** the Director has not yet reported a personal authenticated browser review of the Unified Production Data panel, so Stage 1 is **DEPLOYED, DIRECTOR UI CHECK PENDING**, not fully accepted by the Director.

## 3. Forward plan — locked v1 roadmap

**The approved ten remaining stages and their acceptance gates** are in [Director-LOCKED Roadmap v1](docs/engineering/MEDIAOS_ROADMAP_V1_DIRECTOR_LOCK_20261102.md), merged [PR #133](https://github.com/stefanVasilev17/media-os/pull/133).

| # | Stage | Verified progress as of snapshot |
|---|---|---|
| 1 | Unified Production Data | **Implemented + deployed; Director UI check pending** |
| 2 | Remotion Scene Contract | **NEXT; not yet implemented** |
| 3 | Automated SHOT Builder (EP002 SHOT01) | Planned |
| 4 | **AI Director Revision Loop v1** | Planned, highest-value next milestone |
| 5 | Revision History & Rollback | Planned |
| 6 | Incremental Rendering | Planned |
| 7 | Automatic Episode Assembly (11 SHOTs) | Planned |
| 8 | Director Review & Quality Gates | Planned |
| 9 | Automatic Shorts Production (at least 3) | Planned |
| 10 | Universal Episode Factory (EP003 onward) | Planned |

**Stage 4 acceptance:** the Director previews SHOT01, types a specific visual change, a controlled agent proposes/modifies only affected Remotion code, tests it, renders a new SHOT preview and exposes it in MediaOS without destroying previous revisions. Automatic changes must not bypass authorization/CI/review.

**Stage 7 acceptance:** automatically assemble the eleven EP002 SHOT videos with chosen voice takes and verified timings; no manual editing stage.

## 4. Episode/source boundaries and provenance

- **EP001:** protected. Do not alter locked source clips, sounds, renders, approved scene masters or historic memory to implement EP002.
- **EP002 creative:** current editable script revision in PostgreSQL may differ from the original approved Script v4.0. For actual generation use *current saved draft* and *preferred take of the same revision*, not an assumed old source narration.
- **EP002 HEAR→SEE:** 59 beats in new approved Visual Pass. If narration changes, the visual cue mappings may require review. **Editorial seconds are not measured audio seconds**; no invented word/phoneme timestamps.
- **Native production preparation:** EP002 may be worked on in its independent Creative Editor without native Research/Script/Scene LOCK. Do not revive obsolete requirements that blocked creative editing.
- **QA-only native EP002 workspace ID** is not proof of a separate production episode record. Do not synthesize production stage locks.
- **No paid calls on startup.** No silent ElevenLabs charges or automatic approval, retries of UNCERTAIN transactions, or forged Director identity.
- **Historical documents may contain outdated tool references.** Roadmap v1 supersedes those technical plans, while archived approved script/visual artifacts retain their original editorial authority.

## 5. Repository navigation and important links

| Read for | Path |
|---|---|
| Startup behavior for all agents | [AGENTS.md](AGENTS.md) |
| Product priorities, 10 stage gates | [Roadmap v1](docs/engineering/MEDIAOS_ROADMAP_V1_DIRECTOR_LOCK_20261102.md) |
| Stage 1 evidence, API semantics, gate | [Stage 1 handoff](docs/engineering/MEDIAOS_STAGE1_UNIFIED_PRODUCTION_DATA_HANDOFF_20261102.md) |
| EP002 UI | `frontend/src/pages/EpisodeProductionLibraryPage.tsx` |
| EP002 editable script and take chooser | `frontend/src/components/Ep002CreativeShotEditor.tsx` |
| EP002 unified contract UI | `frontend/src/components/Ep002ProductionContractPanel.tsx` |
| EP002 voice service | `backend/src/main/java/com/architecturalthinking/mediaos/workflow/Ep002CreativeVoiceService.java` |
| EP002 unified backend contract | `backend/src/main/java/com/architecturalthinking/mediaos/workflow/Ep002ProductionContractService.java` |
| EP002 original full script | `frontend/src/data/EP002_FullScript_v4_0_LOCKED.json` |
| Approved new visual beat source | `frontend/src/data/EP002_VisualPass_v1_0_DIRECTOR_APPROVED.md` |
| Remotion composition registry | `remotion-engine/src/Root.tsx` |
| Remotion rendering worker | `remotion-engine/cpu-worker.mjs` |
| Remotion backend render API | `backend/src/main/java/com/architecturalthinking/mediaos/remotion/RemotionRenderController.java` |

**Web UI:** https://media-os-backend-production.up.railway.app/#/library/EP002

## 6. Cross-chat startup and freshness process

Any future AI conversation with GitHub access should:

1. Fetch `AGENTS.md`, `PROJECT_STATE.md`, `README.md` from `main` and the Roadmap v1/Stage 1 handoff linked above. **Do not rely solely on previous chat summaries.**
2. Verify the latest GitHub `main` commit and any recently merged PRs; read actual files for the feature under discussion. This snapshot may be older than those changes.
3. For deployment claims, check Railway environment and deployment commit/status. A merged PR is **not** deployment proof.
4. Clearly report **DONE / DEPLOYED / DIRECTOR-CHECK-PENDING / IN PROGRESS / NEXT / BLOCKED** with evidence. Never mark a planned stage complete due only to prose.
5. Work on the requested task, respecting current branch, codebase, user approvals and spending/security boundaries. Avoid repeating completed features.
6. At the end of **each meaningful finished production milestone**, update `PROJECT_STATE.md` in the same reviewed PR (or an immediate linked docs PR) with date, new tests, commits, deployment verification, status and next action. Update `AGENTS.md` or Roadmap only when their rules actually change. Do not modify approved Roadmap scope without Director authorization.

**This file is updated through GitHub changes, not through chat memory and not by a background agent.** It is useful as a repeatable context source, but its accuracy still depends on the above verification and update discipline.
