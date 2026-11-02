# MediaOS — CURRENT PROJECT STATE
**Canonical cross-chat handoff for Architectural Thinking / MediaOS**

> **Snapshot last checked:** 2026-11-02 (Europe/Sofia).  
> **Status class:** verified repository/deployment facts + explicitly labeled Director reports; not an automatically refreshed live dashboard.  
> **How to use:** read this file, then `AGENTS.md`, the latest linked roadmap/handoff, and verify live GitHub/Railway evidence **before** modifying code. A newer merged PR or deployment can supersede this snapshot.

## 0. The answer in 20 seconds

- **Product:** MediaOS, an AI-assisted, Director-controlled, automated Remotion video production system for the Architectural Thinking YouTube channel.
- **Canonical repository:** `stefanVasilev17/media-os`, working branch `main`.
- **Current milestone:** Roadmap v1 **Stage 3 / 10, first EP002 SHOT01 Remotion storyboard implementation and preview infrastructure deployed**. **Real selected-voice MP4 render/Director QA still pending**, so Stage 3 is NOT yet fully accepted.
- **NEXT action:** Director triggers and reviews the **first real EP002 SHOT01 storyboard MP4** from the existing MediaOS page with current preferred voice. Confirm actual audio, render and quality evidence; then **Stage 4 AI Director Revision Loop** (feedback → scoped GitHub Remotion change → tests → new preview).
- **Important:** Stage 3 executable code and worker integration are deployed, but actual output is **not yet verified**. Stages **4–10 are planned, NOT complete**. Automated agent-authored revisions, universal episode assembly and true word-aligned choreography are not yet implemented.
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

### Roadmap Stage 2 — EP002 SHOT01 blueprint, implemented and deployed

- Authenticated read-only `GET /api/v1/creative/episodes/EP002/shots/SHOT01/remotion-scene-contract`; in-page SHOT01 **Remotion Scene Blueprint** UI below Stage 1. Contracts refresh with script/voice changes.
- Typed camera, allowed operations and asset inventory derived from five approved SHOT01 beats; strict script/take/visual dependency checking, unregistered 1920×1080 30 FPS scene draft, measured audio duration converted to frames where available.
- **No fabricated per-beat timestamps, no verified asset existence, no created Remotion video, no AI code execution and no paid calls.** The blueprint marks missing voice, missing audio measurement and post-edit cue review accurately.
- Remotion consumer schema: `remotion-engine/src/contracts/remotionSceneContract.ts` (Zod; standalone Remotion-engine typecheck still a Stage 3 task).
- Main GitHub implementation [PR #137](https://github.com/stefanVasilev17/media-os/pull/137) and Java compile correction [PR #138](https://github.com/stefanVasilev17/media-os/pull/138), current production commit `ce6c7eac85e1be04ff41032e5036ffb65ef9e76d`.
- Railway production backend deployment **`416f3d1b-19aa-4d23-a638-4be53db53f9d` SUCCESS**; existing render worker SUCCESS, both online with no reported service issues. Frontend TypeScript/Vite PASS, backend **269 tests / 0 failures / 0 errors / 37 skipped**, BUILD SUCCESS. First build failed on a duplicate local variable; corrected and revalidated.
- Detailed implementation and next-task handoff: [Stage 2 Remotion Scene Contract](docs/engineering/MEDIAOS_STAGE2_REMOTION_SCENE_CONTRACT_HANDOFF_20261102.md).
- **Pending:** authenticated Director page inspection/approval for the blueprint. **NEXT:** Stage 3 resolves actual component/asset implementations, voice-cue alignment and the first real SHOT01 video preview.

### Roadmap Stage 3 — first executable EP002 SHOT01 Remotion preview

- `EP002-SHOT01-DRAFT` registered as a 1920×1080/30fps Remotion composition with five visual movements; source `remotion-engine/src/episodes/ep002/Shot01LoginWaiting.tsx`. Approved visual source remains separate from new storyboard render.
- Director-triggered POST and GET `/api/v1/creative/episodes/EP002/shots/SHOT01/render-preview`; source `backend/src/main/java/com/architecturalthinking/mediaos/workflow/Ep002Shot01PreviewController.java`. Requires current contract ID, measured current preferred take, Director confirmation of provisional visual cue timing. Does not generate TTS audio.
- Protected worker endpoint serves only selected voice for an active worker-owned current-revision render. Worker muxes voice into Remotion MP4 with FFmpeg; preview status/video shown directly under SHOT01 in MediaOS. History is dependency-bound.
- Implementation [PR #140](https://github.com/stefanVasilev17/media-os/pull/140), Java compile correction [PR #141](https://github.com/stefanVasilev17/media-os/pull/141).
- **Verified release 2026-11-02:** backend Railway deployment `c9c88cb1-2e8f-4428-8446-7141ae85181d` commit `9219e8e388458ad8421a2268c17b4f260139a526` SUCCESS; Remotion Worker `c3ad08bf-4431-4e43-b5b8-aa9583e20a10` commit `54533536614607b281e1f30b3c8453a43965283e` SUCCESS. Both online, no final service warnings. Frontend TypeScript/Vite PASS, Java Maven **271 tests, 0 failures, 0 errors, 37 skipped**, independent worker Remotion TypeScript preflight zero new errors and bundle PASS. One EP001 locked TypeScript baseline diagnostic remains documented and unchanged.
- **Critical caveat:** No authenticated Director render click or actual selected-voice MP4 QA has been completed. Five beats use clearly labeled provisional normalized storyboard windows, **not verified word-level voice alignment**. Do not claim Stage 3 fully DONE or Stage 4 functional yet. [Stage 3 handoff](docs/engineering/MEDIAOS_STAGE3_EP002_SHOT01_PREVIEW_HANDOFF_20261102.md).
- **NEXT:** Director selects existing current-version voice if not selected, clicks **Create storyboard preview** in EP002 SHOT01, verifies first MP4/video+sound. Do not create paid audio or pretend it was rendered.

## 3. Forward plan — locked v1 roadmap

**The approved ten remaining stages and their acceptance gates** are in [Director-LOCKED Roadmap v1](docs/engineering/MEDIAOS_ROADMAP_V1_DIRECTOR_LOCK_20261102.md), merged [PR #133](https://github.com/stefanVasilev17/media-os/pull/133).

| # | Stage | Verified progress as of snapshot |
|---|---|---|
| 1 | Unified Production Data | **Implemented + deployed; Director UI check pending** |
| 2 | Remotion Scene Contract (EP002 SHOT01) | **Implemented + deployed; Director UI check pending** |
| 3 | Automated SHOT Builder (EP002 SHOT01) | **Implemented + deployed; real MP4 render and Director QA pending** |
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
| Stage 2 deployed source-bound Remotion blueprint | [Stage 2 handoff](docs/engineering/MEDIAOS_STAGE2_REMOTION_SCENE_CONTRACT_HANDOFF_20261102.md) |
| Stage 3 executable preview and outstanding Director QA | [Stage 3 handoff](docs/engineering/MEDIAOS_STAGE3_EP002_SHOT01_PREVIEW_HANDOFF_20261102.md) |
| EP002 UI | `frontend/src/pages/EpisodeProductionLibraryPage.tsx` |
| EP002 editable script and take chooser | `frontend/src/components/Ep002CreativeShotEditor.tsx` |
| EP002 unified contract UI | `frontend/src/components/Ep002ProductionContractPanel.tsx` |
| EP002 voice service | `backend/src/main/java/com/architecturalthinking/mediaos/workflow/Ep002CreativeVoiceService.java` |
| EP002 unified backend contract | `backend/src/main/java/com/architecturalthinking/mediaos/workflow/Ep002ProductionContractService.java` |
| EP002 SHOT01 typed Remotion blueprint | `backend/src/main/java/com/architecturalthinking/mediaos/workflow/Ep002RemotionSceneContractService.java` |
| Remotion Zod consumer contract | `remotion-engine/src/contracts/remotionSceneContract.ts` |
| EP002 original full script | `frontend/src/data/EP002_FullScript_v4_0_LOCKED.json` |
| Approved new visual beat source | `frontend/src/data/EP002_VisualPass_v1_0_DIRECTOR_APPROVED.md` |
| Remotion composition registry | `remotion-engine/src/Root.tsx` |
| Remotion rendering worker | `remotion-engine/cpu-worker.mjs` |
| Remotion backend render API | `backend/src/main/java/com/architecturalthinking/mediaos/remotion/RemotionRenderController.java` |

**Web UI:** https://media-os-backend-production.up.railway.app/#/library/EP002

## 6. Cross-chat startup and freshness process

Any future AI conversation with GitHub access should:

1. Fetch `AGENTS.md`, `PROJECT_STATE.md`, `README.md` from `main` and the Roadmap v1/Stage 1 handoff linked above. **Do not rely solely on previous chat summaries.**
2. Verify the latest GitHub `main` commit and any recently merged PRs; read actual files for the feature under discussion. For Stage 2/3 read the [Stage 2 handoff](docs/engineering/MEDIAOS_STAGE2_REMOTION_SCENE_CONTRACT_HANDOFF_20261102.md). This snapshot may be older than those changes.
3. For deployment claims, check Railway environment and deployment commit/status. A merged PR is **not** deployment proof.
4. Clearly report **DONE / DEPLOYED / DIRECTOR-CHECK-PENDING / IN PROGRESS / NEXT / BLOCKED** with evidence. Never mark a planned stage complete due only to prose.
5. Work on the requested task, respecting current branch, codebase, user approvals and spending/security boundaries. Avoid repeating completed features.
6. At the end of **each meaningful finished production milestone**, update `PROJECT_STATE.md` in the same reviewed PR (or an immediate linked docs PR) with date, new tests, commits, deployment verification, status and next action. Update `AGENTS.md` or Roadmap only when their rules actually change. Do not modify approved Roadmap scope without Director authorization.

**This file is updated through GitHub changes, not through chat memory and not by a background agent.** It is useful as a repeatable context source, but its accuracy still depends on the above verification and update discipline.
