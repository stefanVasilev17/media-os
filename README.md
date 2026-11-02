# MediaOS — Architectural Thinking

**Director-first, agent-executed AI video production operating system.**

## Canonical product direction

**[Director-LOCKED MediaOS Roadmap v1 — 2026-11-02](docs/engineering/MEDIAOS_ROADMAP_V1_DIRECTOR_LOCK_20261102.md)** is the current product roadmap, technical scope and agent planning authority. It supersedes older README statements about the target production tools. Historical episode files remain available for audit and source provenance.

Director submits ideas, edits script and HEAR → SEE, chooses voice takes and reviews previews. Agents program and revise Remotion scenes, validate the code, render affected SHOTs and automatically assemble video with chosen audio. The planned **AI Director Revision Loop** accepts precise change feedback and returns a targeted new preview while reusing unchanged assets and renders.

**Creative editing is always open:** Edit → Save → optional, separately confirmed Generate/Regenerate. Earlier script versions and takes are preserved. Production creative content is not forced through repeated LOCK/UNLOCK.

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
