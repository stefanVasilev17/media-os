# MediaOS — Architectural Thinking

**Director-first, agent-executed AI video production operating system.**

## Start here — live project handoff

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
