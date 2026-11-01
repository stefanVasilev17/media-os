# EP002 Voice-only paid generation — V106 release gate

**Status:** QA candidate only. No production deployment and no paid ElevenLabs test authorized. Google OAuth configuration remains deferred.

## Scope and controls

This change introduces a **separate** `MEDIAOS_EP002_VOICE_WRITES_ENABLED` flag, default **false**. It authorizes **EP002 Voice generate + approve only**, and only behind a verified Director security mode; it does not enable episode creation, Research, Script edits, Visual Plan edits, EP001 mutations or other episode-wide writes. Keep `MEDIAOS_EPISODES_WRITES_ENABLED=false` for the minimal rollout. If no Director authentication mode is active, startup refuses this voice flag.

A chargeable EP002 `POST /api/v1/episodes/{episodeId}/shot-revisions/{shotKey}/voice/generate` must include `requestId` (new UUID) and `expectedRevision`. The UI creates a UUID once for each user-approved click, requires explicit confirmation, and does not automatically retry after a failed HTTP response. A new `ep002_voice_generation_ledger` stores a durable `IN_FLIGHT` reservation in PostgreSQL *before* the external ElevenLabs call. A unique partial index ensures only one unresolved request per episode/SHOT even across backend instances. The request ID is globally unique and cannot be replayed after a successful take.

A successful provider response is committed in the **same DB transaction** as marking the reservation `COMPLETED`; the take retains EP002 episode ID, SHOT, locked revision, audio and timing alignment. If the provider call or local persistence fails, the request is marked `UNCERTAIN`. Both `IN_FLIGHT` and `UNCERTAIN` block any further paid generation for that SHOT until an operator reconciles provider billing and stored takes. **There is deliberately no automatic retry or lease expiry**, since a lost response may already incur charges. This is at-most-one attempted outgoing call per unique request ID, not guaranteed exactly-once charging across the provider network.

Additional per-SHOT safety limits: maximum **3 persisted takes** across original and revision workflows, and **5000 narration characters per request**. The paid API remains protected by the existing Global Creation Preflight and Spring Security Director role; V106 does not modify EP001 tables or approved media.

## Director acceptance and blocked states

- Episode workspace must identify the actual EP002 UUID, not just the visual SHOT name.
- EP002 Script and SCENE/Visual Plan must be genuinely native Director-LOCKED, not only creatively locked in GitHub.
- Approved EP001 ElevenLabs voice/model must match the current runtime; this was verified by production read-only audit but must still be compared acoustically through A/B listening.
- Use Google Director login only when the Director decides to configure it. Until authentication is active, do **not** turn on `MEDIAOS_EP002_VOICE_WRITES_ENABLED`.
- New `generationStatus` and `blockedReason` in the Voice UI show pending/uncertain/cap exhaustion; do not hide them. Confirm the outgoing paid request once. Review returned take, listen and approve manually.
- A failed or lost request must not be re-sent automatically. Investigate ElevenLabs billing/history before a manual, separately approved reconciliation operation. This release intentionally provides **no** unguarded reset endpoint.
- For recovery: use the retained production S3 backup and Flyway V85→V106 rehearsal; previous V105 clone evidence predates this migration and is not itself V106 proof.

## Must pass before production

1. Exact-commit PostgreSQL 18 clean and V85→V106 migration CI; V106 unique-in-flight/uncertain/replay test; Java and frontend tests.
2. Production-schema-copy rehearsal V85→V106 with EP001 checksums, and fresh retained recovery snapshot at actual release cutover.
3. Verified Director login and CSRF/session acceptance, Google allowed subject pinned, scoped worker compatibility.
4. Secure one-SHOT EP002 native stage LOCK review, budget authorization and explicit Director-approved first real ElevenLabs audio take.
5. A/B with final EP001 narration and approval only after matching narrator persona.
6. No merge to `main` until exact production candidate has explicit Director GO.

## Feature flag matrix

| Environment | `MEDIAOS_EP002_VOICE_WRITES_ENABLED` | `MEDIAOS_EPISODES_WRITES_ENABLED` | Authentication |
|---|---|---|---|
| Current production | unset / false | unset / false | existing live behavior |
| Isolated QA, read-only verification | false | false | existing QA identity |
| First protected EP002 Voice rollout | true, only with Director GO | false | verified Google/local/OIDC |
