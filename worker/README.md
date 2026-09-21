# Media OS — Spline Production Worker

This worker is the local bridge between the cloud-hosted Media OS and Spline Desktop.

Architecture:

Media OS / Railway → approved queued production job → Windows Local Runner → Spline worker → Codex → local Spline MCP → focused Spline 3D tab → verified result back to Media OS.

The cloud backend never connects directly to Spline MCP. Spline MCP is intentionally local-only.

## One-time prerequisites

1. Install and open Spline Desktop on the Windows production machine.
2. In Spline open Settings → MCP and ensure the ChatGPT/Codex client is enabled.
3. Restart the AI client after enabling MCP if Spline asks for it.
4. Ensure the codex CLI command is available on that machine.
5. Store MEDIA_OS_WORKER_KEY in the Windows user environment.
6. Open the intended Architectural Thinking Spline scene before approving Spline execution jobs.

## Required environment

MEDIA_OS_BASE_URL=https://media-os-backend-production.up.railway.app
MEDIA_OS_WORKER_KEY=<set locally; never commit>
MEDIA_OS_WORKER_ID=<machine-name>-spline-worker

Optional: CODEX_COMMAND=codex

## One-off execution

Run:

powershell -ExecutionPolicy Bypass -File .\worker\spline-worker.ps1 -Once

This is useful for connectivity and controlled proof runs.

## Local Runner v1

Local Runner v1 removes the need to start PowerShell for every approved job. It runs in the logged-in Windows user session, starts automatically at logon, continuously polls Media OS for approved Spline jobs, and restarts the worker if it exits.

Install once:

powershell -ExecutionPolicy Bypass -File .\worker\install-local-runner.ps1

The installer:

- validates that MEDIA_OS_WORKER_KEY exists in the Windows user environment;
- downloads the latest Local Runner and Spline worker from GitHub main;
- registers a limited-privilege Windows Scheduled Task named `Media OS Local Runner`;
- starts the task immediately;
- keeps worker logs under `%LOCALAPPDATA%\MediaOS\logs\spline-worker.log`.

The Local Runner downloads the latest `spline-worker.ps1` whenever it starts or restarts the worker. If GitHub is temporarily unavailable, it falls back to the cached worker.

Check status:

powershell -ExecutionPolicy Bypass -File .\worker\install-local-runner.ps1 -Status

Uninstall:

powershell -ExecutionPolicy Bypass -File .\worker\install-local-runner.ps1 -Uninstall

## Operating model

Once Local Runner v1 is installed, normal Spline execution becomes:

Phone / Media OS → creator approval → Railway queue → always-on Windows Local Runner → Codex + Spline MCP → verify → result back to Media OS.

The laptop still needs an active Windows user session and Spline Desktop must be open for Spline MCP execution. Later the same worker contract moves to the on-demand cloud Windows production workstation next to Spline Desktop and DaVinci Resolve.
