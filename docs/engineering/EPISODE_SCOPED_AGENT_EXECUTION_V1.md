# MediaOS — Episode-Scoped Agent Execution v1 (PR #100)

## Scope and release state

This is a scoped **Script Agent / Scene Agent** execution layer. It is not an episode-aware Voice, Remotion, GPU worker, n8n execution pipeline or strong Director identity provider. Keep PR #100 DRAFT and do not merge/deploy to production before Director approval and QA. In production, `MEDIAOS_EPISODES_WRITES_ENABLED=false` and `MEDIAOS_EPISODES_CREATION_ENABLED=false` remain the mandatory defaults. EP001 legacy routes/Director locks and media bytes are unchanged.

## Isolation contract

1. Every request names `/api/v1/episodes/{episodeId}/agents/{stageKey}`; the global creation preflight verifies the URL identity, rejecting mismatched `X-MediaOS-Episode-Id` headers. EP001 is not accepted by these new agent endpoints.
2. The server loads effective canonical project policy, episode-specific corrections, approved reusable Remotion components, current stage and **the locked upstream episode stage only**. Script requires locked Research; Scene requires locked Script. Never substitute the EP001 source snapshot or agent conversations.
3. `GET /conversation` reads only the chosen episode's Script/Scene agent thread. REVISE may use the last 12 messages from that thread plus the new creator correction. No transcript is borrowed from another episode.
4. No AI call is permitted without `MEDIAOS_EPISODES_WRITES_ENABLED=true`, enabled paid-AI policy, configured API key, global creation preflight and a fresh, single-use five-minute token. The token payload is bound to **episode UUID + stage + action + creator message + expected draft revision + locked upstream revision**. It cannot replay against EP001 or any other episode.
5. `POST /preview` creates the zero-token estimate; if paid AI is OFF or unconfigured it returns blockers and does not mint a paid token. `POST /run` requires the token header, and `AiSpendGuardAspect` consumes it immediately before the model call. Direct scoped model calls without HTTP request context are refused.
6. Only `GENERATE` (empty custom message) and `REVISE` (nonempty correction) are allowed. Automatic repairs are disabled. The AI response must pass the deterministic structural gate (including 9–15 minute Script duration). It then becomes a reviewable draft revision, never a Director LOCK.
7. The DB revision update uses `expectedRevision` so an AI response for a stale draft cannot overwrite newer work. `agent_thread`, `production_stage_revision`, `episode_workspace_event` and preflight audit preserve provenance. Failed writes do not modify the episode. Director approvals remain separate and require explicit review.

## API

| Method | URL | Purpose |
|---|---|---|
| GET | `/api/v1/episodes/{id}/agents/{script\|scene}/conversation` | Read local agent conversation |
| POST | `/api/v1/episodes/{id}/agents/{script\|scene}/preview` | Zero-token scoped preview and optional authorization |
| POST | `/api/v1/episodes/{id}/agents/{script\|scene}/run` | Paid model call with preview header; save DRAFT only |

For POST body: `{"action":"GENERATE","expectedRevision":0,"message":""}`. For REVISE: include a nonempty correction, current expected revision and a fresh matching preview.

## Additional security release blockers

- Current MediaOS deployment has no strong per-user Director authentication/roles for newly introduced writes. Enabling these endpoints without authentication and permissions is prohibited.
- Current AI preview token is a capability tied to episode context, not a user identity. A trusted authorization boundary must still be implemented.
- Voice and Remotion workers and old creative routes still operate through EP001 constants; they cannot safely be reused for EP002–EP005.
- An upstream locked artifact could be stale if the truth source changes; later revisions must explicitly invalidate downstream approvals, and timing/technical QA remains necessary.
- Failed AI model calls still incur possible API cost; previews reduce unnecessary spending but do not guarantee successful outputs.
- Global asset catalog entries are reusable component references, not permission to copy locked EP001 media/shot frames.

## Acceptance testing

- Backend Maven and frontend TypeScript build.
- Unit: missing header; absent request context; paid policy off; stale draft; missing Research LOCK; cross-episode replay; stale upstream revision; invalid script; agent DRAFT never locked.
- Isolated PostgreSQL 18 Flyway V1–V86 migration startup.
- QA-only EP002 creation and upstream Research LOCK; ensure no cross-episode memory, direct EP001 write, or token issuance when paid AI is OFF.
- Do not execute a real paid model request without separate Director consent and cost preview.
- Keep production stable and record verified facts, limitations and any failures in PR #100.
