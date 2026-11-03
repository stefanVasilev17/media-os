# MediaOS — CURRENT PROJECT STATE
**Canonical cross-chat handoff for Architectural Thinking / MediaOS**

> **Snapshot last checked:** 2026-11-03 (Europe/Sofia).  
> **Status class:** verified repository/deployment facts + explicitly labeled Director reports; not an automatically refreshed live dashboard.  
> **How to use:** read this file, then `AGENTS.md`, the latest linked roadmap/handoff, and verify live GitHub/Railway evidence **before** modifying code. A newer merged PR or deployment can supersede this snapshot.

## 0. The answer in 20 seconds

- **Product:** MediaOS, an AI-assisted, Director-controlled, automated Remotion video production system for the Architectural Thinking YouTube channel.
- **Canonical repository:** `stefanVasilev17/media-os`, working branch `main`.
- **Current milestone:** Roadmap v1 **Stage 3 / 10**. Director reported watching the first playable EP002 SHOT01 preview with chosen Take 2 and approved its **speaking pace**, but **rejected the flat visual styling** as unlike EP001; accent/dialect also needs A/B review. EP001-style SHOT01 Visual Continuity v2 code now built/deployed; **new v2 MP4 and final Director visual/audio approval are pending**, so Stage 3 is NOT fully accepted.
- **NEXT — SHOT01 v2 Director preview:** EP002 Visual Continuity v2 from [PR #159](https://github.com/stefanVasilev17/media-os/pull/159) is running in Remotion Worker deployment `7333b452-aec6-4310-9cf8-6de2ae61b9f6` at pinned commit `1acc979a1188734fcae84f6f25e07b557dccbdf3`. Critical stale-preview issue corrected in [PR #160](https://github.com/stefanVasilev17/media-os/pull/160): same script/Take 2 and unchanged backend engine version formerly reused the OLD successful MP4. New Director-confirmed `renderRequestId` makes a fresh idempotent render hash and preserves prior renders. Production backend deployment `8c670142-b4c3-4029-afde-c7c0fc1788a2` at pinned commit `7aeabaa9f1a153ad6fd7992214c22e4ddd34a46e` is SUCCESS; **289 Maven tests, 0 failures, 0 errors, 39 skipped**; frontend TS/Vite PASS. Both services ONLINE. **No new v2 MP4 has been rendered or Director-approved yet**. Director may refresh EP002 SHOT01, verify Take 2 and five saved cues, and explicitly create ONE `Create new voice-synced preview` (Railway CPU only), then evaluate EP001 continuity and remaining narrator accent mismatch. No new ElevenLabs call authorized; second historical Take 1 forced alignment remains `UNCERTAIN`.
- **Important:** The Director reported an initial playable selected-voice SHOT01 preview, but **not creative acceptance**. The new EP001-continuity v2 rendition is not yet watched. Stages **4–10 remain planned**. The full inline AI Director feedback loop and universal assembly are not implemented; exact SHOT01 character-timestamp cue mapping is available.
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

### Verified voice timestamp integration — EP002 SHOT01

- **PR #143** merged on 2026-11-02, main `57bcf01c897ec724c5a04b3efc27993be90696c7`. Previously EP002 dropped the **already-returned** ElevenLabs `/with-timestamps` character alignment when saving an MP3. New EP002 takes now save that original payload in `ep002_creative_voice_take.elevenlabs_alignment` via **Flyway V109**.
- Five source-approved SHOT01 speech cues now map to measured seconds and **30fps Remotion frames** when a preferred current-version take has persisted valid timestamps. Scene contract, frontend panels and Remotion preview render use them. Provisional editorial cues remain explicit **only** for older/unmatched recordings. New alignment changes the scene contract digest and invalidates stale provisional previews.
- Production backend deployment `06206ba5-6c2c-4801-8e69-ac92bdbbe045` SUCCESS (Flyway V109 applied, Spring Boot started). Remotion Worker `96d26be8-1d75-4300-9f81-1bd2e0d8c0d4` SUCCESS (TypeScript preflight zero new errors, bundle PASS). Both Online with 0 warning/critical issues. Frontend and Maven package builds passed.
- **Important:** EP002 takes created before this change did **not** retain the returned alignment, and those timestamps cannot magically be reconstructed from the MP3 without new analysis. ElevenLabs Forced Alignment supports aligning the **existing audio** (no new TTS), but is **a paid API request** and MUST require an explicit Director confirmation; no paid requests were made. A new aligned-take playback has not yet been verified. Stage 3 remains Director-QA pending.
- [Full implementation, release evidence and follow-up](docs/engineering/MEDIAOS_EP002_ELEVENLABS_VOICE_TIMESTAMP_SYNC_20261102.md).

### Align Existing Take — deployed, paid Director action and video QA outstanding

- Code [PR #145](https://github.com/stefanVasilev17/media-os/pull/145) and compiler fix [PR #148](https://github.com/stefanVasilev17/media-os/pull/148) merged. The original exception-rethrow error in the ElevenLabs alignment client was reproduced under Java 21 and corrected; diagnostic build improvements [PR #146](https://github.com/stefanVasilev17/media-os/pull/146) were also included.
- **Railway backend deployment `33c8f4d1-0f33-43c2-b087-24fd5f768947` SUCCESS** (commit `1a8657531521d6b53e84e6754782c7ad646d6e9f`), Flyway **V110 applied**. Backend and Remotion Worker **Online / SUCCESS**, zero warning or critical issues.
- Java/Maven **280 tests, 0 failures, 0 errors, 37 skipped**; frontend TypeScript/Vite PASS. Build and live backend startup verified.
- Current preferred take can now display **Align Existing Take**, a two-step **paid** confirmation. Backend accepts only exact current saved script/take, logs the unique paid request, blocks ambiguous repeats and attaches normalized ElevenLabs character timestamps to the **same** MP3. Does **not** create a new voice take. No paid provider request was made during deployment.
- **Pending:** real authenticated Director browser acceptance; a Director-approved **paid** Forced Alignment action on an old take (if they choose); verification of extracted 5 cue anchors and first voice-aligned Remotion MP4 preview. Stage 3 is **not yet Director-accepted**.
- Detailed release evidence and earlier failure history: [Align Existing Take handoff](docs/engineering/MEDIAOS_EP002_EXISTING_TAKE_ALIGNMENT_RELEASE_GATE_20261102.md).

### Live incident / reconciliation — EP002 SHOT01 Take 1 (2026-11-03)

- Director screenshot confirms `Take 1 · text v1` is already **PREFERRED**. UI showed "An earlier paid alignment request needs reconciliation. Do not retry."
- Railway HTTP logs confirm **one POST to MediaOS** `/api/v1/creative/episodes/EP002/shots/SHOT01/align-existing-take` on **2026-11-03 11:37:21 UTC** (HTTP 403), plus GETs. Server stack: `NoClassDefFoundError: org/reactivestreams/Publisher` at `ElevenLabsForcedAlignmentService.java:66`, `new MultipartBodyBuilder()`. The error occurred **before** the `RestClient.post()` provider-send code at lines 70–75. The application had already committed an `IN_FLIGHT` paid-request row; an Error escaped its `catch(Exception)`, leaving the safety lock.
- [PR #150](https://github.com/stefanVasilev17/media-os/pull/150) replaces the reactive multipart builder with blocking Spring MVC `LinkedMultiValueMap` + `HttpEntity<ByteArrayResource>`, adds mock-provider request tests, and introduces narrowly bounded Flyway V111 ledger reconciliation. [PR #151](https://github.com/stefanVasilev17/media-os/pull/151) makes Maven build diagnostics visible; [PR #152](https://github.com/stefanVasilev17/media-os/pull/152) fixes `RestClient.body(body)`; [PR #153](https://github.com/stefanVasilev17/media-os/pull/153) uses the schema-compatible 8-character `NOT_SENT` status (the first migration attempt failed because the original string exceeded `varchar(16)`).
- **Verified production:** backend Railway deployment `c59804b9-faff-4cbf-b632-90fe09ba7d51` on commit `9dd305c9004e2d2ed89335a5931eba3e29fda565` **SUCCESS**. Frontend TypeScript/Vite PASS, Java Maven **282 tests / 0 failures / 0 errors / 37 skipped**, Flyway **V111 successfully applied**, Spring Boot started, backend and Render Worker both **Online / SUCCESS** with **0 warnings/critical** on final health check.
- **Narrow reconciliation semantics:** only a single `IN_FLIGHT` SHOT01 attempt created in the exact observed 2026-11-03T11:37:19–23Z window, without saved alignment, can be marked `NOT_SENT` with `failure_reason='LOCAL_MULTIPART_CLASSLOAD_BEFORE_HTTP'`. All other `IN_FLIGHT`/`UNCERTAIN` attempts remain blocked. Historical actor/request ID/ledger row preserved; no automatic retry or new paid provider request. Migration successfully applied, **but affected-row count and authenticated UI state have not yet been separately read back**; Director needs to refresh.
- **Next:** Director refreshes preferred Take 1 in EP002 SHOT01. If UI now offers `Align Existing Take`, a new action is **still paid** and needs two-step Director consent; it is not automatic. Do not confuse the failed **MediaOS POST** with a confirmed paid provider call. A real aligned audio/video MP4 is not yet validated.
- [Detailed root-cause and production evidence](docs/engineering/MEDIAOS_EP002_EXISTING_TAKE_ALIGNMENT_RELEASE_GATE_20261102.md) (latest 2026-11-03 addendum).

### SECOND alignment attempt — potentially reached ElevenLabs; keep lock (2026-11-03)

- Director provided a new screenshot after explicitly confirming **Yes, align this existing take (paid)** for preferred SHOT01 Take 1. UI showed **MediaOS HTTP 403** and “An earlier paid alignment request needs reconciliation. Do not retry.” No timestamps were shown as saved, and no synced MP4 was verified.
- Railway backend proxy recorded `GET .../align-existing-take` 200 at 14:52:35 UTC, `POST .../align-existing-take` **403** at **2026-11-03 14:52:36 UTC**, then GET 200. DNS logs show `api.elevenlabs.io` A/AAAA lookups at 14:52:36 UTC while handling the operation. There were no useful runtime exception lines for this caught error. **DNS evidence is not evidence of a completed or billed request; a MediaOS 403 is not proof that the provider itself returned 403.** Do NOT classify this attempt as `NOT_SENT`.
- **Important distinction:** the *first* 11:37 UTC POST failed at a `MultipartBodyBuilder` class-load before provider send and was narrowly reconciled in V111; the *second* 14:52 UTC attempt requires an independent provider-side check, and V111 must NOT be reused to clear it.
- [PR #155](https://github.com/stefanVasilev17/media-os/pull/155), merged `08bb4da0061bf48e498f676a5b7c5b9efcb1801a`, adds **no new paid calls** and does **not** modify existing paid ledger rows. It surfaces last attempt timestamp / saved sanitized failure class, labels future upstream HTTP status without logging provider responses or keys, refreshes alignment status for unchanged preferred take, and returns safe JSON errors from the controller to avoid a misleading generic 403 masking a backend error.
- **Verified deployment:** Railway backend `67c419de-0d1f-4d23-952a-6921cfe4340d` **SUCCESS**, frontend build PASS, Maven **285 tests / 0 failures / 0 errors / 37 skipped**, Flyway remains **V111**, Spring Boot started, backend and Render Worker **Online / SUCCESS**, 0 warning/critical issues.
- **NEXT:** Director checks **ElevenLabs Developers → Request Log** around **2026-11-03 14:52:36 UTC / 16:52 Europe/Sofia**, filters for `/v1/forced-alignment` and inspects status, detailed error code and credit usage (no secrets shared). If provider explicitly shows denied access / no spend, correct permissions or plan/IP allowlisting as appropriate but still reconcile the ledger under reviewed authorization before a new paid attempt. If the provider shows success/charged, first recover original result or design safe manual review; NEVER silently retry a paid request.
- **Stage 3 remains unfinished**, first voice-aligned MP4 not reviewed. The current `UNCERTAIN` lock is an intended safety feature; do not “fix” by deleting the request row, loosening uniqueness or resetting it merely because the UI looks blocked.

### Live 2026-11-03 — SHOT01 Take 2 and first MP4 attempt: worker/backend blocker

- **New voice:** Director reported a second generation and selected it with **Use this take**. Railway production backend proxy confirms `POST /api/v1/creative/episodes/EP002/shots/SHOT01/generate` **HTTP 200** at 15:22:14 UTC and `POST .../approve` **HTTP 200** at 15:22:23 UTC. Subsequent scene/production-contract GETs returned HTTP 200. This verifies accepted operations, **not** an independently inspected DB alignment payload or all five resolved cue frames. New EP002 generation uses ElevenLabs `/with-timestamps` and persists returned alignment when successful. Do not re-generate voice just for this render failure.
- **Render:** Director triggered `POST .../render-preview` **HTTP 200** at 15:24:20 UTC. Remotion worker claimed render `6f0e355c-6eb6-47c0-9cd8-16cb92f66010`, composition `EP002-SHOT01-DRAFT`, 1280×720 at 30fps, 980 frames. Worker reached 91% then failed at the `ep002-selected-voice` endpoint with **HTTP 403** during FFmpeg voice mux. Its failure-report callback then returned **HTTP 409** `GLOBAL_CREATION_PREFLIGHT_BLOCKED` with `Remotion worker callback requires a stored episode-scoped render.`
- **Unbounded retry hazard:** Railway worker logs show the same render claimed again at 15:28:09 UTC, failure at 15:29:48 UTC, and another claim at 15:31:22 UTC. This is **not a completed MP4** and can cause repeated CPU charges. A zero-replica update was attempted through the connected Railway service tool to pause the worker but rejected by Railway's input validation; **the production worker was not changed or paused**. Operator may stop its deployment from Railway UI until a safe code fix; do not remove production MediaOS backend, database, selected recording, protected EP001 media or render history.
- **NEXT engineering fix:** Investigate worker-owned selected-voice authentication/authorization (403), the episode-scoped render creation/failure callback preflight mismatch (409), and bounded retry/fail-terminal behavior. Use scoped branch/PR, tests, controlled production promotion; verify render has proper 1920×1080 output before Stage 3 Director video/audio QA. Do not automatically charge ElevenLabs.

### Live 2026-11-03 — Railway cost cleanup, QA infrastructure removed

- **Director request:** optimize Railway Hobby spend and remove persistent QA infrastructure; retain production `MediaOS`. Official Railway Hobby minimum is $5/month including $5 usage; Pro minimum is $20/month including $20 usage, with no cheaper unit CPU/RAM rates. The screenshot for Oct 13–Nov 13 shows Current Usage $10.41 and Estimated Bill $11.33, not proof of a finalized charge. Railway Agent usage was only $0.12 on screenshot.
- **QA inventory before cleanup:** `MediaOS-Shot-QA-20261031` had four standalone services and one disposable PG volume; `MediaOS-Preflight-QA-20261028` had two standalone services and one PG volume. Together the five measurable active QA services used approximately **0.90 GB average RAM** over a 48h Railway metrics window (the sixth reported 0); ~$9/month in steady-state memory charges if kept running is an estimate only, not billed line-item proof.
- **Executed and verified through Railway:** deleted all **six QA services** and both QA PostgreSQL volumes. Subsequent `get_status` on both QA projects reports **zero services and zero pending work**. Production `MediaOS` still has its original 15 services, 2 PG volumes and recovery bucket, with no staged changes. **Only the two empty QA project shells remain**, because available connected Railway operations do not expose whole-project deletion; Director may delete those safely under Railway project **Settings → Danger → Delete Project**.
- **Do NOT blindly delete production databases:** the `MediaOS` project has two PostgreSQL services (one may be tied to canary/recovery), an isolated EP002 voice canary and historic one-off functions; verify actual production DB dependency before any cleanup. Most one-off functions measured zero RAM/CPU over the 48h window, so their deletion is not the primary savings. An unrelated empty project `vigilant-forgiveness` still contains an unmounted storage volume; do not delete without checking its contents/backup and receiving Director authorization.
- **Cost recommendation:** stay on Hobby while eliminating persistent QA resources and runaway render retries. Use Railway **Show Breakdown** to confirm per-service costs, and **email alerts** for budget; a hard compute limit can take all production workloads offline and is not a safe default. Deleting QA infrastructure does **not** remove creative technical QA or Director acceptance gates from the locked Roadmap.

### Live 2026-11-03 — Remotion worker audio/failure-cycle fix deployed; Stage 3 still awaits Director MP4 playback

- **Scope:** [PR #158](https://github.com/stefanVasilev17/media-os/pull/158) targets only the existing EP002 SHOT01 Remotion preview machinery. New scoped `GET /api/v1/remotion/renders/worker/{renderId}/ep002-selected-voice` is authorized through `WorkloadRoute`; original worker key + scoped token + verified current chosen take remain mandatory. EP002 callback `complete`/`fail` is accepted only for a `RUNNING` worker-owned render with matching Director-created episode/SHOT lineage, contract, voice take, script revision, dependency and visual hashes and **no forged episode header**. EP001 callback episode rules remain intact.
- **Reliability/cost:** The Director's `render-preview` creation now atomically inserts render+lineage in one database transaction. On an expired EP002 RUNNING heartbeat, worker `claim` marks it `FAILED` (not `QUEUED`), and late failure callbacks cannot overwrite terminal statuses. Worker checks protected selected MP3 **before** visual rendering, and verifies it again during mux, preventing CPU waste and stale audio if Director changes preferred take during render. Do not auto-retry paid calls or any historical `UNCERTAIN` alignment.
- **Independent test evidence, without GitHub Actions:** production backend Railway deployment **`1d6d0f92-4748-4455-9fc0-782badeb5d6c` SUCCESS** from pinned code SHA `11bfa0f...`, Java 21 Maven **288 tests / 0 failures / 0 errors / 39 skipped**; the skipped suite includes database integration/authorization tests requiring an isolated Postgres test DB. Unit worker route regression passes. Java 21 local standalone duplicate route check also passed 10 independent assertions. Spring Boot healthy; 111 Flyway migrations validated, no new migration applied.
- **Worker build evidence:** Railway **`e27d5dc5-63ae-4e02-8387-0092f8909645` SUCCESS** from the SAME pinned code SHA, **17 token/lease Node tests PASS, 0 fail**, `node --check` PASS, existing Remotion TypeScript preflight: **0 new** diagnostics with **one documented protected EP001 baseline diagnostic**, `npm run build` Remotion bundle PASS. Backend and worker each run **one healthy replica**, 0 Railway warning/critical issues on verification. Worker startup logs show no automatic rerender in sampled logs; authenticated UI/DB readback of the prior stale render row is still pending.
- **Follow-up security maintenance:** worker `npm prune` logged 10 high-severity dependency audit findings. This is a reported audit warning, not a claim of exploitability; assess via dependency audit in a separately scoped fix, without blindly upgrading the locked Remotion stack.
- **Director decision:** GitHub Actions stays disabled. `AGENTS.md` now forbids asking to run it and requires alternative explicit verification. Existing Railway production services are used; no new permanent QA project. Services were deliberately tied to immutable Git commit `11bfa0f...` using the explicit Railway promotion marker so docs-only pushes do not force unintended redeploys.
- **NEXT exact Director action:** Open MediaOS `#/library/EP002`, expand SHOT01 → `Remotion Scene Blueprint`, confirm Take 2 is preferred and five saved ElevenLabs speech cue frames are present; refresh latest preview status. If old render now FAILED, click **Create voice-synced preview** once, confirm; this queues a new preview using current selected MP3 and incurs CPU costs only. Check MP4 playback, audio presence, voice cue sync and visuals. Record Director feedback; iterate only `remotion-engine/src/episodes/ep002/Shot01LoginWaiting.tsx` with scoped PR/redeployment. **Stage 4** (automated free-text Director revisions within MediaOS) remains planned, not delivered by this fix.
- **Audit:** Original approved EP001 SHOT assets and EP002 Script v4.0 / Visual Pass v1.0 unchanged; Take 2 preserved; first Take 1 alignment `NOT_SENT` and second `UNCERTAIN` separate and untouched. Do not label Stage 3 accepted until a real selected-voice MP4 is watched and approved.

### Live 2026-11-04 — EP002 SHOT01 v2 visual continuity deployed, creative review pending

- **Director feedback:** After the first functioning SHOT01 selected-voice preview, Director said the narration pacing was engaging, but the scene was overly simple and visually inconsistent with EP001, which is the preceding video in the series. Director also reported that the **accent/dialect** did not sound quite like the final EP001 narrator. **This is reported playback feedback, not an independent audio waveform or frame-by-frame review.** Take 2 remains selected, 32.640 seconds, 980 audio frames at 30fps; user screenshot confirms five real ElevenLabs speech cues, starting at frames **8, 146, 386, 620, 937**. Do not auto-generate audio.
- **Source and art direction:** [PR #159](https://github.com/stefanVasilev17/media-os/pull/159), handoff [SHOT01 Visual Continuity v2](docs/engineering/MEDIAOS_EP002_SHOT01_VISUAL_CONTINUITY_V2_20261104.md), code `remotion-engine/src/episodes/ep002/Shot01LoginWaiting.tsx`. Source changed only this EP002 scene, the documentary handoff, and explicit Railway promotion marker; no EP001 files, protected EP002 visual pass, script, voice takes, timing adapter or backend changed.
- **Implementation:** Reuse existing locked EP001 visual exports `ATPhone`, `ATBackground`, `ATControlledRealismLayer`, `ATCameraRig`, `ATBackendNode`; leave Phone foreground, Auth service right/background, dim Gateway/Balancer, maintain one visual world. Keep exactly five existing speech-linked starts. Phone press/spinner → amber unmeasured Time Rail → modest shallow Auth probe PASS → unresolved Phone refocus → `09:00` rewind. EP001 source files are imported read-only and not modified.
- **Build / deploy verified without GitHub Actions:** Existing Railway worker `media-os-render-worker` deployment **`7333b452-aec6-4310-9cf8-6de2ae61b9f6` SUCCESS**, from pinned commit `1acc979a1188734fcae84f6f25e07b557dccbdf3`. `node --check cpu-worker.mjs` PASS; **17/17 Node token/lease tests PASS**, `node build-typecheck-preflight.mjs` accepts one documented protected EP001 TS2322 baseline with **zero new errors**, `npm run build` produced Remotion bundle PASS. Worker started one healthy replica with renderConcurrency=1 and internal MediaOS backend transport. No automatic render was triggered in deployment logs sampled after startup; do not claim a new v2 MP4 exists. Existing backend PR #158 deployment remains ONLINE.
- **Visual approval gate:** Director opens `#/library/EP002` SHOT01, checks preferred Take 2 and real cue timings, clicks **Create voice-synced preview** exactly once (Railway CPU use only), waits for `SUCCEEDED`, listens/watches, and gives focused feedback on continuity with EP001, phone scale, Auth look, camera, Time Rail, 09:00 transition and shallow-probe labels. v2 not visually LOCKED and Stage 3 not accepted until Director approval.
- **Narrator parity separate:** EP002 code already verifies the same EP001 `voiceId` and `modelId` (production reference previously inspected), but published EP001 numeric synthesis parameters were not fully persisted. Performance prefix is fixed `calm, conversational, confident`; the editorial `voiceDirection` UI text does not override the v4 TTS prefix. Before any separately paid new Take, compare actual final EP001 voice audio and current Take 2 at comparable loudness for accent/dialect, pronunciation, pacing and timbre. Keep Take 2 and its timestamps; NO paid regeneration or forced alignment authorized.
- **Caution:** Worker image build showed an older npm audit report of 10 high-severity dependency notices; review separately rather than blindly upgrading locked Remotion dependencies. The previous Take 1 Forced Alignment at 2026-11-03 14:52:36 UTC remains `UNCERTAIN` and unchanged.

### Live 2026-11-04 — Fresh EP002 SHOT01 preview ID after visual code edits

- **Root cause discovered before Director's v2 rerender:** `RemotionRenderController.renderHash` includes **backend** `engineVersion` and verified input props, **not** the independently deployed Remotion Worker build SHA. Director keeping the same voice Take 2 and original approved visual source contract while only worker `Shot01LoginWaiting.tsx` changes would allow `ensureVerifiedRender` to reuse the old `SUCCEEDED` MP4 and mislead the Director that the new visual code had rendered.
- **Fixed in [PR #160](https://github.com/stefanVasilev17/media-os/pull/160):** optional UUID `renderRequestId` from an explicit Director-confirmed UI click is added to the verified EP002 render input props. The existing deterministic render hash/unique idempotency then yields **one fresh job for the new ID**, while a repeated identical request ID deduplicates. Existing old API clients without an ID keep old behavior; previously rendered MP4s stay preserved in `remotion_render` and `episode_shot_render_lineage`. **Do not auto-trigger render.**
- **UI cost safety:** Frontend includes a clear no-new-ElevenLabs but Railway-CPU confirmation, disables its action while QUEUED/RUNNING, prevents concurrent clicks via `useRef`, and retains the pending UUID across an uncertain HTTP response for a safely deduplicated explicit retry. It keys the video player by returned renderId so new v2 MP4 replaces old player source. The UI copy now describes an implemented Remotion composition and clarifies that visual source changes require a newly created preview.
- **Independent checked deployment:** Railway `media-os-backend` deployment `8c670142-b4c3-4029-afde-c7c0fc1788a2`, source SHA `7aeabaa9f1a153ad6fd7992214c22e4ddd34a46e`, **SUCCESS**, Java21 Maven **289 tests / 0 failures / 0 errors / 39 skipped**; the new EP002 preview controller test ran **3/3 PASS**. Frontend TypeScript and Vite build **PASS**. One running healthy backend replica, PostgreSQL connected, Flyway 111 migrations validated, no new migration needed. The existing EP001-style v2 Render Worker remains separately **ONLINE** from PR #159.
- **NEXT Director action:** Open `https://media-os-backend-production.up.railway.app/#/library/EP002`, expand SHOT01, verify preferred Take 2 with five ElevenLabs real speech cue frames, refresh Remotion Scene Blueprint, confirm no running render, press **Create new voice-synced preview** once and approve Railway CPU use. Wait for a new render ID and `SUCCEEDED`, watch/listen, give Director feedback on Phone/ Auth fidelity, camera, Time Rail, rewind, audio sync and accent. **Stage 3 creative acceptance still pending**. If error or repeated claim occurs, do not press again; inspect logs.
- **Caveat:** This solves intentional versioned preview creation without rerendering backend for every future worker code edit. The true worker Git build SHA is still **not automatically persisted into each render row** (`remotion_commit_sha` may remain `WORKER_SOURCE_UNVERIFIED`); preserving exact release provenance in lineage is a separate improvement, especially before automated Stage 4/5 revision history. Do not claim full automatic source attribution yet.

## 3. Forward plan — locked v1 roadmap

**The approved ten remaining stages and their acceptance gates** are in [Director-LOCKED Roadmap v1](docs/engineering/MEDIAOS_ROADMAP_V1_DIRECTOR_LOCK_20261102.md), merged [PR #133](https://github.com/stefanVasilev17/media-os/pull/133).

| # | Stage | Verified progress as of snapshot |
|---|---|---|
| 1 | Unified Production Data | **Implemented + deployed; Director UI check pending** |
| 2 | Remotion Scene Contract (EP002 SHOT01) | **Implemented + deployed; Director UI check pending** |
| 3 | Automated SHOT Builder (EP002 SHOT01) | **Director reported first selected-voice MP4 playback, pacing okay; old visuals rejected. EP001-continuity v2 deployed; v2 MP4 + Director visual/audio QA pending** |
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
