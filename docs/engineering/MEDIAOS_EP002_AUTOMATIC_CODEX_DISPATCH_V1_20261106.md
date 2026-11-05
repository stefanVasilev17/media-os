# MediaOS EP002 — Zero-Manual Codex Remotion Automation

**2026-11-06 — Development candidate in consolidated PR #191.** This is backend/frontend code committed on a feature branch, **NOT merged, tested, deployed or connected to a real Codex account**. Treat all execution as blocked until genuine voice, policy, account and Worker gates pass.

## Director UX and authorization

The Director does not enter or paste prompts in Codex Cloud. Instead MediaOS exposes one automation section in the EP002 Production Factory Console:

- `GET /api/v1/creative/episodes/EP002/codex-automation` returns recorded Director enrollment, the next SHOT, blockers and task receipts; no paid work.
- `GET .../codex-automation/connector-preflight` performs a read-only official CLI ChatGPT login and environment-list check on the configured worker. It starts no remote task.
- `POST .../codex-automation/arm` records explicit Director-authorized, episode-input-fingerprint-bound **one-time consent** for a maximum of 1–20 sequential Remotion-only Cloud task submissions (default 10); it does not launch a task synchronously. It requires the existing global creation audit, Director identity and request UUID.
- `POST .../codex-automation/pause` stops future submissions; it does **not** retroactively cancel any already dispatched Codex Cloud task.
- `Ep002CodexAutomationService.poll` checks the current registered Director context and every required verified source/voice/cue/visual policy gate before ever considering a task. Polling defaults **OFF**. When explicitly enabled, it can claim exactly one qualifying SHOT, save SUBMISSION_STARTED in PostgreSQL before external I/O, then use the authorized CLI for one submission attempt.
- The input fingerprint stales the enrollment when the working script/Take or episode plan changes. Only a newly authorized current source may run. The episode must not silently reuse previously revoked/paused consent.
- No next SHOT before the prior MP4 has a real individual Director acceptance receipt. Existing EP002 SHOT01 is protected and never generated.
- No generic Java/React/SQL task is submitted to Codex; fixed Remotion-only prompt, episode-local output path and exact protected assets/visual rule references are required.

## Actual CLI transport, strict OFF-by-default

`CodexCloudCliGateway` uses only the official `codex cloud exec --env ... --branch main --attempts 1` command. Java ProcessBuilder passes a bounded single argument, **not a shell**, with a strict environment-name allowlist and ≤30k-character task; API-key environment variables are removed from the child process. It first checks `codex login status` for the exact ChatGPT login indication, then `codex cloud list --env ... --json` for the requested published environment. If a protected private Git checkout or valid account/environment is unavailable, it returns BLOCKED, not an API-backed substitute.

Required configuration on a separately Director-authorized, secured Codex worker:

| Setting | Default | Meaning |
|---|---|---|
| `mediaos.codex.automation.dispatch-enabled` | `false` | Enables automatic polling and submissions from valid enrolled Directors |
| `mediaos.codex.automation.poll-delay-ms` | `60000` | Safe scheduling delay |
| `mediaos.codex.cloud-cli-enabled` | `false` | Allows official CLI read/submission on dedicated trusted worker |
| `mediaos.codex.cloud-environment-id` | blank | Exact published Cloud environment ID verified against ChatGPT login |
| `mediaos.codex.checkout-directory` | blank | Trusted Git checkout containing `.git` for `stefanVasilev17/media-os` |

**Do not enable any flag in Railway production without a successful private canary, real account authorization, confirmed repository access and Director permission.** Never copy a ChatGPT session cookie, undocumented internal API token, browser local storage or someone else's `auth.json` into Railway. The user must use a supported authorization flow; a backend's ordinary OpenAI API key does not use the ChatGPT plan allowance. No CLI binary or private ChatGPT login was installed/configured by this PR.

Current upstream limitation: published *new-generation* Cloud environments may not be discoverable from the official CLI; see public openai/codex GitHub issues #50182, #56350 and #58145 as of 2026-11-06. In that case automatic CLI dispatch **will NOT work**, even though the environment is visible in the web or desktop client. The correct behavior is STOP with `CODEX_CLOUD_ENVIRONMENT_NOT_DISCOVERABLE_BY_CLI`. An official, separately verified Codex app-server + Sign in with ChatGPT plan on a managed remote worker may be considered, but is **not Codex Cloud** and may require app registration and user consent. Do not silently swap providers or charge OpenAI API.

## Database state, retry safety and observability

Flyway `V123__ep002_codex_zero_manual_automation.sql` creates an episode-bound Director enrollment and a persistent task table, each with immutable source/task fingerprints. It enforces **one globally active EP002 cloud task** by a partial unique index. Task states include PENDING, SUBMISSION_STARTED, REMOTE_CREATED, REMOTE_UNKNOWN, REMOTE_FAILED, COMPLETE_ACCEPTED, CANCELLED.

- One-shot external dispatch is committed as SUBMISSION_STARTED before the CLI process starts.
- If Codex returns a real task ID, MediaOS stores REMOTE_CREATED; if the response is ambiguous, timed out, interrupted, process failed or DB update is uncertain, the task remains/enters a non-retryable quarantine status. No duplicate subscription usage from automatic retries.
- A task is marked COMPLETE_ACCEPTED only against an existing evidence-backed Director acceptance for that exact shot/fingerprint. That allows the next SHOT, never automatically approves one.
- Manual task entry is not an accepted fallback. Missing official integration is a **product blocker**. Director corrections remain review-only until a rendered fix is accepted.
- The configured scheduler catches and logs only failure categories, never narration, tokens or account credentials.

## Tests and real operational blockers

Test source now includes bounded consent, disabled adapter no-submission, command arguments and unsafe input rejection, Director exact write authorization, preflight audit and anti-cross-episode header handling, and Flyway V123 table verification in isolated PostgreSQL. **Tests NOT executed**: private repo Maven/Node/Postgres runner is unavailable through current connected GitHub tool; GitHub Actions remain disabled.

Product blockers (not optional):

1. EP002: 11 approved working voice Takes, actual measured durations and all **59 Director-reviewed, provider-grounded HEAR→SEE event frames**. Current EP002 source bridge correctly returns zero verified timed SHOTs. The task prompt needs an exact verified cue payload; the dispatcher stays blocked until that is added and incorporated, not merely referenced.
2. Review and pin four shared visual policy source blobs. No live private backend GitHub read token is configured; connected ChatGPT GitHub access is not a backend OAuth credential.
3. Actual Codex Cloud published environment discoverability under the official CLI with the Director's ChatGPT plan; private repo Git checkout and supported secured account authorization. Do not assume compatibility from CLI version alone.
4. Worker integration for generated EP002 SHOT02–11 Remotion scenes, verified CI-free build, real SHA-pinned CPU-authorized preview, individual Director review, and safe SHOT01 reuse.
5. Automatic discovery/verification of completed Codex Cloud task and resulting GitHub PR, monitoring/cancellation, and scoped automated correction loop are **not yet complete**. A recorded remote task ID is not a completed PR.
6. Long-form video object storage beyond the current per-render 256 MB PostgreSQL BYTEA cap; actual 1080p Master + three separately reviewed Shorts; full Java21 Maven/Postgres/TypeScript/Vite/Remotion and authenticated browser QA.

The generated code path currently remains **blocked even if an enrollment is saved**: `Ep002SequentialVisualPreflightService.project` retains fail-closed real cue/policy/worker requirements, and no task was created or sent. The only legitimate release definition is a complete, verified EP002 video plus three Shorts and final Director acceptance.

## Engineering next steps

Implement actual per-beat voice alignment with selected Take and Director-approved semantic anchors; verify remote Cloud environment via official subscription login and pre-dispatch canary; implement typed per-SHOT prompt with exact cue frames and pinned component/source SHA, remote lifecycle/PR and Worker integration; use isolated real Maven+Postgres+TS test environment; then approve a bounded production test. No CLI account setup, provider calls, paid ElevenLabs requests, CPU renders, merges or deployments were initiated by writing this file.
