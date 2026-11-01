# EP002 — native locked content, QA evidence and production import plan
Date: 2026-11-01. **Read-only inspection and import-code preparation only; not a production deployment or Director approval.**

## Verified QA source
Production-readiness audit ran in the isolated Railway QA project `MediaOS-Shot-QA-20261031` against `qa-postgres`, with `default_transaction_read_only=on` and no public database endpoint. The audit queried the EP002 QA episode ID `95b8a4a2-728e-47fe-ad4c-a16748773588` and observed:
- Exactly **one** EP002 episode.
- `RESEARCH` = `LOCKED`, revision 1; 2 technical sources, 10 Truth Map items, 3 explicit out-of-scope boundaries, central question and viewer promise.
- `SCRIPT` = `LOCKED`, revision 1; 11 SHOTs, version `v4.0`, source Git blob `e0f8ee8b9c7c22bd7b9947c2cba40b1072a440d0`, source-exact narration and `READY_FOR_REVIEW_ONLY` initial import marker.
- `SCENE` = `LOCKED`, revision 1; 11 SHOTs, original Visual Pass `v1.0`, source Git blob `5c43c7fd3bd66b5899f0956a9cfd80bdead834f1`, 59 visual beats.
- `VOICE`, `VISUAL`, `QA`, `PUBLISH` are `WAITING`, revision 0 in this QA workspace.
- Each of Research, Script and Scene has exactly **one** recorded `DIRECTOR_LOCKED` event with verified actor issuer + subject, preflight audit UUID and matching revision. The stored `production_stage_revision` artifact is equal to the locked current stage artifact for all three.
- The read-only audit printed statuses/counts and boolean integrity checks only; it did **not** print narration, technical sources, Director notes, actor identities, audio, or secrets.

These are *real QA Director events*, not arbitrary frontend flags or fabricated locks. They prove QA progression. **They do not authorize copying the QA identity/audit event into production as a new Director approval.** Avoid duplicating QA LOCK events and do not modify EP001.

## Production-portable source assets
- `frontend/src/data/EP002_FullScript_v4_0_LOCKED.json`: independently test-verified source-verbatim 11 SHOTs, 1,948 words, 810 editorial seconds; `buildVerbatimEp002ScriptDraft` produces an explicitly *unlocked* SCRIPT draft.
- `frontend/src/data/EP002_VisualPass_v1_0_DIRECTOR_APPROVED.md`: independently test-verified 11 SHOTs and 59 beats; `buildApprovedEp002SceneDraft` produces an explicitly *unlocked* SCENE draft.
- This change fixes the hard-coded QA UUID gate: source-exact imports are available to any real episode with `episodeNumber='EP002'`, `revision=0`, `status != LOCKED`, and completed upstream native LOCK. Do **not** use episode ID equality to determine production eligibility; the production EP002 UUID may differ.
- Each production import is by an authenticated Director into the existing episode's `production_stage` through the regular audited draft endpoint. It never overwrites a nonzero revision, changes canonical narration, silently confirms a LOCK or makes a paid AI call.
- No production-portable source for the full **Research artifact** is included in these two frontend files. The production Research stage must be reviewed and populated using validated sources (or a separately verified source-exact transfer) before a Director can lock it. Do not synthesize Research or pretend its QA LOCK is the production LOCK.

## Exact first-production-Voice sequence — gated
1. Preserve current production on `main` and existing S3 recovery copy. Do not deploy the new backend while its identity mode is unconfigured; it fails closed.
2. Pass worker routes/security compatibility, V106 migration, rollback and dependencies on the exact release candidate; take a fresh retained backup before authorized production cutover.
3. When Director requests production access, configure Google Cloud Web OAuth credentials via Railway secrets (not in GitHub or chat), pin verified Director identity and check Safari/CSRF/unauthorized-user rejection.
4. Verify/Create **one** EP002 production workspace under the existing episode-aware creation gate; its UUID is not assumed to equal the QA UUID.
5. Review and explicitly native-LOCK Research with technical sources and scope boundaries (no paid AI required if verified source is provided).
6. Import source-exact Script v4.0 as a **DRAFT** (zero paid cost), verify 11 SHOTs and original English narration, then the authenticated Director explicitly LOCKs it.
7. Import source-exact Visual Pass v1.0 as a **DRAFT** (zero paid cost), verify all 11 SHOTs/59 beats and original HEAR→SEE directions, then the authenticated Director explicitly LOCKs it.
8. Keep `MEDIAOS_EPISODES_WRITES_ENABLED=false`; only after protected Director access and explicit paid authorization enable `MEDIAOS_EP002_VOICE_WRITES_ENABLED=true`. The new V106 ledger requires a unique request UUID before ElevenLabs is contacted.
9. Generate **one** SHOT 01 take with the EP001-matched voice/model settings. Compare acoustically with actual final EP001 narration (accent, pacing, pauses), approve only with explicit Director decision, then reload/replay to prove persistence. EP001 locks and audio remain unchanged.

**Release blockers are still active.** The QA audit and source-portability frontend fix are not proof of a working EP002 production Voice page; the exact release candidate has not been deployed to live production. No user credentials should be requested before the Director chooses to activate Google login.
