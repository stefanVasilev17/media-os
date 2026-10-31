# Architectural Thinking — EP002 ElevenLabs Voice Pass — Production Preparation v1.0

**Prepared:** 2026-10-31  
**Gate:** VOICE PASS PREPARATION — READY; AUDIO GENERATION NOT STARTED  
**Script authority:** [EP002 FULL SCRIPT PASS v4.0 — FINAL DIRECTOR LOCK](../events/2026-10-31-ep002-full-script-pass-v4-0-director-lock.md)  
**Exact ElevenLabs inputs:** [11-shot locked machine-readable manifest](./EP002_FullScript_v4_0_ElevenLabs_VoiceInput_LOCKED.json)  
**Frozen script Git blob SHA:** `3d4eee5d9fae448fd44168adefe1edab7f71eeab`  
**Director-approved original:** EP002 Full Script Pass v4.0, October 30; SHOT11 v1.1 separately approved October 31; final full-episode approval October 31.

## A. Voice objective and production contract

Produce a natural **English documentary narration with the creator's approved ElevenLabs cloned voice**, consistent with the sound and perceived personality established in EP001:

- Calm, senior architect, confident, observational, technically precise, conversational and understandable at first listening.
- Preserve every locked word and sentence order, including example figures, technical terms and the unanswered final question. **No edits whatsoever** to shot text.
- Do not read on-screen values, color labels, parentheses, source notes, shot numbers or markdown bold formatting unless those words are literally present in the approved English narration.
- Do not speed up unnatural speech to meet the estimated timecode; semantic pauses and shot transitions must feel intentional.
- Match the Director-approved shot-level mood and tension: curiosity in SHOT01; rising demand in 02–03; quiet paradox in 04; precise microscopic explanation in 05–06; clear feedback-loop reveal in 07–08; practical bounded mitigation in 09; measured confidence without false recovery in 10; calm architectural payoff in 11.
- Keep all dialogue as neutral, accessible US/UK-audience English. Do not invent a regional accent preference or use an unapproved new cloned voice.
- **No background music or sound effects included in canonical voice stems**; add them separately in Remotion/audio mix only after voice approval.
- No private keys, ElevenLabs API tokens, cloned voice samples, or audio payloads in GitHub docs. Reference secure existing approved identity/configuration without copying secrets.

## B. Frozen recording manifest and pacing watchlist

| Shot | Locked script | Approx. spoken words | Editorial length | WPM required before pauses | Voice character |
|---|---|---:|---:|---:|---|
| SHOT01 | v1.4 | 92 | 0:40 | 138 | Understated suspense, deliberate spinner pause |
| SHOT02 | v1.0 | 115 | 0:45 | 153 | Documentary ticket-sale surge, no announcer urgency |
| SHOT03 | v1.1 | 164 | 1:10 | 141 | Explain rates/throughput conversationally, let values land |
| SHOT04 | v1.1 | 134 | 1:00 | 134 | Quiet Aha: health ≠ Login availability |
| SHOT05 | v1.1 | 214 | 1:30 | 143 | Patient pool visualization; distinct 1/5/7/8 occupancy cues |
| SHOT06 | v1.2 | 165 | 1:10 | 141 | Request A deadline payoff then distinct Request B mechanism |
| SHOT07 | v1.1 | 209 | 1:30 | 139 | Retry paradox and cascading failure with clean terminology |
| SHOT08 | v1.0 | 194 | 1:25 | 137 | Brief hope then scaling-bottleneck architectural payoff |
| SHOT09 | v1.1 | 296 | 2:00 | 148 | Six mechanisms, measured and not a rushed glossary |
| SHOT10 | v1.2 | 255 | 1:30 | **170** | **High timing risk**: P95/P99, trace and SLI/SLO need natural space |
| SHOT11 | v1.1 | 110 | 0:50 | 132 | Restful final recap, meaningful capacity question |

**Total:** approximately **1,948 words** and **13:30 / 810 seconds**, requiring about **144.3 spoken words/min before pauses**. SHOT10 would need 170 wpm to fit its own 90-second editorial window. These are planning metrics, not observed ElevenLabs timings.

**Timing decision rule:** Never force 13:30 by changing script or unnaturally accelerating the voice. Capture real voice durations first. If necessary move shot boundaries and provide a revised full-episode timing forecast to the Director. If the actual result is over 15 minutes, investigate (especially SHOT10) and present duration options **without modifying words**. Any verbal rewrite requires a separately explicit Director unlock.

## C. Next execution workflow — gated

### C1. Preflight before any provider call

1. Load the final episode Director LOCK and the exact 11-shot JSON manifest from the pinned revision; confirm all 11 shot versions and narration text exactly.
2. Check the existing EP001 approved voice identity and provider model/configuration *using an authorized secure connection*; avoid inventing a new voice ID, model ID, stability/clarity/speed preset or locale.
3. Confirm a provider budget/credit limit and approved destination for any audio. **This preparation document does not approve paid voice generation.**
4. Record a baseline of the locked input text and exact script version, so audio provenance can be audited.
5. Establish one isolated EP002 output namespace: `EP002/VoicePass/v1/SHOTXX/`. Never write to any EP001 voice asset IDs.

### C2. Generate & review with preservation

1. Start with **SHOT01 only as a voice acceptance test**, only after authorization for ElevenLabs generation. Check natural opening rhythm, suspense, pauses, pronunciation of Login/Auth without spelling out labels and ElevenLabs clone consistency.
2. Review output for accurate words and natural delivery. Once approved, freeze the chosen voice configuration and use it consistently for the remaining shots. If provider settings need changes, document the difference and ask for Director approval.
3. Generate one logical voice track per shot initially. For unusually long shots (09 and 10), split only at **existing full paragraph boundaries**, where technically useful; no spoken text added or deleted. Recombine deterministically preserving original sentence order and deliberate pauses.
4. Obtain Director voice approval by shot, not solely by episode. Record provider generation IDs and approved artifact references in the **production audio system**, not secrets or audio files in git.
5. Never regenerate an approved voice clip in place; derive a new version for specific corrective scope only if explicitly allowed.

### C3. Word alignment and Remotion handoff

For each approved clip, retain:
- shot key, script version, manifest SHA or git-ref;
- sequence/chapter ID and the exact source-text span;
- approved voice identity reference, provider/model/settings fingerprint (no secrets);
- provider generation ID and output artifact ID;
- measured audio duration, speech onset, final speech offset, intentional pause/hold intervals;
- actual word-level timestamps when supported or produced by an approved alignment process;
- review/approval status and source metadata for repeatable QA.

Apply **word-aligned semantic anchors**, not arbitrary seconds. Expected anchors:

| Shot | Key word-to-action cue preserved from Director v4.0 |
|---|---|
| 01 | “You tap Login” → Phone submit/spinner; “routine health checks” → probe pass; “nine o’clock” → rewind, no error |
| 02 | “nine o’clock” → ticket-sale world; Gateway/Load Balancer → existing nodes; wave 100→350→650 arrivals/sec; “same User Database” → shared dependency reveal |
| 03 | “throughput” → DB lookups completed ~500/s; “arrival rate” → 650→900 new Login/s; “bottleneck/saturation/latency” → progressive pressure and still some completions |
| 04 | liveness/readiness named separately and described plainly, probes pass in the illustrated configuration; Phone still waiting; “Being alive is not the same as being available” |
| 05 | “REPLAY” → local Auth01 pool fill 1/8→5/8→7/8→8/8; “request queueing” → pool waiters; no Phone failure |
| 06 | Request A waits *before lookup* then deadline and first “Please try again.”; Request B is distinct already-running lookup; cancellation may be honored, not guaranteed |
| 07 | Linked retry on **safe read-only lookup** only while Login is active; original Login arrivals stable; retry lookup attempts rise; causal DB→pool→Phone cascade |
| 08 | Explicit WHAT IF Auth scale 3→6, each max 8 connections; same DB throughput bottleneck; spoken analogy shown using architecture, not a new road illustration |
| 09 | Retry budget → backoff → jitter → load shedding → circuit breaker → protected bulkhead split 6 new lookups + 2 safe retries; no false DB recovery |
| 10 | Correct-password Login success rate vs infrastructure errors vs expected wrong-password rejection; success-cohort P95/P99; distributed trace; SLI and SLO target `≥99.9% within 2s over 30 days` |
| 11 | Wide recap → still-running Auth and failing journey → conditional mitigations → “healthy server doesn’t guarantee a successful Login” → unanswered DB capacity question, then end |

The on-screen numbers, counters and labels are **illustrative** and not derived from speech generation or real incident telemetry. Shot-level Remotion animation timing is not locked until the voice alignment exists and is approved.

## D. Required audio quality checklist

- **Script fidelity:** run automated comparison of transcribed/generated spoken words against the locked narration; manually review homophones, numbers, acronyms, punctuation-driven pauses and any dropped words. A transcript tool is supporting evidence, not proof by itself.
- **First-listen clarity:** every new term followed by immediate meaning as authored; no rushed delivery that makes explanation unreadable on the Living Map.
- **Voice identity/tone:** same approved clone, consistent cadence, pronunciation and perceived room quality throughout all eleven shots.
- **Breathing and emphasis:** natural pauses around three Aha moments and key cause/effect links. No robotic micro-pauses after every technical term or artificially dramatic "urgent" style.
- **Signal:** no clipping, glitches, truncated endings, silences mistaken for missing narration, or inconsistent loudness; master as standalone voice assets with later mix flexibility.
- **Alignment:** inspect speaker onset/offset and each word/phrase alignment where available; do not shift visual events against the soundtrack when compressing a cut.
- **Timing:** measure real clip lengths and total narration+intentional holds. Flag SHOT10 independently. Share accurate post-voice episode timeline rather than claiming an arbitrary 13:30.
- **Security/immutability:** generation may only be written to authorized EP002 assets; EP001 existing approved assets and production services remain untouched.

## E. Deliverables of the execution Voice Pass (not yet created)

1. Eleven approved English narration tracks (or controlled paragraph-chapter tracks inside the same shots), each linked to its locked source.
2. Provider/voice identity and generation provenance metadata without revealing credentials.
3. Actual per-shot speech duration and pause sheet; revised timecodes based on delivery.
4. Word-level alignment or equivalent approved anchor markers.
5. QA and Director voice approval record for each shot.
6. Ready-to-build Remotion HEAR→SEE event contract for the Episode-Level Visual Pass.

**Preparation result:** Voice Input Manifest and Voice Pass procedure are ready in GitHub. **No audio, API calls, credits, MediaOS production writes or Remotion renders were initiated.**
