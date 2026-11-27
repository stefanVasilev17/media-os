# Review & Learning System V1 — Phase 4

2026-11-27. Director requested real Phase 4 development; code candidate, build/runtime verification and Director acceptance pending. Existing AT-PUB-0001/0002, AT-DIST-0001/0002 and visual/storage contracts remain unchanged.

## Native workflow

Review tab in the existing Director episode workspace. One content-first page shows live Full Video lineage, Publishing QA, Reels lock count, Distribution readiness and manual launch record via existing services; no copied media or duplicate QA state. Expand technical blockers/evidence only on demand. Draft strengths, problems, lessons, proposed permanent rules, next-episode recommendations, manual post-release observations and final episode conclusions. Approve an exact saved revision explicitly; retire preserves history. Conclusion approval captures a read-only summary and fingerprint of current upstream state; future changes require refreshed review, historical evidence remains. Open blockers can be documented in an approved pre-release conclusion, which never authorizes release. No waiting for future analytics.

Reusable channel-scope lessons/rules/recommendations and prior conclusions from earlier Director-owned episodes with current master lineage appear in the category-filtered Previous episode conclusions list (latest 50 per query, rules first). Copy approved records for ChatGPT/Codex planning, review applicability, distinguish hypothesis/observation/verified result/permanent rule. No automatic changes to agents, repository rules or rendering code; the existing canonical GitHub rules remain binding. Director-approved rules in this database are structured evidence for deliberate future implementation, not executable configuration. Do not copy the existing visual ledger into this database without verified source attribution. No invented EP004 approval or analytics seeds.

## Persistence and security

Additive V135 append-only-by-service revision table; existing JdbcClient and Director identity; owner-scoped reads including cross-episode query, package row lock and optimistic expected revision, stable client UUID, exact audited POST path, audit UUID and actor. Bounded textual payload, 100 revisions per item, 200 current item IDs, 4 MiB textual revision budget per episode. No media or external calls. Manual analytics require recorded actual public URL/date, completed nonfuture observation period, source evidence, known metric, numeric value where applicable, RPM currency. Detail metrics use human-entered breakdown text; no automated ingestion or external verification. Suggested periods 24–48h, 7d, 30d and later are guidance, not scheduled tasks. No assumption of monetization, causality or zero analytics before release.

## Pending verification

Run frontend Vitest and TypeScript build, Java unit/route tests and isolated PostgreSQL integration via existing Dockerfile.backend, verify exact backend source pin, Flyway V135 and health before claiming deployed. Review actual authenticated Director screen and record Director approval separately. EP004 remaining publishing/reels/distribution/rights/audio/captions/private upload/public release/analytics tasks remain open. No worker changes, additional infrastructure, render, TTS or paid provider.
