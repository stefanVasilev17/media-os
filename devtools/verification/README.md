# CLOUD-ONLY RELEASE REQUIREMENT — 2026-11-06

**Supersedes the local/standalone Docker worker deployment guidance below.** The Director explicitly requires MediaOS to operate without a personal computer, home server or independently managed VM. The long-running `verification-worker.mjs`, `verify-mediaos.sh`, `verify-mediaos.ps1` and V125 queue implementation remain optional experimental source and are **NOT required** to launch the product. Do not ask the Director to run a host or keep a laptop switched on.

**Preferred cloud QA route:** build `Dockerfile.mediaos-cloud-release-verification` through a separately authorized **Railway managed QA service** on the pinned PR branch. Its image-build stages run frontend and Remotion checks, GPU tests and Maven/Java21/Flyway integration against a temporary PostgreSQL18 instance started within the build stage. There is no GitHub Actions, persistent test database or Docker-in-Docker runtime. The cloud build result and reports must be verified from Railway's real deployment/build logs; it is not green until that actually happens. Do NOT create a Railway service/environment or trigger a paid build without explicit Director authorization.

The hosted MediaOS API, PostgreSQL and Remotion render worker already exist in Railway's production environment. A suitable staging environment and fully authorized hosted Codex connector are **not yet operational**. Hosted Sign in with ChatGPT is an eligibility-dependent provider integration; a local `codex login` token is not a permissible substitute for hosted application authorization. Code can be prepared without connecting a personal computer.

---

# MediaOS — Independent Release Verification (NO GitHub Actions)

Director decision: **Do not run or ask to enable GitHub Actions.** The code is stored and reviewed in GitHub, while Java 21, PostgreSQL, React and Remotion verification is done using isolated Docker containers. This setup **does not connect to Railway production** and does not run ElevenLabs, Codex, Remotion renders or other paid-provider operations.

## Start an isolated verification

Prerequisite: Docker Engine with the Compose plugin / Docker Desktop. Use a working copy of the `feat/mediaos-ep002-unified-product-integration` branch containing this directory.

- **Windows PowerShell:** `./scripts/verify-mediaos.ps1`
- **Linux/macOS/WSL:** `bash scripts/verify-mediaos.sh`

Each script uses a unique Docker Compose project name, creates a temporary PostgreSQL 18 service with no published ports, and runs these gates in order:

1. Existing Python checks of the asset catalog and memory IDs.
2. Java 21 Maven `clean verify` including isolated PostgreSQL/Flyway migration tests. Only the internal test database is reachable as `localhost:5432` from this container.
3. React frontend `npm install --no-audit --no-fund`, `npm run build`, `npm test`.
4. Remotion `npm install --no-audit --no-fund`, `npm run typecheck`, `node --test *.test.mjs` and `npm run build:factory`. This bundles and verifies source **without generating a video**.

A nonzero exit immediately fails the run. The scripts always tear down their own containers, Docker volumes and temporary database. Any existing Railway/PostgreSQL services and protected EP001/EP002 Remotion scenes are left alone. First execution requires Docker image downloads, Maven package downloads and npm package downloads; this can use local bandwidth and disk storage but does not dispatch tasks to Codex or bill a provider API.

## Safety and current state

This is a **new verification mechanism, not evidence that the code has passed it**. No run has been performed in this development environment because the private GitHub working copy and Docker Engine are not available here. Do not merge, deploy or mark release-ready before all four commands actually succeed and their exit codes/logs are reviewed.

The test harness mounts the working repository as a writable directory, so Maven/npm may produce standard build files inside the checkout. Use an isolated clone/worktree, not your production application filesystem. Keep any real `.env`/credentials out of the test checkout. The ephemeral database uses deliberately non-production `media_os` test credentials, which must never be used to connect to a real service.

For future hands-free operation, a **separately authorized MediaOS verification worker** can invoke this same script after receiving a specific immutable Git commit. That worker must report each command's real exit code and the exact source SHA; saving a PR or a queued job is never a test pass. Do not connect this worker to a Docker daemon containing production workloads, and do not enable extra paid infrastructure without explicit Director approval.

**Not provided here:** staging deployment, real one-time ChatGPT Codex authentication, live EP002 generated-scene production, audio/voice approvals, CPU-render previews, Master and Shorts. These remain explicit product-release gates.


## MediaOS-managed automatic verification worker (new V125 source, not deployed)

`verification-worker.mjs` is a **standalone Node 22 process for a dedicated, isolated Docker host**. This host must not run Railway production services, contain production database credentials, or expose a Docker socket to MediaOS. The worker polls MediaOS over HTTPS; there are no GitHub Actions, GitHub webhooks, inbound worker ports, application shell access or paid AI requests.

The Director sees two panels under the EP002 Remotion coding stage:

1. **Automatic Git Commit Verification:** one-time, audited consent to monitor the exact private PR #191 head, limited to 1–20 new SHA revisions. The backend polls GitHub through a separately authorized read-only repository credential. Each newly verified SHA is queued once. Failed/unknown results are not automatically retried. Pause cancels unclaimed jobs but does not kill an already-running container.
2. **Independent MediaOS Verification:** current PR SHA (read from private GitHub API, never typed by the Director), queued/running/passed/failed/unknown jobs, four precise stage exit codes, and explicit cancellation for an unclaimed/uncertain job. The panel also supports a single Director-authorized manual run, without opening a terminal.

The backend uses Flyway V125 (`mediaos_verification_run`, `mediaos_verification_auto_policy`) and pre-existing scoped workload credentials with a new `VERIFICATION` scope. Only POST `/api/v1/worker/verification/claim` and POST `/api/v1/worker/verification/{runId}/complete` are permitted to that role. A worker may neither claim a Remotion render nor perform Director actions. The server never provides code, commands, credentials or a repository URL from a user-supplied request; all allowed source and test stages are fixed in code.

### One-time setup required on an authorized isolated host

- Enable the existing verified Director login and `mediaos.worker-auth.enabled=true` in an **isolated staging environment first**. Enable `mediaos.verification.enabled=true` only after V125 has migrated successfully.
- Configure a least-privilege `MEDIA_OS_GITHUB_READ_TOKEN` for the MediaOS backend so it can read the current private PR #191 metadata; this is **not** the ChatGPT GitHub connector's authorization and should never be pasted into a chat.
- Using the existing `WorkloadCredentialOfflineCli` and audited offline maintenance procedure, provision a high-entropy, time-limited credential with scope `VERIFICATION` for a dedicated worker ID. The existing credential system limits issuance to 24 hours: credential renewal or explicitly approved rotation is required for longer-term unattended operation. Do not repurpose a Remotion CPU secret.
- On a dedicated Node 22 + Git + Docker Compose host, configure the worker's protected environment with `MEDIAOS_VERIFICATION_WORKER_ENABLED=true`, `MEDIAOS_URL=https://<your-mediaos-staging-host>`, `MEDIAOS_VERIFICATION_WORKER_ID=<audited-worker-id>`, and `MEDIAOS_VERIFICATION_WORKLOAD_TOKEN=<secret-from-offline-issuance>`. Give Git on that host separately authorized **read-only** access to the private repository using its standard credential helper, never a token embedded in the URL. Then start `node devtools/verification/verification-worker.mjs` under a system service manager.
- The host must have enough disk/network allowance to pull isolated Docker images and build Maven/npm dependencies. The test runner clones the exact allowed branch into a new temporary directory, checks its commit against the Director-approved SHA, executes the **four fixed stages** in order, sends only bounded exit codes and durations to MediaOS, then destroys the test containers, volumes and clone. Any source mismatch or interruption reports failure/unknown; a timed-out run is never retried automatically.

**Important:** Ordinary Railway app containers may not provide a privileged Docker Engine. Do **not** assume that deploying this Node worker as a standard Railway service will be able to execute `docker compose`; use a verified standalone Docker host, or implement an explicitly approved alternative isolated runner. No new Railway service, paid VM, login, secret or deployment was created by this PR.

### Release proof that must be observed

1. The actual worker is provisioned and successfully authenticates with the dedicated `VERIFICATION` scope.
2. Director authorizes one source SHA; the worker claims the saved lease, clones exactly that SHA and runs all four build/test stages.
3. `PASSED` is visible in the MediaOS dashboard only after four ordered exit-code-zero reports from that worker. Any non-zero stage is `FAILED` with no automatic retry.
4. Director authorizes up to five future SHA revisions once, and a new PR commit is automatically detected and queued without GitHub Actions.
5. A disabled worker, mismatched commit, spoofed repo, expired credential, untrusted Git source or lost lease fails closed, without switching to any paid provider API.

This infrastructure is **code committed in a Draft PR only**. Real Docker verification, authenticated browser QA and deployment are NOT confirmed. End-to-end EP002 production and Codex subscription login remain separate requirements.


## 2026-11-06 verification hardening before first real worker run

The original V125 SQL was found to contain a corrupt `last_queued_commit` check constraint. **The committed migration has now been fully replaced** with correctly ordered policy/run tables, required foreign keys, the unique active queue index and a single scoped credential ALTER. A static SQL structure scan passed, but actual PostgreSQL migration testing has NOT happened.

The installed worker now resolves the trusted Compose file relative to **its own installation directory**, never relative to a mutable PR clone. Its Docker source mount is set to the approved temporary exact-SHA checkout by `MEDIAOS_VERIFICATION_SOURCE_ROOT`; the default relative mount remains available only for an intentional local manual run. Git fetches the exact requested SHA and checks it out detached, even when new commits have moved the branch tip. Before starting tests, it validates the installed Compose manifest via `docker compose config --quiet`. The four application test services have bounded CPU, memory and process counts, drop capabilities and forbid privilege escalation. The polling worker rejects invalid UUIDs, refuses HTTP redirects with its scoped token and strips API tokens and unsafe Git config overrides from child process environments.

**Required trust boundary:** install the Node worker **and** its Compose manifest from the reviewed trusted deployment as a pair, outside the temporary, untrusted PR checkout. If you run the worker from the same mutable checkout that is being tested, source-code verification and isolation are not established. Build/test outputs can execute arbitrary project build scripts: run them only on a disposable dedicated Docker host with no production host mounts, no production database connectivity and no cloud secrets. These safeguards reduce but do not eliminate risks associated with untrusted code and Docker.

Thirteen pure-function/static source checks passed after these changes. They do NOT verify Spring compilation, a PostgreSQL migration, Node subprocess integration or Docker Compose on an actual host. No tests or deployment have been claimed successful.
