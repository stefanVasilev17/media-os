# MediaOS Episode Package Importer v1 — implementation handoff

Date: 2026-11-04 (Europe/Sofia)

## Director-approved goal

The Director and ChatGPT collaboratively prepare one **approved Episode Package v1 JSON** containing an entire script and visual storyline, which is then imported into MediaOS before voice recording and before any OpenAI API visual-agent execution. The import must create all shot/voice preparation tasks in one auditable operation and **must not spend OpenAI, ElevenLabs or Remotion CPU budget**. Existing EP001 and Director-LOCKED EP002 SHOT01 remain untouched.

## Scope in first importer release

- UI: Episodes screen adds **Import Episode Package**, routed to `#/episode-packages/import`. Director uploads one `.json` file (up to 512 KiB), sees a local SHOT/visual beat preview and SHA-256, explicitly confirms import, and reviews saved packages and their individual voice tasks.
- Backend: `EpisodePackageValidator` validates package v1 structure, unexpected keys, unique/ordered `SHOT01…SHOT40`, approved source status, duration, English narration, voice directions, literal HEAR → SEE cues, exact Shorts references and size limits. Checks hash as calculated by browser; duplicate keys rejected. Ep001/Ep002 imports rejected to protect existing production.
- `EpisodePackageImportController`: Director-authenticated `GET /api/v1/episode-packages`, `GET /api/v1/episode-packages/{packageId}`, and audited `POST /api/v1/episode-packages/import`. The POST body carries UUID request ID, filename, original JSON text, expected SHA-256 and explicit source-only consent.
- `EpisodePackageImportService`: one DB transaction creates immutable `episode_package_import` and one `episode_package_shot` per source SHOT with `PENDING_VOICE`; SHA, exact original raw text, normalized JSON, source file name, Director identity and creation preflight audit ID stored. No agent thread or audio generation. Idempotent request UUID replay must match same actor and content hash; same episode key cannot overwrite existing import or native episode. Source is immutable; later creative editing requires separate working-revision layer, not mutation of archived originals.
- Flyway V114 adds independent imported-source/shot tables. The legacy native `episode` table and existing EP001/EP002 sources/shot renders are **not changed**. Import is designed to be episode-agnostic while existing EP002 fixed-source Batch Planner remains untouched.

## Intentional product limitations (MUST NOT MISREPRESENT)

- **The first importer does not yet create a full native episode row or connect PENDING_VOICE tasks to the existing native Voice Studio.** Director can inspect all imported voice tasks but cannot yet Generate/Approve audio from this new page. The next required step is universal editable working shot revisions + Voice Studio connection; do not use the fixed EP002 Creative Voice service for EP003.
- No episode-wide Voice Readiness Gate or OpenAI API budget authorization has been implemented. Multi-SHOT Agent Executor, incremental render, full assembly and Shorts production remain pending.
- This importer doesn't rewrite older canonical Script v4/Visual Pass sources, and does not import EP002 over existing Director-LOCKED content.
- No AI calls, TTS, GitHub Actions, Remotion rendering, new worker deploy or auto-code generation.
- Strict validation implemented in Java without pulling a new JSON Schema dependency. The schema JSON in `docs/contracts` is the canonical external exchange contract; keep any future schema updates in sync with server validation.

## Verification gates and next work

Run existing Railway backend Dockerfile Java 21 Maven tests + frontend TypeScript/Vite. Only promote after build PASS. Verify Flyway V114 applied and healthy backend, preserve existing Remotion Worker. PostgreSQL integration tests requiring an isolated DB may remain skipped: do not claim browser-end-to-end upload until a Director tests with a new EP003+ approved file.

**NEXT:** versioned editable working narrations from imported shots, universal voice generation/playback/approval with real ElevenLabs timestamps and explicit individual cost consent; Episode Voice Readiness; finite OpenAI spend authorization; then bounded Multi-SHOT Agent Executor.

See `MEDIAOS_VOICE_FIRST_EPISODE_INTAKE_GATE_20261104.md` for the required FILE → VOICE → AI order.
