# Media OS — Spline Production Worker

This worker is the local bridge between the cloud-hosted Media OS and Spline Desktop.

Architecture:

Media OS / Railway → queued production job → Windows worker → codex exec → local Spline MCP → focused Spline 3D tab → result back to Media OS.

The cloud backend never connects directly to Spline MCP. Spline MCP is intentionally local-only.

## One-time prerequisites

1. Install and open Spline Desktop on the Windows production machine.
2. In Spline open Settings → MCP and ensure the ChatGPT/Codex client is enabled.
3. Restart the AI client after enabling MCP if Spline asks for it.
4. Ensure the codex CLI command is available on that machine.
5. Open a sandbox copy of the Architectural Thinking Spline scene and focus that 3D tab.

## Required environment

MEDIA_OS_BASE_URL=https://media-os-backend-production.up.railway.app
MEDIA_OS_WORKER_KEY=<set locally; never commit>
MEDIA_OS_WORKER_ID=<machine-name>-spline-worker

Optional: CODEX_COMMAND=codex

## First connectivity proof

Run:

powershell -ExecutionPolicy Bypass -File .\worker\spline-worker.ps1 -Once

The initial queued job creates a harmless test object named MEDIA_OS_CONNECTION_TEST in the focused sandbox scene. Existing objects are protected.

After a successful proof, the worker reports the result to Media OS and the Live Map task moves to completed.

## Continuous worker

Run the same script without -Once.

Later this worker moves to the on-demand cloud Windows production workstation next to Spline Desktop and DaVinci Resolve.
