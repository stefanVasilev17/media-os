# MediaOS — Memory-Driven Quality Gate v1 (QA Draft, not deployed)

## Objective
Do not pay for repeated mistakes. A Director correction should become durable episode knowledge, then (when reusable) a project-wide rule, then an executable regression test. A result must never be auto-LOCKED based merely on model confidence.

## Existing baseline (PR #100–#103)
- GlobalCreationPreflight checks rule/policy/catalog **presence** but does not prove output complies.
- ProductionMemoryService stores scoped CORRECTION/LOCK/QA rules.
- EpisodeLearningService promotes an earlier episode's lesson to global scope **only after explicit Director review** and creates a project-wide memory rule.
- Existing generation uses an explicit Paid AI toggle, a preview token and an audit; the model is not a substitute for QA.

## Implemented in this PR
1. V90 `production_quality_assertion`: executable assertions directly linked by UUID to an active Production Memory rule, inheriting its episode/project scope.
2. Zero-token Java checks: `FORBIDDEN_LITERAL` and `REQUIRED_LITERAL`, targeted to narration, voice direction or visual direction; no arbitrary regex or hidden model call.
3. Explicit Director-approved registration endpoint requires a long-lived Director review capability, existing Production Memory rule, relevant scope, meaningful approval note and standard preflight. No model may create a quality rule on its own.
4. Before a chargeable AI run, the preview token binds episode + shot + script revision + draft revision + exact request + **fingerprint of currently active executable rules**. When a rule changes, the previous authorization becomes stale.
5. Before saving either AI or manual DRAFT and before Director LOCK, rerun the active checks. Invalid output is rejected with the violated assertion and memory rule ID. No automatic paid retry.
6. Revision Chat shows coverage, pass/fail and exact failing assertion. **Zero assertions is displayed as NO EXECUTABLE TESTS, never proof of semantic quality.**
7. JUnit tests cover forbidden old mistake, mandatory phrase, scope isolation, changing rule fingerprint and zero coverage.

## Workflow for making old mistakes durable
- Creator says: "This explanation is wrong: the DB didn't crash; it slowed under load." Revise as episode DRAFT.
- After Director approves the correction, classify whether the lesson is episode-only or reusable.
- The episode-specific correction is recorded as a Production Memory CORRECTION. The learning system proposes cross-episode promotion. Director approves global promotion after comparison, obtaining a new global memory-rule ID.
- If the error has a reliable machine-checkable form, register an executable assertion attached to that active correction rule:
  Example `target=NARRATION, predicate=FORBIDDEN_LITERAL, literal=the database is offline`.
- The global assertion applies to all future episodes; an episode-scoped assertion applies only to that episode.
- If semantic nuance makes a literal rule unsafe, do not create an exact-string assertion. Create an evaluated good/bad example and add an editorial QA rubric instead, with Director review before re-generation.

## Critical distinction: deterministic vs semantic guarantees
A text contains "the database is offline" = exact detectable error.
A text incorrectly *implies* the database crashed, without saying those words = semantic error that needs a human or a model-assisted eval. Avoid claiming the string check catches it.
Technical accuracy, novelty, visual storytelling, correct cross-shot context and causal explanations need separate review/eval sets. A human Director still holds the final decision.
Exact literal rules can cause false positives (e.g. "the database is NOT offline"). Register only narrow, reviewed assertions and test them against approved narration samples.

## Next work for cost-efficient semantic QA
- Structured learning record: source episode/shot, incorrect excerpt, corrected excerpt, explanation of failure, scope, Director classification, and a positive/negative example pair.
- Curated `Production Memory Profile` per agent: critical global rules + matching episode rules + only topically relevant failure cases. Context fingerprint, size budget and cached immutable prefix; avoid sending the whole historical conversation and Bible every time.
- Cheap static checks first: exact episode/shot/LOCK IDs, schema, timing, unchanged neighboring shots, voice/video revision IDs, literal regressions, duplicate prompt detector. Fail before paid calls.
- One structured model generation if needed, one local validator, **no automatic retry loops**. Only escalate to an independent semantic review call when the risk is high or an important rule is not machine-testable. Director authorizes paid second-pass checks.
- Golden test set: EP001/EP002 annotated cases from approved mistakes, including overloaded-versus-crashed database, 8 connections **per Auth instance**, safe read-only retries, correct timeout/cancellation relationship, and Remotion-first Living Architecture Map. Do not seed unreviewed historical claims as global rules.
- Measure: first-pass acceptance, repeat error rate per rule, QA gate false positive rate, paid tokens per Director-LOCKED shot, AI calls per shot, and cost per approved minute.

## Release limitations
This PR is stacked on Draft PR #103 → #102 → #101 → #100.
No production deploy, no real generation or stored corrections were performed.
Current assertions must be manually registered against reviewed Production Memory; the proposal-to-assertion UI, semantic evaluators, duplicate AI request caching, semantic change-set validation and auth modernization remain future work.
Feature-gated writes remain disabled by default; existing rules/locks untouched.
Run Java 21/Maven and frontend TypeScript/Vite CI before merge. Audit endpoint access and Director authorization. Avoid exposing the approval secret to the browser.
