# MediaOS — EP002 Director Visual Feedback Ledger v121

**Date:** 2026-11-05
**Implementation state:** Draft PR based on the unmerged EP002 sequential visual preflight branch from PR #189, which itself depends on PR #187. Not built, merged, deployed or browser-tested in this coding session.
**Policy dependency:** PR #188 (versioned Remotion Visual Constitution, accepted correction ledger, sequential Codex SHOT protocol) remains a separate draft and requires Director review.

## Problem and Director requirement

The Director wants the same Living Architecture visual identity across episodes and wants Codex Cloud reserved strictly for Remotion code. Visual generation must advance **one SHOT at a time**, checking approved style, relevant older corrections, source/cue accuracy and continuity **before** each new Codex scene. Director corrections must not disappear between tasks. A code file being present is not proof of visual quality or approval.

## Actual implementation in this draft

1. **Flyway V121** creates append-only ep002_visual_director_feedback records. Records include unique idempotent request ID, strictly EP002 SHOT02..SHOT11, immutable episode input fingerprint, current script revision/SHA, selected current voice Take ID (nullable), category, Director's exact observed problem and requested correction, Director issuer/subject and required global creation preflight audit ID. State can only be DIRECTOR_FEEDBACK_RECORDED; it is **not visual approval**.
2. **Director-only API** at GET and POST /api/v1/creative/episodes/EP002/visual-feedback. POST requires explicit confirmation, 12–2000 character observed problem and 12–4000 character correction, valid category and correct current *next* unaccepted SHOT. It checks actual current EP002 sequential preflight fingerprint and protects Director-LOCKED SHOT01. Duplicate request IDs are idempotent for the same actor/identical contents and blocked for changed payload or actor. The source remains unchanged.
3. **Security** extends the existing exact POST Director allowlist shared by JWT, Google OAuth and local auth. GlobalCreationPreflightFilter uses the existing project audit anchor explicitly for this fixed EP002 creative record, even where multiple native episode rows exist; cross-episode headers are rejected. It does not treat the record as an EP001 shot or permit unreviewed endpoint mutations.
4. **EP002 UI** gets a 'Visual Corrections — Director Memory' panel under the sequential preflight. Director records problem + change (with explicit confirmation), reviews the latest 100 notes, and sees whether their fingerprint matches the current episode. The next-SHOT preflight itself now returns the 50 latest current-fingerprint notes for the exact candidate, so a future Codex task generator has structured correction context without copying all history.
5. **Tests added/updated** for request validation, stale source, skipped SHOT, locked SHOT01, replay actor/payload, Director JWT role/route, project audit routing and Flyway V121 migration in isolated PostgreSQL. These are *test source code*, **not executed passes**.

## Safety and deliberate remaining blocks

- No previous corrections are falsely marked verified, approved or global. A submitted note is **not** a confirmed change, does not automatically amend CODEX_VISUAL_LESSONS_LEDGER.md and never permits generation of SHOT03.
- No new Director accepted-SHOT state is fabricated. Existing SHOT01 is the only Director-LOCKED baseline. Real acceptance of SHOT02 will require verified merged PR/source scope, SHA-matching worker build, genuine current approved voice and HEAR→SEE mapping, actual successful playable MP4, explicit Director review, and a source/render/Take-bound persisted approval event. The V120 EP003+ whole-film approval process cannot simply be reused for EP002 without special source protections.
- Codex Cloud subscription tasks still require Director action in the Codex UI; there is no programmable task launch. No OpenAI API, ElevenLabs, Render CPU, GitHub Actions, merge, production Railway deployment or YouTube publishing was initiated.
- Codex must **read** the merged style policy and accepted lessons from actual trusted current Git SHA; merely listing document paths or receiving unconfirmed notes does not constitute a verified policy preflight.
- The approved 59 EP002 beats are editorial guidance, not evidence of measured speech timestamps. The current next-SHOT API correctly continues to return readyForCodex=false and executableCodexPrompt=null.
- Saved current-source notes are for SHOT-specific feedback, NOT broad global style rules. Cross-episode lessons still require Director-approved, evidence-backed promotion to the versioned global ledger.

## Review checklist before any deployment

- Confirm PR dependency order: #187, #189, then this change; #188 must also be reviewed and its policy files accessible from trusted Git for visual production. Preserve the roadmap and immutable originals.
- Run Java21 Maven tests, isolated PostgreSQL Flyway V121 migration validation, Spring Boot full ApplicationContext, EP002 regression tests and frontend TypeScript/Vite build in an approved environment **without GitHub Actions**. Actual results and exact commit SHA must be recorded before a PR can become ready.
- Check Director JWT/Google/local role guards, global creation preflight audit, rejection of cross-episode headers and no accidental script/voice mutation. Test actual authenticated browser playback/feedback view separately.
- Inspect GitHub compare paths for no modifications to EP001/EP002 Remotion protected components, locked Script v4.0, Visual Pass v1.0, Render Worker, secrets or Railway promotion marker.
- **Only after verified successful milestone** update PROJECT_STATE.md and link implementation from README. Draft PR code alone does not establish DONE.

## Next integrated work

1. Persist **evidence-backed** SHOT02 visual acceptance bound to actual successful render and verified source/voice/cue/visual-policy versions, with ability to invalidate when dependencies change. Then permit SHOT03 as the next candidate.
2. Read the latest accepted cross-series lessons from trusted versioned Git and generate exactly one scoped Codex Remotion task (first SHOT02), with a short input manifest rather than the entire MediaOS repository/history.
3. Complete EP002 voice cue mapping and the protected per-SHOT Codex/worker/render adapter. Produce and review all SHOTs in order, followed by Master and three reviewed Shorts with separately approved CPU/media storage.

Keep the whole-episode source and Voice Studio preparation batch-first, but visual CODE DELIVERY sequential.
