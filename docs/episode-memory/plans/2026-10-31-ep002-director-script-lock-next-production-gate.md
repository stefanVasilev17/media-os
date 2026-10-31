# Architectural Thinking — EP002 Director Script Lock & Next Production Gate Handoff

**Date:** 2026-10-31  
**Episode:** EP002 — Why Login Fails Even When the Server Is Healthy  
**Working target:** 13:30; Director's preferred 12–14 min; investigate if >15 min  
**Source:** Director-supplied `EP002 FULL SCRIPT PASS v4.0` dated 2026-10-30, with subsequent explicit SHOT11 v1.1 approval 2026-10-31  
**Narration:** [complete 11-shot, verbatim assembly](./2026-10-31-ep002-full-script-v4-0-11-shot-director-lock-assembly.md)  
**SHOT 11 approval:** [creative LOCK](../events/2026-10-31-ep002-shot11-v1-1-director-creative-lock.md)

## Current authority and locks

| Layer | Status | Meaning |
|---|---|---|
| EP002 editorial scope / story | Already established in Director-supplied v4.0 | Concert ticket demand surge → shared User DB bottleneck → Auth pool pressure → deadline → retry amplification → scaling trap → protections → end-to-end measurements → capacity question |
| SHOT 01–10 narration and visual logic | DIRECTOR LOCKED | Versions `01 v1.4 / 02 v1.0 / 03 v1.1 / 04 v1.1 / 05 v1.1 / 06 v1.2 / 07 v1.1 / 08 v1.0 / 09 v1.1 / 10 v1.2`; immutable |
| SHOT 11 narration and visual plan | DIRECTOR LOCKED v1.1 (2026-10-31) | Exact Director-approved seven-paragraph spoken text plus specified 12:40–13:30 camera story; no adjustments |
| Full-episode 11-shot assembled script | READY FOR DISTINCT DIRECTOR FINAL SCRIPT LOCK | Eleven individual approvals are recorded. No claim that a separate entire-episode LOCK or MediaOS stage LOCK has happened |
| ElevenLabs voice production / word alignment | NOT STARTED by this handoff | Only the voice recording can determine real timings, holds, cuts and motion triggers |
| Remotion EP002 production / native MediaOS row | NOT STARTED by this handoff | No EP001 edits; no production DB writes; no unapproved render |

## Mandatory Director full-script approval checkpoint

Only the following decision is still outstanding before spending ElevenLabs credits:

> “LOCK EP002 FULL SCRIPT PASS v4.0 — одобрявам като единен епизод точно събраните SHOTS 01–11 и версиите им, без промяна на английския narration или визуалните решения. Production може да започне с Voice Pass.”

This sentence is a **proposed next authorization**, not a statement that the Director already sent it. If the Director gives the approval, record a separate complete-episode LOCK entry, not a mutation of any previously locked shot, and only then open the Voice gate.

## Timing risk assessment — planning only

The assembled narration is approximately **1,948 words** by whitespace count, excluding markdown emphasis. Maintaining a strict **13:30 / 810 seconds** therefore requires about **144 words/minute before breathing, pauses, transitions, holds and the intentional cold-open wait**. This is a fragile target for calm documentary delivery; it is NOT evidence that the desired 12–14 min must be missed. Real ElevenLabs alignment is authoritative.

| Shot | Planned window | Approx. spoken words | Approx. WPM at planned duration |
|---|---:|---:|---:|
| 01 | 0:40 | 92 | 138 |
| 02 | 0:45 | 115 | 153 |
| 03 | 1:10 | 164 | 141 |
| 04 | 1:00 | 134 | 134 |
| 05 | 1:30 | 214 | 143 |
| 06 | 1:10 | 165 | 141 |
| 07 | 1:30 | 209 | 139 |
| 08 | 1:25 | 194 | 137 |
| 09 | 2:00 | 296 | 148 |
| 10 | 1:30 | 255 | **170** |
| 11 | 0:50 | 110 | 132 |

**Highest risk: SHOT 10**. At a natural `135 words/minute`, 255 words require about **1:53 of speech alone**, rather than 1:30. After actual delivery, move editorial boundaries and camera cues as needed; **do not shorten, paraphrase, speed up, or overwrite the Director-LOCKED narration**. Also check SHOT02 / SHOT09 for pacing. Do not claim a revised final runtime until voice files exist.

## Gate 1 — Voice Pass (AFTER full-script approval)

- Record/preserve eleven shots' exact approved narration using ElevenLabs cloned creator voice. For compound shots use approved contiguous chapter segmentation without modifying text.
- Direction: calm, senior architect, credible documentary tone, ordinary English; no artificial urgency or dictionary cadence.
- Capture for every shot and voice clip: immutable script revision, clip sequence, provider generation ID, source text fingerprint, duration, word-level timestamps, actual gaps, approval status, version and any scope restrictions.
- Validate chronological continuity: SHOT01's spinner remains unresolved; SHOT02 rewind to 09:00; SHOT06 first “Please try again.”; SHOT11 final unanswered DB capacity question.
- Generate no voice speculatively before Director confirms complete assembly. Never use existing EP001 approved audio as replacement narration or regenerate locked voices.

## Gate 2 — Episode-Level Visual Pass (AFTER voice and timing)

One persistent **Living Architecture Map**, one consistent camera grammar. Build a cross-shot geography and exact continuity sheet using the **full Director v4.0 storyboard tables** as authority, not the obsolete 2026-10-28 or assistant-created 12-shot drafts.

Reuse protected EP001 node geometry, Phone, Network, Gateway, Load Balancer, Auth, DB, User Lookup, paths, camera rig, color semantics and asset registry by reference. Identify only new visual primitives with a specific spoken causal need: scaled Auth replica presentation, local pool slots, replay cue, queue/flight counters, request deadlines, linked retry attempts, protection gates, metrics/trace ribbon.

**Continuity checkpoints:** 09:00 arrival wave; current-vs-replay Auth01 pool occupancy; one global database throughput model; Request A ≠ Request B; rate counters are distinct; no DB offline visual, no unqualified credential replay; SHOT08 scaling is counterfactual; SHOT09 protections are hypothetical; SHOT10 does not fabricate measured recovery; SHOT11 introduces no new future-topic theory.

## Gate 3 — Shot-Level Visual Pass → Remotion implementation

For each shot, lock detailed HEAR → SEE semantic triggers, camera coordinate states, reused and newly approved asset IDs, event transitions, label constraints and time-aligned holds. Then implement isolated EP002 compositions with deterministic data/events. Do not touch production EP001 code, MP4s, voice locks or source snippets. First render previews only after approved voice alignment and creative/technical QA checklist.

## Gate 4 — Render/AV QA, Shorts and final review

- Static: tests/type check, frame output geometry, visual collision/legibility, color semantics, complete scene map.
- AV: video FPS/frame count verified independently, audio-video duration/PTS synchronization, spoken transcripts equal to locked script, no missing final voice, clean ending and transition continuity.
- Shorts: extract candidate **SHOT04 Alive ≠ Available**, **SHOT07 Retry Amplification**, **SHOT08 Scaling Trap**; validate independent hook → visible mechanism → payoff after actual cuts.
- EP002 full episode assembled: technical QA then human Director watch/review and final render/episode release LOCK; no automatic publication.

## Operational boundary / known infrastructure fact

The verified production Railway/PostgreSQL read-only audit on 2026-10-31 returned exactly one episode row (`EP001`), with no `EP002` row. That is consistent with Director's v4.0 note: **“No MediaOS production action.”** This GitHub-only documentation does not invent a database record, persist a native MediaOS production stage LOCK, or authorize production-stage writes. Native import, if later required, must go through the audited Director creation/preflight with explicit authorization. Production services, database, EP001 assets and Draft PR #110 remain untouched by this handoff.

## Decision gate

**Prepared:** SHOT11 Director creative LOCK; complete 11-shot verbatim narration assembly; shot-version matrix; original narrative truth guards; pacing-risk check; production order.  
**Not yet authorized:** entire-episode Director FINAL Script LOCK; billable ElevenLabs work; Remotion rendering; MediaOS database writes.  

**Next action:** obtain explicit full-episode Director LOCK of the assembled 11 shots, then carry out the Voice Pass with true word-level timing.
