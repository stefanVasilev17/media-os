# MediaOS — Architectural Thinking

**Director-first, agent-executed AI video production operating system.**

## Start here — live project handoff

**NEW P0 2026-11-14 — NO FROZEN SHOT JOIN:** First real frame must match actual previous final frame; from frame1 onwards LIVE architecture must continue. Never fade a static last-frame PNG over an animating diagram for 55 frames. Verify first-second decoded motion, retain 2s narrator-free moving world and original voice. [P0 verified root cause](docs/engineering/AT_P0_CONTINUOUS_MOTION_NO_STATIC_PREDECESSOR_COVER_20261114.md).

**DIRECTOR P0 (2026-11-14) — LOCKED SHOTS → ALWAYS AVAILABLE FULL VIDEO:** EP003 SHOT02 V3 is Director LOCKED (render `8598d156-438f-4614-a9dd-ce6172233d9b`, 3443f), together with SHOT01 V2. Every future explicit visual LOCK must rebuild and publish a new playable **EPISODE · FULL VIDEO** in MediaOS containing all sequentially locked SHOTs, with original videos/voices and invisible cuts. First target **SHOT01→SHOT02**, 5957f / 3:18.57; source pins and exact gate: [full cumulative production rule](docs/engineering/AT_DIRECTOR_P0_EPISODE_CUMULATIVE_MASTER_ALWAYS_AVAILABLE_20261114.md).

**P0 2026-11-14 — RELATED TERMS STAY TOGETHER + NARRATOR BREATHING:** During an actual comparison of related spoken technical terms, show each genuine **term + definition** in separate, properly spaced cards simultaneously (EP003 SHOT02: LATENCY ABOVE THROUGHPUT until second spoken comparison ends). Put Throughput's first card at its actual first voice mention as well. SHOT02 must start with the exact predecessor's last frame and 2s of continuously moving narrator-free architecture before original approved audio; shift all real word cues by 60 frames at 30fps rather than regenerate narration. [Full Director rule](docs/engineering/AT_DIRECTOR_P0_PAIRED_TECHNICAL_TERMS_AND_NARRATION_BREATHING_20261114.md).

**P0 — TERM + DEFINITION OR NO FLOATING CARD (2026-11-14):** For every future video, create an informational overlay ONLY when the locked narrator explains a real technical term: concise **TERM + DEFINITION**. Drop repeated metrics, decorative status/punchline panels and generic paraphrases; show engineering consequences in Living Architecture map instead. Read from real aligned voice, hold long enough (>=5.5s baseline), omit if unreadable, avoid overlaps/off-path requests and preserve previous SHOT world/frame continuity. [Full Director rule](docs/engineering/AT_DIRECTOR_P0_TECHNICAL_TERMS_ONLY_INFO_CARDS_20261114.md).

**DIRECTOR P0 — READABLE TEXT OR NO TEXT (2026-11-14):** Every future EP/SHOT may show an on-screen caption or information card only when enough actual narrated time exists for ordinary viewers to read it at full opacity. Initial floor ≥5.5 s per compact two-line card; longer if the wording needs it. If time is too short, **OMIT the card instead of flashing it**. Tests must verify opacity at midpoint, minimum dwell, readable font/fit and no panel/node/path overlap. Identified EP003 SHOT01 source's inverted fade as regression. [P0 full rule](docs/engineering/AT_DIRECTOR_P0_TEXT_DWELL_OR_OMIT_20261114.md).

**EP003 FIRST-TAKE VOICE PRODUCTION (DIRECTOR RULE, 2026-11-13):** Every first paid voice Take for EP003 SHOT01–11 and all future episodes must use **Slow Natural / Generate (slow intake)** from the start. No Standard-first, paid voice regeneration, silent retry or invented audio timestamps. Exact locked narration, voice model/clone, natural pauses, explicit one-shot fee confirmation and server-side guard. [Full Director No-Regeneration Rule](docs/engineering/AT_EP003_SLOW_NATURAL_FIRST_TAKE_NO_REGEN_20261113.md) · [EP003 Voice Factory release PR #273](https://github.com/stefanVasilev17/media-os/pull/273). This docs rule does not establish actual production availability.

**DIRECTOR P0 — GLOBAL VISUAL / MOTION / READABILITY STANDARD (2026-11-13):** **EVERY VIDEO / EVERY SHOT.** No text escaping its card; no panels blocking other panels, Phone or architecture; request particles follow the exact visible path/ports; no animation lag, jitter or hard visual resets; fewer readable information panels, natural explanatory pace, consistent cinematic Remotion Living Architecture world, genuine inherited first-frame/last-frame continuity and authentic animation bridge between connected episodes. Global mandatory [Director P0 Visual Quality, Motion and QA Constitution](docs/engineering/AT_DIRECTOR_P0_GLOBAL_VISUAL_MOTION_AND_QA_20261113.md). Fail closed on critical visual issues, preserve old LOCKED videos, and demand actual MP4 QA plus Director acceptance. The rule is documented; automated checks are separate future engineering work.

**EP003 SCRIPT v0.4 — DIRECTOR LOCKED (2026-11-13):** Final Login Architecture episode “What Happens When One Database Is No Longer Enough?” **complete approved SHOT01–11 narration** is immutable at [EP003 Script v0.4 Director LOCK](docs/episode-memory/plans/2026-11-13-ep003-script-v0-4-director-locked.md). Always consume this original text for EP003 production; do not paraphrase or overwrite, and never substitute previous draft versions. Only SCRIPT is locked; working timelines, voice/Takes, HEAR→SEE, visual continuity media and actual render are pending separate review and paid consent.

**DIRECTOR P0 — INVISIBLE CROSS-SHOT CONTINUITY (2026-11-13):** For every SHOT after SHOT01, the opening rendered visual state must exactly continue the preceding approved SHOT's final visual state, with a smooth moving same-world handoff and gentle narrator-free breathing gap. No visible reset, layout/camera jump, mismatched packets/states or frozen pause. Every actual MP4 seam needs evidence and Director review before LOCK; no unauthorized paid render or changes to approved footage. **Read the absolute [P0 Cross-SHOT Continuity Rule](docs/engineering/AT_DIRECTOR_P0_INVISIBLE_CROSS_SHOT_CONTINUITY_20261113.md) BEFORE ANY EP003+ Script/HEAR→SEE/Remotion work.** This is highest creative/visual priority, subject to protection of locked materials, security and approved spending.

**[PROJECT_STATE.md](PROJECT_STATE.md)** — one central, versioned overview of what is implemented, what was deployed, current blockers and the exact next milestone. **[AGENTS.md](AGENTS.md)** — mandatory first-read instructions and freshness checks for GitHub-connected AI coding agents.

Read both at the start of every new chat. These documents are Git-managed snapshots; check recent merged PRs and Railway deployment before treating them as live truth.

## Canonical product direction

**[Director-LOCKED MediaOS Roadmap v1 — 2026-11-02](docs/engineering/MEDIAOS_ROADMAP_V1_DIRECTOR_LOCK_20261102.md)** is the current product roadmap, technical scope and agent planning authority. It supersedes older README statements about the target production tools. Historical episode files remain available for audit and source provenance.

**Batch-first Director priority (2026-11-04):** [Episode Factory delivery plan](docs/engineering/MEDIAOS_BATCH_FIRST_PRODUCT_DELIVERY_PLAN_20261104.md). Prepare entire episodes as one versioned plan; the planned agents build missing SHOTs in controlled groups and reuse locked scene outputs. The EP002 Batch Planner v1 is an implemented **non-executing** preparation step, not an autonomous multi-SHOT generator.\n\nDirector submits ideas, edits script and HEAR → SEE, chooses voice takes and reviews previews. Agents program and revise Remotion scenes, validate the code, render affected SHOTs and automatically assemble video with chosen audio. The planned **AI Director Revision Loop** accepts precise change feedback and returns a targeted new preview while reusing unchanged assets and renders.

**Creative editing is always open:** Edit → Save → optional, separately confirmed Generate/Regenerate. Earlier script versions and takes are preserved. Production creative content is not forced through repeated LOCK/UNLOCK.

**Episode Package Importer v1 (2026-11-04):** [Deployment handoff](docs/engineering/MEDIAOS_EPISODE_PACKAGE_IMPORTER_V1_HANDOFF_20261104.md) and [JSON schema](docs/contracts/mediaos-episode-package-v1.schema.json). Use **Episodes → Import Episode Package** for new EP003+ approved source files, validated and saved in one upload with all SHOTs marked `PENDING_VOICE`. This is **source-only import**, not a native Voice Studio for these imported tasks. The voice integration, all-shots readiness and separately authorized OpenAI API Agent Executor are still pending. No AI/voice/render API call is made during import.

**Imported Episode Voice Studio v1 (2026-11-04):** [Implementation and restrictions](docs/engineering/MEDIAOS_EPISODE_PACKAGE_VOICE_STUDIO_V1_20261104.md). The Director can open an imported SHOT, Edit → Save working narration, review/play historical Takes and approve a selected current-revision Take. ElevenLabs Generate is independently paid-gated and **disabled by default** until a separate Director server enablement. Full-episode voice readiness and OpenAI API agent authorization remain separate upcoming milestones. Imported original source stays immutable.

**Episode Voice Readiness v1 (2026-11-04):** [Implementation handoff](docs/engineering/MEDIAOS_EPISODE_VOICE_READINESS_GATE_V1_20261104.md). After importing EP003+ and reviewing Takes, the Director sees one whole-episode readiness panel with per-SHOT blockers and actual spoken cue times. Ready is **not** authorization for OpenAI or Remotion execution; the finite OpenAI budget gate and Multi-SHOT Executor are still separate next milestones. Readiness inspection is provider-free and read-only.

**AI Production Authorization v1 (2026-11-04):** [Technical release handoff](docs/engineering/MEDIAOS_EPISODE_AI_PRODUCTION_AUTHORIZATION_V1_20261104.md). After a full imported EP003+ voice-ready check the Director can record an audited episode-level OpenAI budget with USD/token/attempt caps, expiration and revocation. **This is a budget authorization record only**: the future Multi-SHOT Executor must implement one-use consumption and hard measured provider usage stops. The present UI never dispatches OpenAI, generates audio or renders scenes from that button.

**Multi-SHOT Execution Foundation v1 (2026-11-04):** [Verified V117 implementation and handoff](docs/engineering/MEDIAOS_MULTI_SHOT_EXECUTION_FOUNDATION_V1_20261104.md). New EP003+ imported packages support Director-confirmed one-use budget consumption into a single job with every SHOT's approved voice, actual cue timeline and visual source frozen. Existing frontend now shows all batch tasks and a separate cancel action. **No OpenAI agents are launched, no source files generated, no provider charges are incurred by preparing this job.** A future checked agent worker must actually connect GitHub proposal generation, real USD/token metering and another separate execution gate before paid dispatch.

**Reusable Asset Registry + Multi-SHOT Code Worker Preflight v1 (2026-11-04):** [Implementation and next release gates](docs/engineering/MEDIAOS_REUSABLE_ASSET_REGISTRY_AND_CODE_WORKER_PREFLIGHT_20261104.md). Prepared EP003+ jobs can be inspected **all at once**: the Director sees 15 real existing Remotion reference components, what each SHOT can import without modifying approved sources, which new assets are still missing, proposed episode-local file paths and real voice cue frame timing. Source Git blob SHAs come from a historical verified baseline, **not current-execution revalidation**. This preflight does not dispatch OpenAI, write GitHub source, compile generated scenes or render video. Real Multi-SHOT Code Worker + explicit Director Start and cost metering remain the next milestone.

**Live Git Dependency Pin + Multi-SHOT Code Manifest v1 (2026-11-04):** [PR #173 handoff](docs/engineering/MEDIAOS_CODE_WORKER_LIVE_GIT_PIN_AND_BATCH_MANIFEST_20261104.md). Imported EP003+ prepared jobs expose an explicit on-demand, read-only GitHub source/asset pin, provenance comparison for Director-LOCKED assets and full ordered voice/story/cue/component prompt inputs for all SHOTs. Git metadata access can fail closed for a private repo until the Director provisions read-only GitHub access. **No OpenAI Code Worker/paid dispatch, generated TSX, PR or render is started** by this preview. Next: audited Director Start + bounded OpenAI provider usage accounting and isolated Github PR generation.

## Technology

- **MediaOS UI:** React, TypeScript, Vite (mobile-friendly).
- **Backend:** Java 21, Spring Boot, PostgreSQL, Flyway.
- **Voice:** existing ElevenLabs integration with Director-selected take and versioned narration.
- **Visual production:** GitHub-managed React/Remotion components; CPU Render Worker; fully programmatic scene creation, audio sync and assembly.
- **Deployment:** Railway / Docker, with controlled changes and QA.

**Do not treat planned automatic scene generation, revision loop or universal episode assembly as implemented until end-to-end evidence exists.** EP001 assets are protected; EP002 original approved editorial sources are preserved separately from editable drafts.

## Local development

1. Start PostgreSQL: `docker compose up -d db`
2. Backend: `cd backend && ./mvnw spring-boot:run` (or `mvn spring-boot:run`)
3. Frontend: `cd frontend && npm install && npm run dev`

Frontend defaults to http://localhost:5173; backend to http://localhost:8080.

## Core rule

**Creator-directed, agent-executed.** The Director defines intent, reviews, corrects and approves. Every correction becomes versioned production knowledge. Automated production must be safe, auditable, reversible and scoped to affected SHOTs.
