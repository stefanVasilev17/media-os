# EP003 — Voice Direction Pass v1.0

**Status:** DRAFT — DIRECTOR REVIEW REQUIRED. Voice Direction is NOT LOCKED.
**Created:** 2026-11-13 (Europe/Sofia)
**Source of truth:** [EP003 Script Pass v0.4 — DIRECTOR-LOCKED](2026-11-13-ep003-script-v0-4-director-locked.md), GitHub blob `1a63900cf357819d1bbd8df8b038a8ec0325c849`.
**Scope:** Performance direction ONLY, no additional narration, no changes to approved words, no TTS, no alignment, no render or deployment.
**Production:** Remotion-first; ElevenLabs creator's cloned voice when separately authorized; one persistent Living Architecture World and P0 same-world shot continuity.

## 0. Critical duration finding — review before voice LOCK

Read-only counted **2,917 narration words in 11 SHOTs** in the exact approved Script Pass v0.4. Working end `16:35` is NOT physically supported by calm 130–145 WPM reading: approx **20:07–22:26 of speech alone**, excluding ten narrator-free cross-shot breaths (proposed ~2 s each = 20 s total) and any additional uncounted internal holds. A reasonable initial total is **~20.5–23+ minutes**, not a measured runtime. At 140 WPM speech is 20:50 plus cross-shot seams 0:20 = 21:10 before extra internal expressive holds. Never force 165–180 WPM for an arbitrary target, auto-trim words, or claim old per-shot timestamps are accurate. Bible v2.3 supports longer storytelling where causal clarity warrants it; its >25% drift rule requires explicit Director review.

**Director production choice pending:** accept longer premium episode as one version; or expressly authorize a NEW condensed SCRIPT v0.5. Until such a choice, keep all v0.4 words unchanged and keep Voice Direction DRAFT. Do not force voice generation now.

## 1. Episode-wide voice identity

**Voice persona:** the creator's cloned speaking voice; trusted, calm Senior Architect guiding one technical narrative; understated documentary authority, slightly curious, empathetic toward users, never lecturer, salesperson, broadcaster, or cinematic trailer. Natural international English pronunciation, with clarity over artificial accent adaptation. Familiar terms are not announced like exam definitions. Show a problem, say what engineers call it, connect it to the visible cause, and draw a practical consequence.

**Pace targets (creative proposals; NOT verified sound):** normal explanatory flow 135–145 WPM; concrete transitions and request motion may reach 145–150 WPM only if intelligible; numbers, security decisions, serious risks and critical architectural reveals may slow to 125–135 WPM; reflective finale ~127–138 WPM. Trust listener comprehension over any WPM target. Do not apply blanket speed changes to one generated audio file.

**Intra-SHOT pauses:** ordinary punctuation naturally ~0.15–0.35 s; meaningful contrast/question ~0.4–0.7 s; visual reveal/aha ~0.7–1.1 s as appropriate. These are optional PERFORMANCE GUIDES, not baked timestamp evidence or fixed gaps after every sentence. A small number of intentional pauses is better than exhausting stop-start delivery. Any natural inhalation should sound like a real speaker, not a synthesized sound effect.

**Cross-SHOT breathing:** propose ~2.0 seconds of narrator-free transition following a completed SHOT thought, **assembled as a separately versioned living-motion seam, not forced via extra words, frozen video or unverified TTS silence**. Ten joins mean ~20 extra seconds at this default; final Director review can change it. Avoid doubled silence if a take already ends with a long natural tail; actual voice waveform/take duration and separately added seam are measured, not guessed. First frame of SHOT[N>1] must exactly continue previous approved rendered LAST frame + world state; if a seam clip exists check SHOT→SEAM and SEAM→SHOT boundaries. Do not change narration to cover a visual mismatch.

**Enunciation lexicon, not spoken extra text:** `Auth 01` = 'Auth one' (if selected for consistency); `read/write splitting` = 'read-write splitting'; `asynchronous replication` clear unhurried articulation; `SLI` = 'S-L-I'; `SLO` = 'S-L-O'; `p95` = 'pee ninety-five'; `RTO` = 'R-T-O'; `RPO` = 'R-P-O'; `split-brain` natural two words; `shard key` distinct from `shard`. Pronunciation rules affect rendering only and do not authorize textual changes to the Script. Numbers 900/500/450 are **illustrative story parameters**, never described as real measured production analytics.

## 2. Global provider direction (PROMPT ONLY; never synthesize as narration)

> Use the original creator's cloned speaking voice. Speak in clear, natural English as a calm, experienced software architect showing the viewer what happens inside one real system. Guide, do not lecture. Keep documentary authority, genuine curiosity, and natural sentence rhythm. Emphasize architectural consequences, not technical jargon. Give new concepts room to land. Use restrained tension for stale data and failover, and warm reflection at the end. Avoid a trailer voice, exaggerated suspense, generic presenter excitement, monotone reading, glossary cadence, or an automatic dramatic pause after every line. Speak ONLY the exact approved EP003 v0.4 narration for the selected SHOT; no headings, stage directions, prompt words, ad-libs or extra outro.

This metadata prompt is not a guarantee of provider pronunciation control, prosody accuracy or word-level alignment; audit actual Takes when generation is separately approved.

## 3. Per-SHOT directing cards

### SHOT 01 — The System Is Stable. But People Still Cannot Log In.

**Words:** 205. **Speech planning at 140 WPM:** ~1:28 (speech only, not measured, not original timeline). **Mood:** Subdued urgency → human consequence → curiosity; the aftermath of a crisis, not a trailer opener. **Local pace:** 135–143 WPM.

**Director delivery:** Enter already in the story, with calm restrained energy. Slightly slow down on the contrast between stability and users rejected. The final two questions must create genuine curiosity, never a promotional crescendo.

**Exact Script v0.4 phrase cues — NOT extra words:**
- “The ticket sale is still running.” — Quiet, immediate opening; no breathy teaser or artificial countdown.
- “But something important has not changed.” — Small drop in pitch, then a natural 0.45–0.70 s space.
- “A fast rejection is still a failed Login.” — Warmth toward the human consequence; modest emphasis on 'failed Login'.
- “What if the business needs more capacity than our database can provide?” — Open, unresolved question; no dramatic boom.

**Terminology / articulation:** admission control / load shedding: matter-of-fact because the prior episode already introduced them.

**Handoff / continuity:** Finish the last question naturally, then allow a proposed ~2 s voice-free moving-world seam into the architecture; no vocal pickup or repetition at SHOT02.

### SHOT 02 — Find the Real Bottleneck

**Words:** 253. **Speech planning at 140 WPM:** ~1:48 (speech only, not measured, not original timeline). **Mood:** Clear architectural diagnosis; patient but intellectually active. **Local pace:** 138–145 WPM; 128–137 for the numerical comparison.

**Director delivery:** Guide the viewer along the Phone → Gateway → Load Balancer → Auth path as though pointing at a living map. Give each 900/500/450 example its own space; do not blend numbers. Teach throughput versus latency conversationally, not as a definition list.

**Exact Script v0.4 phrase cues — NOT extra words:**
- “During our ticket sale, imagine nine hundred new Login requests arriving every second.” — Present as an illustrative workload, not real monitoring evidence.
- “This is its measured” — Slight emphasis on 'throughput' which immediately follows in the unchanged script.
- “Our User Database is now the” — Clarify 'bottleneck' as the result of the visual diagnosis, not a new chapter.
- “It did not make the database faster.” — Understate with 0.60–0.85 s thoughtful pause.

**Terminology / articulation:** throughput, latency, bottleneck; explain through observation; pronounce numerical quantities clearly.

**Handoff / continuity:** The diagnosis remains visible and moving; transition toward the existing database becoming the Primary in SHOT03.

### SHOT 03 — One Primary. Two Replicas.

**Words:** 220. **Speech planning at 140 WPM:** ~1:34 (speech only, not measured, not original timeline). **Mood:** Thoughtful discovery with controlled optimism, followed by one caveat. **Local pace:** 137–145 WPM.

**Director delivery:** Treat the appearance of each replica as a real architectural option becoming available, not a victory. Slow slightly when contrasting a Primary's writes with replicated reads; avoid pausing after every definition.

**Exact Script v0.4 phrase cues — NOT extra words:**
- “Replica A. And Replica B.” — Separate the two short statements with a small natural beat; do not exaggerate their entrances.
- “In our example, we use” — Give 'asynchronous replication' a clear pronunciation; stress that Primary commits without waiting for all replicas.
- “But it also means the replicas may temporarily be behind.” — Subtle caution. This is the planted seed for SHOT05.
- “Who decides which database should answer a particular query?” — Curious handoff into SHOT04, not the start of a new lecture.

**Terminology / articulation:** primary-replica replication, asynchronous replication, horizontal scaling.

**Handoff / continuity:** Keep exactly the same Primary, Replica A and Replica B positions/states and camera trajectory into SHOT04; a narrator-free gap may pass while replication continues.

### SHOT 04 — Who Decides Which Database Gets the Query?

**Words:** 284. **Speech planning at 140 WPM:** ~2:02 (speech only, not measured, not original timeline). **Mood:** Hands-on senior-architect explanation: controlled, concrete, clear reasoning. **Local pace:** 137–145 WPM; 128–135 on critical vs optional read comparison.

**Director delivery:** Let the viewer follow one real Login and two different reads. The first read is security-critical; the second can tolerate some staleness. Speak as if discussing an actual design review, not performing an interview definition. End with an unresolved data-freshness problem.

**Exact Script v0.4 phrase cues — NOT extra words:**
- “Which database should answer each query?” — Pause slightly before the routing decision becomes visible.
- “Engineers often call this” — Say 'read/write splitting' crisply and immediately link it to who routes the query.
- “Our critical authentication check never moved.” — Slow down, with restrained emphasis on 'never moved'.
- “More read capacity does not automatically mean more Login capacity.” — Primary aha payoff. Short silence after the sentence, then lower tension before the final question.

**Terminology / articulation:** read/write splitting, read scaling, authoritative Primary, freshness-critical read.

**Handoff / continuity:** Do NOT reset the diagram for SHOT05; hold the same camera/world, then gently shift attention to Replica A and its pending account update.

### SHOT 05 — The Replica That Gives the Wrong Answer

**Words:** 246. **Speech planning at 140 WPM:** ~1:45 (speech only, not measured, not original timeline). **Mood:** Quiet technical suspense, no alarmism; demonstrate a subtle, dangerous failure. **Local pace:** 128–138 WPM.

**Director delivery:** Let the account-status change feel mundane and the stale read feel surprising. Contrast a technically healthy node with an unsafe answer. Avoid a villainous 'wrong database' voice; this is normal replication behavior used incorrectly.

**Exact Script v0.4 phrase cues — NOT extra words:**
- “The account is now locked.” — Slight pause (~0.5 s) to let the state change register.
- “But Replica A has not applied that change yet.” — Lower, measured observation with enough time for the lag to become visible.
- “This is called a” — Clearly land 'stale read', not theatrically.
- “A healthy database can return a fast answer that is still unsafe to use.” — Second major aha. Deliberate, restrained emphasis on 'unsafe to use'.

**Terminology / articulation:** replication lag, stale read, eventual consistency; keep explanations causal.

**Handoff / continuity:** Finish with the freshness question and continue the same account-status/replica visual state into SHOT06.

### SHOT 06 — Correctness Before Speed

**Words:** 272. **Speech planning at 140 WPM:** ~1:57 (speech only, not measured, not original timeline). **Mood:** Calm, reflective engineering judgment; high precision rather than high drama. **Local pace:** 133–142 WPM.

**Director delivery:** Make the trade-offs feel real. The phrase 'fail closed' should be understandable from the previous example, and the explanation should sound like a decision with a cost. Avoid treating Primary reads as universally safe across all consistency failures.

**Exact Script v0.4 phrase cues — NOT extra words:**
- “Should we always use the fastest available database?” — Genuine design-question tone, not rhetorical sarcasm.
- “That last approach is called” — Introduce 'fail closed' as the consequence of the previous two options.
- “But there is a cost.” — A simple 0.50–0.75 s reflective pause before the trade-off list.
- “How do we serve more users without making authentication decisions from information we cannot trust?” — Controlled question that tees up measurement in SHOT07.

**Terminology / articulation:** data consistency, consistency guarantee, fail closed, isolation, authoritative Primary.

**Handoff / continuity:** Carry the last authentication decision state into a smooth wide camera view of all database instances for SHOT07.

### SHOT 07 — Did We Really Fix the Bottleneck?

**Words:** 252. **Speech planning at 140 WPM:** ~1:48 (speech only, not measured, not original timeline). **Mood:** Evidence-driven turning point; curiosity grows into disappointment, then discovery. **Local pace:** 134–143 WPM.

**Director delivery:** Return to 900 versus 500 with clear numerical breathing. The audience must feel the architectural surprise: replicas are active but the critical path is still blocked. Do not accuse the design; show that it solved a different problem.

**Exact Script v0.4 phrase cues — NOT extra words:**
- “Nine hundred new Login requests per second.” — Short gap before the next figure; avoid crowding the two values.
- “About five hundred account lookups per second on the original database.” — Measured comparison; these are fictional illustration values.
- “This is where the” — Explain 'critical path' as the point the whole user journey depends on.
- “We scaled the reads that could move. But the work limiting Login stayed in one place.” — Central intellectual pivot. State plainly; allow ~0.8 s for insight.

**Terminology / articulation:** critical path, throughput, optional reads versus authentication-path dependency.

**Handoff / continuity:** Do not cut away. The same system stays on screen while the architecture starts exploring split account ownership in SHOT08.

### SHOT 08 — When Copies Are Not Enough

**Words:** 412. **Speech planning at 140 WPM:** ~2:57 (speech only, not measured, not original timeline). **Mood:** Culmination and discovery → practical cost → qualified confidence. **Local pace:** 138–148 WPM, NOT compressed to the old 2:00 timeline.

**Director delivery:** Longest SHOT: give it four internal movements rather than racing. (1) Existing limitation and new data-owner idea; (2) first shard decision; (3) shard-key routing and hot-shard danger; (4) replication-versus-sharding payoff and measured hypothesis. Let the viewer inspect the changing map after each reveal. Avoid a triumphant 'finally fixed!' announcement.

**Exact Script v0.4 phrase cues — NOT extra words:**
- “This is called” — Introduce 'sharding' as the name of the design the viewer has now seen.
- “A shard is a partition of the data with a defined owner.” — Give a small teaching pause before two separate account routes.
- “What if one shard receives most of the traffic while the others are almost idle?” — Natural concern; 'hot shard' follows as the engineering term.
- “Replication creates copies of data. Sharding divides responsibility for data.” — Third major aha. Deliberate contrast, leave ~0.8–1.1 s for the diagram.
- “But it is still a hypothesis until testing proves the complete Login journey can handle the additional demand.” — Lower intensity; no unearned linear-scaling promise.

**Terminology / articulation:** sharding, shard, shard key, hot shard, primary ownership; this is a potential capacity solution not a guaranteed measured outcome.

**Handoff / continuity:** As the phrase about failure ends, move naturally into ONE existing shard's Primary+replica from the current sharded world. SHOT09 must NOT revert to the old single-Primary map.

### SHOT 09 — When the Primary Disappears

**Words:** 252. **Speech planning at 140 WPM:** ~1:48 (speech only, not measured, not original timeline). **Mood:** Controlled seriousness; operational reliability incident without cinematic panic. **Local pace:** 130–140 WPM.

**Director delivery:** Allow the failing owner to disappear visually with a modest vocal dip. 'Failover' is not a magic switch; explain the ownership problem and risk before the lesson. No shouting or horror-movie stop.

**Exact Script v0.4 phrase cues — NOT extra words:**
- “Now imagine it suddenly becomes unavailable.” — Pause enough for the failure to be noticed; no alarm sound implied by narration.
- “That process is called” — Introduce 'failover' only after promotion is explained.
- “This is a” — Explain 'split-brain' as two owners that both accept changes.
- “But availability is not enough if the system recovers into the wrong account state.” — Respectful seriousness; a modest 0.7–1.0 s reflective pause.

**Terminology / articulation:** high availability (context), failover, split-brain, fencing, asynchronous replication, recent data loss. Do not silently add unspoken RTO/RPO here; these appear in SHOT10.

**Handoff / continuity:** Continue the actual post-failure or recovering shard state into the metrics view in SHOT10. Do not magically turn all databases healthy.

### SHOT 10 — Prove the Architecture Works

**Words:** 293. **Speech planning at 140 WPM:** ~2:06 (speech only, not measured, not original timeline). **Mood:** Analytical, grounded, constructive; move from architecture complexity to human outcomes. **Local pace:** 137–145 WPM; slightly deliberate on acronyms.

**Director delivery:** Avoid a metric glossary. Always give the user-outcome question first, then let each metric answer it. Pronounce acronyms consistently and distinctly. Stress the surprising fact that low p95 for successes does not rescue a high failure rate.

**Exact Script v0.4 phrase cues — NOT extra words:**
- “How many legitimate Login attempts finish correctly and within an acceptable time?” — Human outcome establishes what the numbers must prove.
- “A” — Handle SLI and SLO as separate clear terms; never let letter sequences blur.
- “But measuring only successful requests can be misleading.” — Pause so viewers can understand denominator bias and rejected requests.
- “The purpose of scaling is not to make a diagram bigger. It is to make the user's journey work.” — Resolve the argument with calm, not triumphal, conviction.

**Terminology / articulation:** SLI = S-L-I; SLO = S-L-O; p95 = 'pee ninety-five'; RTO = R-T-O; RPO = R-P-O. Expand each using the locked spoken text only.

**Handoff / continuity:** Move into a continuous wide Living Architecture World/Phone focus for SHOT11; the evidence view should remain part of the same world, not switch to slides.

### SHOT 11 — What One Login Teaches Us About Architecture

**Words:** 228. **Speech planning at 140 WPM:** ~1:38 (speech only, not measured, not original timeline). **Mood:** Quiet reflection, earned confidence, human-first final release. **Local pace:** 127–138 WPM.

**Director delivery:** Bring the voice closer and slightly slower. Respect the three parallel sentences ('More capacity...', 'More copies...', 'More owners...') with light rhythmic separation, not a speech cadence. The ending should feel complete and personal, not like a sales pitch or generic call to action.

**Exact Script v0.4 phrase cues — NOT extra words:**
- “Think about where our story began.” — A gentle return to the original Phone, not a dramatic rewind.
- “Every improvement came with another responsibility.” — Quiet summary; the following three parallel lines each receive a small natural beat.
- “That is the real work of System Design.” — Confident, grounded conclusion, no over-emphasis on terminology.
- “The architecture succeeds when the human journey succeeds — and the result can still be trusted.” — Soft, final landing. Allow voice to decay naturally; maintain visible final map for a Director-approved closing hold.

**Terminology / articulation:** No new glossary terms in the finale. All prior concepts are now part of one coherent story.

**Handoff / continuity:** No next episode teaser. Finish Login Architecture series. Final frame remains readable long enough for the message to register; duration requires later Director timing/visual review.

## 4. Pronunciation, rhythm and human QA acceptance

For each SHOT, run read-only script checksum comparison before preparing a paid request; narration must match the canonical source exactly, including sentence boundaries and wording. Proposed English delivery is a guiding performance specification, not a replacement voice transcript. Any deviation to the spoken words requires a new Director-reviewed Script version. Make no provider API call from this document.

**Director review of actual paid Takes (separate future gate):** inspect first and last spoken word, every number and acronym, natural clarity of architectural terms, no clipped syllables, no extra ad-libs, no excessively slow glossary rhythm, stable speaker identity, emotional progression, and obvious aha emphasis without theatrical overacting. Keep original selected Takes immutable. Preserve raw verified text/audio hash, provider/model/settings, and where available actual character/word timestamp arrays. Metadata fields alone are NOT word-level alignment. Absent valid real timestamps, mark `HEAR_SEE_REAL_ALIGNMENT_PENDING`, never guess frames.

**HEAR→SEE preparation:** quote exact narration phrases as semantic anchor candidates; after actual approved Take and valid word-level/character-level timestamps, bind real audio spans to Remotion actions. Do not use estimated WPM as a word timestamp source. Avoid cutting midway through a clause, adding an unspoken visual claim, or resetting the Living Architecture between SHOTs. Any genuinely rendered candidate must pass the independent P0 all-seam frame/geometry/motion checks and Director review.

## 5. Director review checklist

- [ ] Accept performance persona: calm documentary Senior Architect, story-first
- [ ] Accept subtle emotional arc and per-SHOT cue cards (all 11)
- [ ] Accept pronunciation guidance for interview terms
- [ ] Decide measured-runtime policy: **keep full ~21–23+ min v0.4** or request **separate condensed Script v0.5** (current script remains locked)
- [ ] Confirm exact per-join pause default (~2 seconds proposed) and no frozen footage
- [ ] Once Director accepts all above, mark *Voice Direction* LOCK in a new versioned record; this does NOT authorize paid ElevenLabs, alignment, rendering or deployment

**Present status:** `VOICE_DIRECTION_DRAFT_FOR_DIRECTOR_REVIEW`; `SCRIPT_V0_4_DIRECTOR_LOCKED`; `TTS_NOT_RUN`; `ALIGNMENT_NOT_MEASURED`; `RENDER_NOT_AUTHORIZED`; `CROSS_SHOT_MEDIA_NOT_VERIFIED`.
