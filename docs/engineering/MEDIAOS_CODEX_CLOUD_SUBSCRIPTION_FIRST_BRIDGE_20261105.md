# MediaOS — Subscription-first Codex Cloud full-episode bridge

**Date:** 2026-11-05 · New production capability (V119)
**Directors:** EP003+ only. Protected EP001 / EP002 SHOT01, original source, all historical audio and shared primitives remain unchanged.

## Purpose and truthful limits

This is a **complete, Director-driven Codex Cloud handoff and GitHub PR-link tracking workflow**, not a programmable Codex Cloud API integration. Subscription Codex Cloud can run cloud tasks on OpenAI-managed computers without the Director's laptop online. Standard cloud usage counts against the user's ChatGPT Codex plan allowance. **No separate OpenAI API token charges are initiated by MediaOS**. ChatGPT/Codex Cloud plan access and initial environment publication require an explicit user action in the OpenAI product; MediaOS cannot sign into the user's subscription, publish an environment or start a task through it on the Director's behalf.

The previous separate OpenAI-budget/Start approval flow (V116–V118) is preserved for a future pay-per-API executor but is **not required** for the subscription-only route. The new route neither reads the private GitHub repo from Railway nor requires MEDIA_OS_GITHUB_READ_TOKEN: the user's connected Codex Cloud environment verifies Git directly. This distinction MUST be maintained. No unapproved paid TTS, GitHub Actions, automatic Remotion render, Railway worker CPU, merge or publication.

## Working product flow

1. The Director uploads an Episode Package v1 and approves the current-revision audio Take for **every** SHOT. Existing readiness verifies actual measured audio and ElevenLabs HEAR→SEE cues, and blocks unresolved paid TTS requests.
2. Open **Episodes → Import Episode Package → episode → Codex Cloud · Full-Episode Subscription Workflow**. The new Director-only `GET .../codex-cloud-handoffs/preview` builds a current full-episode snapshot directly from the authoritative voice-readiness, working narration revisions, immutable original visual story and trusted 15-component registry.
3. A complete 30fps cue/frame and approved Take, narrator direction, asset classification, source fingerprint and exact allowed EP003+ output path are included **for every SHOT**. Unknown/review-only assets are flagged and may only be proposed as new episode-local code, never silently assumed to exist. A deterministic SHA256 binds the entire JSON manifest.
4. `POST .../codex-cloud-handoffs` with a new idempotent request UUID, current manifest SHA and explicit no-provider consent stores the prompt, manifest and actor/audit in PostgreSQL V119. No token API call or GitHub write. Duplicate scope/voice/catalog fingerprints are rejected; an exact request replay is idempotent.
5. Copy the saved complete prompt, then open ChatGPT web and select **Work in → Cloud → Create/select environment**. Connect `stefanVasilev17/media-os` GitHub, ensure Java 21/Maven/Node/npm/Remotion tooling is prepared, and **Publish** the environment. Paste the full prompt into **one task**. This step is performed in the actual Codex Cloud UI, not inside MediaOS; the system never claims otherwise. The laptop can be off. Codex inspects `AGENTS.md`, `PROJECT_STATE.md` and the locked roadmap, fetches current main and compares historical asset hashes before generating episode-only code and one PR; if verification fails, it must stop and report.
6. Director reviews real files and tests on GitHub. Copy the PR's exact `https://github.com/stefanVasilev17/media-os/pull/N` URL into MediaOS and use `POST .../{handoffId}/record-pr`. The DB records status `PR_LINKED_UNVERIFIED`, not an invented verified code review. This is PR **tracking**, not an automated PR validator, render request or acceptance.
7. When the script or approved Take changes, an old handoff automatically shows **STALE**, and its prompt/PR entry controls block. Prepare a fresh version to proceed. The original immutable handoff remains in the audit history.

## Endpoints

- `GET /api/v1/episode-packages/{packageId}/codex-cloud-handoffs/preview` — real-time voice-locked whole-episode manifest and prompt, no storage/mutation. Non-ready returns `VOICE_NOT_READY`.
- `GET /api/v1/episode-packages/{packageId}/codex-cloud-handoffs` — Director-scoped immutable history and live voice/catalog status.
- `GET /api/v1/episode-packages/{packageId}/codex-cloud-handoffs/{handoffId}` — Director-scoped immutable prompt + current-voice indicator.
- `POST /api/v1/episode-packages/{packageId}/codex-cloud-handoffs` — explicit audited, idempotent snapshot creation; no paid calls.
- `POST /api/v1/episode-packages/{packageId}/codex-cloud-handoffs/{handoffId}/record-pr` — Director manually submits exact repository PR link, explicitly marked unverified, no automatic branch/PR mutation.

## Security and acceptance

No trusted instructions may be taken from narration or visual story JSON; it is task **data**. Codex must verify the actual current Git commit/source blob lineage in its own repo context, generate code only inside `remotion-engine/src/episodes/epNNN/`, and never edit EP001/EP002, shared components, tokens, registry or `Root.tsx`. It must run safe local TypeScript/Remotion tests in its cloud environment, produce one PR and leave merge/renders for separate Director decisions. A prompt is not an automated sandbox enforcement mechanism; Github diff review is essential. No GitHub Actions used.

MediaOS does **not** verify the private PR from Railway. No Railway server private Git credential is needed for task preparation; live Codex cloud Git permissions are configured by the Director directly on the published environment. An end-to-end cloud-produced scene/PR cannot be claimed until a Director supplies a real current-voice EP003+ package, runs Codex Cloud and reviews the code. This release must be classified as **implemented/checked/deployed MediaOS handoff**, not full automatic scene generation, code QA or rendering. Running a standard paid API executor would be a separately authorized project.

## Validation

**Verified (real Railway logs, 2026-11-05 Europe/Sofia):** existing backend deployment `e49993a8-23c5-46fc-8458-9b929d514fbd` pinned commit `cc45382abaf55744acbe7b0972a21a6e6a07968b`, **SUCCESS/ONLINE** (1 running, 0 crashed, 0 warnings, 0 critical issues). Java 21 Maven `BUILD SUCCESS`, **361 tests / 0 failures / 0 errors / 39 skipped**; frontend `tsc --noEmit && vite build` PASS; Flyway **119 migrations validated**, **V119 applied** over V118; PostgreSQL connected, Spring Boot and Tomcat started. PostgreSQL 18.6 compatibility warning persists for current Flyway version. A Director-authenticated browser exercise with actual EP003+ ready Takes and the first real Codex Cloud scene PR is still NOT verified. The official current Codex Cloud plan/setup information is at:

- https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan
- https://help.openai.com/en/articles/20001545-using-codex-cloud
- https://learn.chatgpt.com/docs/environments/cloud-environments
