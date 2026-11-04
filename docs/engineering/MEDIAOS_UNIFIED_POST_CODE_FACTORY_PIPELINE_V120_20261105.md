# MediaOS — Unified Post-Codex Factory V120: Source QA, SHOT Rendering, Director Loop, Master & Three Shorts

**Date:** 2026-11-05 · New EP003+ post-Codex workflow. This capability is intentionally built **BEFORE** the Director connects Codex Cloud. It does not itself launch a Codex task or make paid OpenAI API calls.

## Non-negotiable order and boundaries

The approved sequence is:

`FILE → VOICE → VERIFIED HEAR→SEE → V119 Codex Cloud handoff → Codex PR → protected source QA → independently compiled worker → separately consented SHOT render → Director reviews all SHOTs → separately consented master → separately consented THREE Shorts → final Director approval`.

Director may request scoped changes after a preview, then an independent Codex PR re-enters source verification and selective rendering. EP001 and EP002 original/Director-LOCKED visual content, protected `Root.tsx`, reusable architecture components, voice Takes and original scripts must never be changed by this pipeline.

### What is implemented in V120

- **V120 PostgreSQL factory state:** one immutable whole-episode run tied to a real V119 approved voice input, all ordered SHOTs, source Git hash, real selected Take and exact frame duration, three separate named output kinds, bounded CPU receipts, Director feedback, PR revisions, QA review approvals and worker capability attestations. History is retained; idempotent Director request UUIDs do not double-issue operations.
- **GitHub code QA:** a Director-triggered read-only inspection of the actual merged PR in `stefanVasilev17/media-os`. It rejects any file outside `remotion-engine/src/episodes/epNNN/`, any protected EP001/EP002 edit, missing SHOT, altered requested commit blob, forks or missing/private credentials. It checks every generated scene's merged SHA and reports review-only Git evidence as **source-scoped, build still required**. A follow-up PR for scoped feedback may contain only the explicitly changed SHOTs and new episode-local helper files; all SHOT scene blobs are rechecked against the merge commit.
- **Isolated worker build:** `remotion-engine/generate-factory-registry.mjs` auto-discovers exact `ShotNNGeneratedScene.tsx` filenames and exports `ShotNNGeneratedScene` under an independent `AT-FACTORY-SHOT` composition rooted in `src/factory/FactoryRoot.tsx`; no protected Remotion `Root.tsx` edits. `validate-factory-scenes.mjs` runs before the bundle, denies external Node/shell/network side effects, unsafe imports and EP001/EP002 imports. Worker image runs Node tests, TS preflight and both original and factory Remotion bundles. Worker supplies its exact release commit and compiled-scene inventory to authenticated `POST .../worker/factory-capability`; a later render requires the same SHA and a recent heartbeat.
- **Actual SHOT render pipeline:** only an explicit Director action creates rows in `remotion_render`. CPU consent is one request UUID, a source digest and a maximum frame bound, separate for `SHOTS`, `MASTER`, `SHORTS`. Worker claims only source-matching jobs. A SHOT uses real current Director-selected audio via worker-authenticated GET, muxes it with FFmpeg, probes H.264/30fps AAC and exact duration, and links output to source+voice fingerprints. A stale Take/PR or feedback invalidates the result. Exact unchanged per-scene Git blob/Take/frames/catalog hashes permit selective reuse; touched SHOTs and any SHOT affected by changed helper source are invalidated.
- **Director SHOT review:** displays current MP4s, requires deliberate review and records the entire approved-shot set with input+render digest. No single SHOT is marked Director-approved by an agent or by auto-render completion.
- **Master assembly:** explicit separately bounded CPU approval queues an `AT-FACTORY-MASTER` job. Worker only downloads the current Director-approved SHOT MP4 IDs via a worker-authenticated API, concatenates their original audio/video order and produces a 1920×1080/30fps MP4. FFmpeg/ffprobe verifies A/V codecs, dimensions and duration before accepting output. Never assemble from unreviewed or stale sources.
- **Three Shorts drafts:** three distinct 20–45-second non-overlapping windows from the true measured full-episode 30fps timeline, one 1080×1920 MP4 each, preserve source voice audio, use blurred full-screen backdrop and scaled full-diagram foreground. These are **technical draft windows**, not guaranteed strong viral hook selections. Director must watch and approve all three; title, hook framing and editorial crop remain human decisions. No automatic YouTube publication.
- **Director revision loop:** feedback stored by episode/optional SHOT, category, immutable source SHA and Director identity. UI constructs one scoped Codex task, records a follow-up PR as UNVERIFIED, rechecks merged source and SHA, resolves only verified feedback, and retains unchanged SHOT outputs when the code/voice dependencies are identical. No automatic agent launch through ChatGPT subscription.
- **Final approval:** requires all reviewed SHOT MP4s, one SUCCEEDED full master and all three SUCCEEDED Shorts, exact source SHA, current voice, zero open revision feedback and explicit Director confirmation. Immutable approval stored; NEVER publication consent.

### Director UI

Open `https://media-os-backend-production.up.railway.app/#/episodes/import` or **Episodes → Import Episode Package → select EP003+**. Below the V119 Codex Cloud handoff is **Unified Production · QA → SHOTs → Master → Shorts**. Prepare a run, verify GH source, inspect worker SHA readiness, request one bounded render batch, review each SHOT, approve the SHOT set, separately queue master and Shorts, and give final approval. At any point record feedback and inspect the next PR without losing approved voice.

### API

`GET /api/v1/episode-packages/{packageId}/factory-production/runs`
`POST /api/v1/episode-packages/{packageId}/factory-production/runs`
`GET /api/v1/episode-packages/{packageId}/factory-production/runs/{runId}`
`POST .../runs/{runId}/verify-github` read-only repo audit with recorded result if verified
`POST .../runs/{runId}/feedback` and `POST .../runs/{runId}/revision-pr`
`GET .../runs/{runId}/build-evidence`
`POST .../runs/{runId}/queue-shots`
`POST .../runs/{runId}/approve-shots`
`POST .../runs/{runId}/queue-master`
`POST .../runs/{runId}/queue-shorts`
`POST .../runs/{runId}/approve-final`

Worker-only endpoints (must authenticate): `POST /api/v1/remotion/renders/worker/factory-capability`, `GET .../worker/{renderId}/factory-selected-voice`, `GET .../worker/{targetId}/factory-source/{sourceId}`.

### Remaining honest real-world acceptance / necessary configuration

1. **Codex setup deferred at Director's explicit request.** No actual completed EP003+ scene generation, reviewed GitHub PR, selected voice e2e render, 15-minute full master or Shorts may be claimed before real task and media tests. The modules are designed to fail closed until this evidence exists.
2. Private GitHub automatic verification from Railway requires separately authorized **read-only `MEDIA_OS_GITHUB_READ_TOKEN`**; the ChatGPT GitHub connector is not a backend token. Without it `verify-github` blocks safely. Never copy connector secrets without explicit Director action.
3. The current `remotion_render.video_data` PostgreSQL object stores up to **256 MB per MP4**. Full-length master may fail to upload if too large. A separately approved durable MediaOS video object-storage bucket is required for reliable high-quality 14–18-minute 1080p final delivery. Do not silently use the existing **production recovery bucket** or pay for new storage.
4. A real SHA-matched worker release must be promoted from the exact Git merge commit. This cannot be inferred from a PR merge; existing explicit Railway promotion marker governs deploys. The backend's source check never substitutes for actual compiled worker evidence.
5. CPU credits are infrastructure costs even though no OpenAI token usage occurs. The pipeline creates no paid CPU jobs until Director confirms an exact bounded frame count; no automatic retries. Storage preflight/incident reconciliation continues to apply. Uncertain ElevenLabs historical voice alignment remains frozen.
6. Actual browser session QA with Director and real EP003+ data, generated scene human design QA, performance/load tests, object storage and YouTube publishing remain separate acceptance points. The code path being deployed is not a completed produced movie.

### Evidence

Record exact tested commit, Java21 Maven tests, frontend TS/Vite, worker Node+Remotion bundle, Flyway V120 and Railway backend+render-worker source SHA and health when those **actually pass**. Keep `PROJECT_STATE.md` and `AGENTS.md` synchronized; do not equate static code or unit tests with actual e2e video production.
