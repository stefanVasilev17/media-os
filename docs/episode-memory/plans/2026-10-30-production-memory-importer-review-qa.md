# MediaOS Production Memory Importer — Reviewed Staging v1

## Goal
Ingest creator-approved archival Production Bible files, handoffs and previous-episode corrections as **review candidates**, not silently as active global policy. Approval must preserve source provenance, episode scope, review notes, immutable decision records and downstream First-Pass Prompt inclusion.

## Input contract
- Accept only `architectural-thinking.production-memory-staging.v1` with status `REVIEW_ONLY_NOT_IMPORT_COMPATIBLE`.
- Each candidate must have a unique candidateId, nonempty normative content, ALL/SCRIPT/VOICE/VISUAL scope, LOCK/QA/CORRECTION/PREFERENCE type, REQUIRED/PREFERENCE severity and source file, line, verbatim quote and SHA-256 declaration.
- The importer rejects unexpected `activationAllowed=true`, absent pending-review state, invalid source metadata, 0 or >500 candidates, oversized payload.
- `source.sha256` is a **declaration** during upload, not cryptographic server-side verification of source bytes. The source files were individually verified in the original offline review, but future uploads require their own trusted evidence.

## Data and safety
- New V91 tables: import batch (content SHA dedupe), import candidate (immutable candidate data and status), and Director review audit.
- Staging is always inert: no changes to `production_memory_rule`, EP001, EP002, Voice or Video on upload.
- Exact duplicate active rules are detected. Potential overlaps use simple token Jaccard and are labeled **advisory only**, not semantic conflict proof.
- Global and episode-specific rules are kept distinct. EP002 candidates cannot be activated unless an EP002 row exists; they are never silently promoted globally.
- A review may `ACTIVATE`, `MARK_EXISTING` or `REJECT` one candidate. Only ACTIVATE inserts an active Production Memory row. Every decision is audited with reviewer, note, rule set fingerprint, decision and resulting rule ID.
- Import write routes require `mediaos.memory-import.enabled=true`, `mediaos.episodes.writes-enabled=true`, the secret configured in `mediaos.learning.approval-secret` (>=32 characters) and an explicit reviewer decision. Flags default to OFF.
- The supplied capability is only an interim Director authorization; it is **not** identity/role based authentication. Do not deploy as an exposed production administrative route without proper session authentication, CSRF/origin controls, rate limits and access logging.
- Fingerprint changed since comparison -> 409 refresh before decision; imports serialize their global rule activation against Episode Learning promotion using a project advisory transaction lock.

## UI
- `#/episodes` provides a link to `#/memory-import`.
- User may inspect a staging file locally without writes. With the guarded importer available, user stages it and sees batch status and each source quote.
- Each row shows exact duplicate, potential similar rules, episode-registration blocker, source hash declaration and a Director review note / comparison confirmation.
- No AI model calls for staging, comparison or review. Rules added to active Production Memory become available for First-Pass prompt compilation only **after** explicit activation.

## Acceptance tests
1. Source staging JSON with 16 candidates: 12 Global / 4 EP002. Upload creates 16 PENDING, **0 ACTIVE** rules. Original EP001/EP002 artifacts unchanged.
2. Upload byte-for-byte same JSON again -> returns existing batch, no duplicate candidate inserts.
3. Import `activationAllowed:true` or missing source SHA -> 400, transaction inserts nothing.
4. Reviewed rule activation requires capability, enabled feature flags, fresh rule fingerprint, reviewer note, and explicit comparison confirmation.
5. Candidate exact duplicate -> ACTIVATE 409, MARK_EXISTING recorded, no extra Production Memory row.
6. Candidate target EP002 without registered EP002 -> activation blocked, can still stage and reject.
7. Concurrent activations or Episode Learning promotions cannot duplicate a rule without review. Verify transaction lock in PostgreSQL.
8. Reject candidate records an audit and never activates a rule. No editing old review decision after completion.
9. After ACTIVATED Global rule, `ShotPromptContextService` adds it for EP002/EP003 on first paid prompt; episode-specific rule appears only in its own episode.
10. Existing legal Director LOCK, voice and Remotion render statuses remain unchanged; no network AI/TTS calls.
11. User-side capability is not saved in localStorage/sessionStorage. Before production, replace interim shared secret with actual operator/Director identity and audit actor.
12. Backend Java 21 Maven tests, TypeScript/Vite build, DB Flyway migration and integration tests on staging required.

## Remaining release gates
- This is stacked on DRAFT PR #106 -> #105 -> #104 -> #103 -> #102 -> #101 -> #100.
- The pre-existing `POST /api/v1/production-memory/corrections` direct-write route also requires a security review; without it, this new importer cannot be considered the only path to active memory.
- The imported archive content has been reviewed for source hash/line/excerpt offline, but not for semantic correctness or policy precedence. Director must explicitly review before activation.
- Automated harvesting of raw conversation threads, full-source-byte verification on the backend, semantic conflict detection, and bulk review workflows are future optional improvements.
- No production deployment or DB mutation, no paid model requests.
