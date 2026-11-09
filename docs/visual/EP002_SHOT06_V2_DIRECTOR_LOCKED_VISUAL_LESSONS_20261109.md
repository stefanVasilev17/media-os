# EP002 SHOT06 V2 — Director-LOCKED final MP4 and permanent future-SHOT visual rules

**Decision:** 2026-11-09; Director reviewed the corrected SHOT06 V2 MP4 and explicitly said “локваме. Харесва ми.” This is a creative **Director LOCK**, separate from the real technical QA.

**Accepted production evidence:** Remotion source SHA `c3206d6df701a83d0e2df4b7202492b60d8d4137` from [SHOT06 Draft PR #231](https://github.com/stefanVasilev17/media-os/pull/231). Actual Render ID `d42fe3a2-3810-4626-ab3a-0456463d4636`, `EP002-SHOT06-CANDIDATE`, 2,096 frames @30fps, measured 69.867 seconds; H.264/AAC 1920×1080. Railway production Worker logged `AT_TIER_PLUS_PLUS_RENDER_START` / `TECHNICAL_PRECHECK_PASS` at 2026-11-09T10:59:15Z and `AT_TIER_PLUS_PLUS_MP4_QA` / `ACTUAL_MP4_TECHNICAL_QA_PASS` at 2026-11-09T11:04:07Z. Director's subsequent explicit visual approval closes the independent creative gate. Do not assert that separate authenticated playback HTTP was inspected when it was not.

## Approved lesson AT-VIS-0002 — status card collisions + redundant final caption

- **Status:** APPROVED. First observed in EP002 SHOT06, permanent prevention for all future Architectural Thinking SHOTs.
- **Problem:** Request A and Request B DB lookup callouts obscured the Connection Pool's actual eight slots and other architectural objects; floating `IF STOPPED → RESOURCES AVAILABLE SOONER` repeated already communicated cancellation information.
- **Correction:** Show `REQUEST A · DB LOOKUP NOT STARTED` and `REQUEST B · DB LOOKUP MAY STILL RUN` in a single right-hand external card at `x=1550,y=476,w=302,h=92` (30px outside pool), crossfading at actual preexisting HEAR→SEE voice cues. Remove the extra floating IF STOPPED caption/animation altogether. Keep correct conditional cancellation semantics inside the pool.
- **Future preventive rule:** Position every voice-cued status card, explainer and counter outside live working slots, architecture paths, request queues, Phone and other important content. Check all frame states (including moving camera) for overlaps and clip edges. Where feasible leave ≥20px gap to technical panels and ≥24px to neighboring protected graphics. These SHOT06 coordinates are **not** a fixed global layout; choose a truly empty zone in each new SHOT. Add automated collision regressions plus actual visual review.
- **Future prevention against noise:** Remove captions that do not introduce additional engineering understanding, especially duplicated outcomes and disconnected floating banners. Do not falsely imply a caller timeout automatically stops the DB operation or that a cancellation signal always frees resources.
- **Do not break continuity:** Approved SHOT01–SHOT06 source, voices, transitions, visual grammar, color semantics and exact final MP4 are protected. New SHOTs must use the style/visual grammar without modifying protected SHOTs.
- **Evidence:** 129/129 Remotion Worker Node tests PASS, zero new TS errors, both bundles PASS, exact real MP4 technical QA PASS, Director's explicitly reported visual acceptance. Three relevant source/test files: `Shot06DirectorVisualV1.tsx`, `Shot06VisualContract.ts`, `shot06-deadline-contract.test.mjs`.
- **Promotion:** This note and `AGENTS.md` / `PROJECT_STATE.md` on default main form the available canonical memory. A feature-branch-only visual constitution/ledger may exist but is **not present on main** as of this change; do not rely on that unmerged file being available in main.

## EP002 SHOT07 — proposed HEAR→SEE anchors, NOT LOCKED

Approved source English narration v1.1, Visual Pass beat directions:
- **Beat 1:** `Auth 01 tries again`. Trigger the secondary read-only `ATTEMPT 2` from the **same** original Login; do not replay the full credential Login.
- **Beat 3:** `New Login traffic hasn’t increased, but database attempts have`. New Login arrivals stay constant while DB lookup attempt rate rises, without claiming every attempt completed.

Both proposed phrases appear uniquely in the approved script. They are **textual suggestions**, NOT verified frames or an approved recorded Take. The Director must listen and submit the existing authenticated `Verify real voice cues for SHOT07` action to obtain real alignment; never invent timestamps or auto-approve any paid TTS/CPU render.
