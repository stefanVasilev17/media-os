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
