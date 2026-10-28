# Episode Learning → Global Knowledge Promotion v1

**28 October 2026 — Draft PR #100, NOT deployed to production.**

## Director invariant
A new episode **does not** start from a blank knowledge base. It reads every active project-wide rule plus only its own episode-scoped memory. Discoveries made during EP002 become visible to EP003, EP004 and future episodes **only** when promoted by a separately authorized Director review. Never copy episode scripts, shot timing, one-off scene choices or LOCKed media into global project rules without explicit review.

## Mechanism
- V87 adds `episode_learning_proposal`, one idempotent review item per active episode-specific CORRECTION, linking back to the exact original `production_memory_rule`.
- After an episode correction is saved and after a Research/Script/Scene Director stage lock, `EpisodeLearningService.refresh` discovers previously unseen episode corrections and marks them `PENDING`. This is deterministic, **free of model calls** and does not automatically promote or alter any existing rule.
- `GET /api/v1/episodes/{id}/learning` lists proposals, **all current active project-wide rules** and a SHA-256 fingerprint of the global rule snapshot. MediaOS Episode Workspaces shows the read-only pending queue.
- `POST /api/v1/episodes/{id}/learning/{proposalId}/decision` supports `PROMOTE_GLOBAL`, `KEEP_EPISODE`, `REJECT`.
- Promotion requires the global fingerprint from the review screen, `comparedExistingRules=true`, a substantive Director note and attribution. Stale global memory fingerprints block approval until refreshed. Exact duplicate text/scope reuses the existing global rule ID (`ALREADY_GLOBAL`); same text in a conflicting scope is blocked. Semantic overlaps not detectable by exact comparison remain the Director's responsibility.
- An approved promotion INSERTS a **new** global Production Memory rule with `episode_id=null`, provenance `source='Learning review <proposal-id>'`; the original EP002 correction remains untouched.
- On its next preflight, EP003 automatically reads the newly approved project-wide rule through the existing `ProductionMemoryService.rulesFor` lookup.
- Review history records source episode, source rule, classification, decision, reviewer attribution, review note, preflight audit, time and global rule ID.

## Mandatory safety
Promotion is disabled by default, even if an episode is writable. Required QA-only flags:
- `MEDIAOS_EPISODES_WRITES_ENABLED=true`
- `MEDIAOS_LEARNING_PROMOTION_ENABLED=true`
- `MEDIAOS_LEARNING_APPROVAL_SECRET` must be a separately configured secret at least 32 characters long.

Every state-changing endpoint must have the existing `GLOBAL_CREATION_PREFLIGHT` audit. The approval secret acts as a scoped operator capability, **NOT true authenticated Director identity**. Production promotion must stay disabled until role-based Director authentication and access control are implemented. Secrets must not be committed to GitHub or presented in UI. The Learning Review UI is inspection-only.

## Current non-goals / necessary follow-ups
- No LLM is used to automatically judge global usefulness; each episode correction becomes a candidate. More advanced semantic clustering / summarization may later suggest classifications but must never self-promote.
- Completed stage locks trigger candidate discovery for Research, Script and Scene. Final publish/QA stage integration will require a dedicated `Learning Review complete` acceptance gate when those episode-aware pipelines are introduced; do not claim that gate is already enforced.
- Global promotion is immutable provenance: changing or superseding an existing global rule is a **separate** Director-reviewed policy transition. This implementation never modifies previously LOCKed global or EP001 production assets.
- Exact duplicate detection is deterministic; semantic contradiction checking still needs human review. The fingerprint is optimistic concurrency, not cryptographic proof that a reviewer actually read each global rule.
- A raw approval capability should not become an alternative to strong Director role verification.

## QA acceptance
1. TypeScript/Vite and Maven tests pass.
2. Flyway V1–V87 runs against isolated PostgreSQL 18.
3. Create QA EP002 and QA EP003 with independent workspaces; save one reusable and one episode-specific correction to EP002.
4. Confirm both become `PENDING`, with no global rule inserted before approval.
5. Block missing/wrong approval capability; block missing comparison attestation and stale fingerprint.
6. Promote only the reusable lesson; verify new global rule `episode_id=null`, EP003 inherited rule, original EP002 rule preserved and preflight audit attached.
7. Mark the other lesson `EPISODE_ONLY`; verify it does not enter EP003.
8. Double submission rejects, duplicates do not create second global rule, and EP001 production media remains unchanged.
9. Record all evidence in Draft PR #100; do not merge or deploy to production without Director release approval.
