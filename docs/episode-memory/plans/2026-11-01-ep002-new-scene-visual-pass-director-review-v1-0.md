# Architectural Thinking — EP002 New Scene Visual Pass v1.0 — DIRECTOR REVIEW DRAFT

**Created:** 2026-11-01  
**Episode:** EP002 — *Why Login Fails Even When the Server Is Healthy*  
**Source:** Director-LOCKED full-episode EP002 Script v4.0, SHOT01–11; frozen narration and technical guardrails  
**Visual document status:** `NEW_VISUAL_PROPOSAL_v1.0 / REVIEW_REQUIRED / NOT_ORIGINAL_v4.0_STORYBOARD / NOT_MEDIAOS_SCENE_LOCK`  
**Native QA episode:** `95b8a4a2-728e-47fe-ad4c-a16748773588`  
**Editorial windows:** 00:00–13:30 (NOT actual measured ElevenLabs timing)  
**Safeguard:** EP001 visuals, audio, renders and creative locks remain untouched. Production untouched. No ElevenLabs credits consumed.

## 0. Why this new plan exists

The canonical English narration assembly and GitHub Director final Script LOCK exist, but the original user-supplied full v4.0 timed HEAR→SEE visual choreography tables are not available in the current documents. **We cannot prove the original camera/keyframe decisions from an incomplete narration file.** Instead of requiring the Director to supply a file they do not possess, this is a clearly labeled **fresh visual reconstruction proposal** anchored to the available approved **narration and technical guardrails**.

**This new visual plan does NOT claim to exactly reproduce any absent previous visual decision.** Do not overwrite old GitHub original source, do not mark the new camera choreography as previously approved, and do not create a native MediaOS SCENE LOCK merely because the SCRIPT stage is LOCKED. The Director must review newly proposed visuals; if changes are accepted, record a separate visual-plan approval and new version. Exact original narration must never be changed without explicit unlock.

Sources available:
- [Exact 11-shot narration assembly, commit-pinned](https://github.com/stefanVasilev17/media-os/blob/4b964a950f7c0a449483a28151ceeed18a9d0aff/docs/episode-memory/plans/2026-10-31-ep002-full-script-v4-0-11-shot-director-lock-assembly.md).
- [GitHub final creative Script LOCK](https://github.com/stefanVasilev17/media-os/blob/feature/ep002-director-shot11-script-lock-package-20261031/docs/episode-memory/events/2026-10-31-ep002-full-script-pass-v4-0-director-lock.md).
- [11-shot lossless original voice manifest](https://github.com/stefanVasilev17/media-os/blob/feature/ep002-director-shot11-script-lock-package-20261031/docs/episode-memory/voice/EP002_FullScript_v4_0_ElevenLabs_VoiceInput_LOCKED.json).
- [Previous conservative source-bound outline](./2026-11-01-ep002-scene-11-shot-source-bound-outline-UNAPPROVED.md).
- Architectural Thinking Core Production Bible v2.3: Remotion-first; one living architecture world; semantic camera; existing EP001 identity-color system, reusable primitives, 3 reel-ready moments.

## 1. Episode-Level Visual Pass — director proposal

**Spatial identity:** ONE persistent Remotion `ArchitectureWorld`, not eleven independent diagrams. Layout is Phone → API Gateway → Load Balancer → Auth01/02/03 (then hypothetical Auth04/05/06 in SHOT08) → User Database. Use original EP001 component silhouettes and semantic object naming, not new visual restyling. Preserve Phone as human consequence anchor. During pool, retry and trace scenes the camera dives into a node's local mini-world, but its position in the full map is remembered and restored.

**Base palette from the production Bible:** Phone electric cyan-blue; API Gateway blue-violet; Load Balancer indigo; Auth violet/magenta-blue; User Database aqua/teal-green. Inactive context dark blue-gray; confirmed successful outcome green; blocked/failure/deadline use restrained amber/red accents. IMPORTANT: visual state colors do not replace node identities, and a red pressure accent must not imply the User Database went offline.

**Camera grammar:** CameraRig `CLOSE` for Phone human consequence and Auth01 pool anatomy; `MEDIUM` for local cause; `WIDE` for replica relationships; `FULL` for the complete system. Every movement must follow spoken causal explanation. The nine-o'clock rewind and the Auth01 8/8→replay1/8→8/8 sequence require distinct visible temporal context. Prefer continuous spatial movement rather than arbitrary full-screen cuts.

**Time and speech authority:** SHOT editorial windows from the locked script are rough planning slots; exact moves must later anchor to approved ElevenLabs spoken words/phonemes and natural pauses. Do not assume absolute timestamps inside a SHOT before voice alignment; do not speed up voice. Specifically SHOT10's 255 spoken words in 1:30 imply ~170 WPM before pauses, a high-risk mismatch.

**On-screen copy:** English only, small plain-language labels, no clutter; clear definitions become short labels only after narration introduces each concept. Use terms `New Login arrivals/s`, `Completed DB account lookups/s`, `Lookup attempts/s`, `Max pool connections`, `Waiting for connection` distinctly. Never confuse retry attempts with new Login arrivals or completed lookups.

**Reusable asset families:** `ATPhone`, `ATGateway`, `ATLoadBalancer`, `ATAuthService`, `ATUserDatabase`, `ATRequestPacket`, `ATLookupPacket`, `ATConnectionPath`, `ATCameraRig`, `ATFocusLayer`, `ATDimLayer`. Names are proposed interface roles; check actual registry IDs before writing production code. New candidates only when proved necessary: `ATRateMeter`, `ATPoolSlot`, `ATReplayBadge`, `ATDeadlineRail`, `ATAttemptFork`, `ATRetryBudgetGate`, `ATLoadShedGate`, `ATCircuitBreakerGate`, `ATBulkheadPartition`, `ATTraceRibbon`, `ATJourneySLI`. Do not invent existing registry implementations.

**Three short-form anchor moments:** SHOT04 `Alive ≠ Available`, SHOT07 `Retry Amplification`, SHOT08 `Scaling Trap`. Each should have an independent visible hook, single mechanism and readable payoff, extractable in 9:16 after voice and camera review.

## 2. Shot-Level Visual Pass — detailed new proposal

### SHOT01 — 00:00–00:40 — The Login That Keeps Waiting — source narration v1.4

**Narrative purpose:** Cold-open / future consequence; no diagnosis yet.

**Starting frame / geography:** Close Phone at left/near foreground. A visible, restrained Auth service appears deep in the same world. Most intermediate nodes are dim to prevent premature revelation.

**Proposed HEAR → SEE choreography (new Director proposal; not original v4.0 timeline):**

1. On the first spoken `tap Login`, perform one exact Phone press and replace button state with the existing approved spinner. Leave the spinner mechanically alive but narratively unresolved.
2. At `A few seconds pass. Then ten`, introduce a narrow time-progress rail near Phone; avoid fabricated actual measured processing times. Don't replace spinner with an error message.
3. At `server ... still running`, pull focus toward Auth's known identity silhouette, with a small green status pulse. Add two modest labels, `Liveness: PASS` and `Readiness: PASS` — explicitly only this fictitious shallow-probe configuration.
4. At `login is still waiting`, rack focus back to Phone while healthy Auth remains visible at low emphasis; hold contrast rather than suggesting a crashed node.
5. At `go back to nine o'clock`, retract the time rail into a compact `09:00` rewind marker; camera movement prepares a reverse in time into SHOT02.

**Camera:** Close Phone → two-plane Phone/Auth composition → restrained time rewind. No abrupt cut to a new fake world.

**Assets:** Reuse EP001 Phone/Login, Spinner, Auth node, global CameraRig, dim layer; propose TimeRail and 09:00 rewind overlay.

**Truth/continuity:** First user-facing `Please try again.` MUST NOT appear before SHOT06. No assumption of actual request-processing duration; healthy probe is not full availability.

**Shot ending / transition:** Phone spinner unresolved; rewind seamlessly to 09:00.

---

### SHOT02 — 00:40–01:25 — 9:00 AM: The Ticket Sale Opens — source narration v1.0

**Narrative purpose:** Trigger and geography.

**Starting frame / geography:** Pull to Medium/Wide of the SAME Living Architecture World. Phone→API Gateway→Load Balancer→Auth01/02/03→User Database remain spatially stable; no unrelated concert stock artwork required.

**Proposed HEAR → SEE choreography (new Director proposal; not original v4.0 timeline):**

1. At `nine o'clock`, reveal `09:00 • Tickets on sale` as a small timeline context label, not a second story location.
2. Use multiple small Phone/request glyphs feeding the already-existing Gateway path. Never imply credentials are exposed in flight. On `software hasn't changed`, keep architecture geometry fixed as only arrival-wave density increases.
3. On `API Gateway`, briefly light the entry node and one request packet. On `Load Balancer`, show deterministic distribution to three Auth replicas.
4. On `arrival rate`, introduce `New Login arrivals/s` with an illustrative counter sequence 100→350→650→900, allowing later movements to correlate with exact narrated lines (SHOT03) rather than presenting them all at once.
5. Show lookups leaving each Auth replica into a converging shared User Database path. No premature red DB/offline state: pressure is beginning, not collapse.

**Camera:** Wide geography reveal → medium gateway and balancer → drift to Auth-to-DB convergence. Preserve node coordinates across SHOT03.

**Assets:** Reuse Phone, Gateway, Load Balancer, Auth, DB, request packet/path; propose arrival wave emitter, count badge, 09:00 label.

**Truth/continuity:** The rise is illustrative; `arrival rate` counts original new Login requests, NOT DB attempts. Retain exactly three Auth replicas until the hypothetical SHOT08 scale-out.

**Shot ending / transition:** Camera holds convergence onto DB, inviting the throughput explanation.

---

### SHOT03 — 01:25–02:35 — The Database Capacity Limit — source narration v1.1

**Narrative purpose:** Throughput/arrival mismatch and saturation.

**Starting frame / geography:** User Database becomes center-stage; incoming requests and completed lookup outputs remain separate lanes, not a single unlabeled counter.

**Proposed HEAR → SEE choreography (new Director proposal; not original v4.0 timeline):**

1. At `five hundred`, create static upper bound `Completed account lookups/s ≈ 500`, with modest teal-green completion tokens leaving the DB at a bounded illustrative cadence.
2. At `six hundred and fifty ... Then nine hundred`, update `New Login arrivals/s` counter to `650` and `900`. Do not equate these with lookup attempts or imply every arrival immediately starts a DB query.
3. As narration defines `throughput`, visually identify completions already leaving the DB. As it defines `arrival rate`, identify newly arriving Login packets before the DB.
4. Use compact layered states `PROCESSING`, `WAITING FOR RESOURCES`, and `COMPLETED`, with unfinished work accumulating along the critical path (Auth pool/queues), NOT a fictitious unbounded internal database queue.
5. At `bottleneck` and `saturation`, keep DB silhouette operational and visually bounded. Let latency bars elongate and completion remain nonzero. A subtle amber/red pressure accent may overlay identity teal, never a dead-power symbol.

**Camera:** Medium User DB/links → tight rate counter comparison → medium unfinished-work context. Keep throughput proof in view during overload claim.

**Assets:** Reuse DB, lookup packets; propose split RateMeter (Arrivals/Completions), WorkState lanes, latency rail.

**Truth/continuity:** Illustrative capacity ~500 completed lookups/s only for this workload. No assertion of measured real-world numbers. DB not offline, no mass crash.

**Shot ending / transition:** Maintained DB running at capacity, camera pans toward healthy Auth checks in SHOT04.

---

### SHOT04 — 02:35–03:35 — Alive Is Not Available — source narration v1.1

**Narrative purpose:** Reel-ready AHA #1: component health ≠ journey health.

**Starting frame / geography:** Visual side-by-side WITHIN ONE MAP: Auth01's small green probes, red/amber delayed User Lookup path, Phone spinner.

**Proposed HEAR → SEE choreography (new Director proposal; not original v4.0 timeline):**

1. During `health checks`, show two clearly differentiated compact indicators `LIVENESS PASS` and `READINESS PASS` on Auth, with a subtle scope note `Illustrative shallow probes — DB not checked`.
2. When narration defines liveness vs readiness, spotlight each green check briefly in sequence. Do not imply all production readiness checks necessarily ignore dependencies.
3. At `real Login needs an answer`, camera travels along outstanding lookup path and stalls at the overloaded User DB, with a fine connecting line back to the waiting Phone.
4. On `end-to-end check`, overlay a separate `LOGIN JOURNEY` route marker covering Phone→Gateway→Balancer→Auth→DB→response, marked `NOT COMPLETED` rather than pretending this exact synthetic check was executed.
5. At `Being alive is not the same as being available`, hold a calm full causal contrast: two green Auth probe indicators next to one incomplete user journey. This is the natural short-form cut anchor.

**Camera:** Medium Auth → split journey/probe comparison → Phone; 2–3 sec held readable insight before transition.

**Assets:** Reuse Auth, Phone, DB, global path; propose compact HealthProbePill and JourneyAvailabilityRail.

**Truth/continuity:** Do not show `Please try again.` here. Do not turn database node fully red/offline; end-to-end inability to finish is the issue.

**Shot ending / transition:** Push camera into Auth01 housing for pool anatomy.

---

### SHOT05 — 03:35–05:05 — Connection Pool: The Hidden Queue — source narration v1.1

**Narrative purpose:** Internal Auth01 mini-world / eight pool slots.

**Starting frame / geography:** Zoom into Auth01 without cutting to a detached generic UI. Keep world breadcrumb to Gateway and DB edges; eight configured pool slots arranged in stable 2×4 or 1×8 layout.

**Proposed HEAR → SEE choreography (new Director proposal; not original v4.0 timeline):**

1. At `connection pool`, show reusable connection slots and one Login borrowing a slot, a lookup crossing to DB, then a returned slot. Show this as illustrative normal operation, before saturation.
2. At `up to eight`, label `Auth01 connection pool • max 8` and leave other Auth replicas dimly in the background. This is a maximum, not a guarantee that eight sockets are always open.
3. On `Let's replay`, explicitly show `REPLAY • earlier moments` and rewind counter from current `8/8 busy` to previous `1/8 busy` before animating count 1→5→7→8. Replay must not be mistaken for live capacity suddenly recovering.
4. At `pool exhaustion`, all eight configured slots become busy; waiting Login packets line up OUTSIDE the pool. A new highlighted request remains in `WAITING FOR CONNECTION` and does not start a lookup.
5. At `in-flight`, separate `requests started but unfinished` from `pool slots busy` and `waiting for connection`; all are related but different counters. Keep Phone spinner in peripheral focus and introduce a shared deadline rail.

**Camera:** Auth01 from Medium → InteriorClose mini-world → replay hold → pull slightly back to show waiting line + Phone anchor.

**Assets:** Reuse Auth01, lookup, Phone; propose PoolSlot(max8), QueueMarker, ReplayBadge, DeadlineRail.

**Truth/continuity:** Historical 1/8 state must be explicitly labeled replay. Do not show 8 active TCP connections at base state by default. Multiple replicas each own independent pool.

**Shot ending / transition:** Follow a single waiting packet—Request A—into SHOT06.

---

### SHOT06 — 05:05–06:15 — The Deadline Expires — source narration v1.2

**Narrative purpose:** Request A vs Request B and user consequence.

**Starting frame / geography:** Track Request A near Auth01 pool queue while a distinct Request B is already inside DB lookup path. One shared time budget rail; user Phone visible as inset anchored to same world.

**Proposed HEAR → SEE choreography (new Director proposal; not original v4.0 timeline):**

1. Mark first packet `REQUEST A` with `waiting for connection`. Move deadline rail down while A remains before the pool. At `account lookup hasn't even started`, keep its DB path dark.
2. At `time runs out`, deadline reaches zero; visually complete A with `TIMEOUT` at caller. On Phone, for the FIRST TIME show exact `Please try again.` message and stop spinner.
3. At `system may still be working`, distinguish `REQUEST B` as another Login that ALREADY started a DB lookup. Show caller timeout marker on B while a DB-side lookup remains active conditionally.
4. At `cancellation`, show a conditional cancellation signal propagating toward running B lookup. If DB adapter honors it, release slot; otherwise B remains in-flight. Avoid guaranteed cancellation efficacy.
5. Keep the timeouts local to individual requests rather than universally killing Auth or DB. Make at least one held frame of distinct Request A / Request B outcomes.

**Camera:** Close queued A → deadline/Phone consequence → lateral pan to B in DB → controlled zoom-out.

**Assets:** Reuse Phone states, failure response, pool, lookup paths; propose RequestIdentityTag A/B and cancellable work marker.

**Truth/continuity:** A never starts DB lookup. B might continue after caller expiry. No unqualified completed cancellation. Avoid implying a fixed HTTP response status.

**Shot ending / transition:** The error on this Phone is complete, but another live Login remains to introduce SHOT07.

---

### SHOT07 — 06:15–07:45 — When Retrying Creates More Failure — source narration v1.1

**Narrative purpose:** Reel-ready AHA #2: extra attempts without extra customers.

**Starting frame / geography:** Reveal Auth replicas and the same shared User DB. Show linked retries as subsidiary read-only lookup arrows with shared origin IDs; not separate fresh Login requests.

**Proposed HEAR → SEE choreography (new Director proposal; not original v4.0 timeline):**

1. Choose one still-active Login and mark original read-only lookup `ATTEMPT 1`. When narrated `Auth01 tries again`, fork `ATTEMPT 2` from the same logical Login without sending a new Phone Login.
2. At `first lookup may still be running`, allow two separate DB work items visible concurrently; label this behavior as illustrative and conditional.
3. Split meters: `New Login arrivals/s` stays fixed, while `Account lookup attempts/s` climbs. Use two visually different lanes and labels; attempts are not all guaranteed completed.
4. On `retry storm`, other Auth nodes add bounded/unbounded-looking illustrated branches, carefully showing this as the pathological behavior rather than advice. DB remains running while longer lookup times increase pool occupancy.
5. At `cascading failure`, trace pressure backward from DB→Auth waiting→Phone failures; end with visible statement `Read-only lookup retry only • active Login`, never auto-resubmit credentials or the complete Login POST.

**Camera:** Medium one Auth mini-world → widen all replicas/DB feedback loop → pull to Phone human consequence.

**Assets:** Reuse retry path and packet visuals; propose LinkedAttemptId, TwoRateMeter, OverloadFeedbackPath.

**Truth/continuity:** No full Login replay and no assertion that attempts equal completions. Respect authentication safety and user-facing controls.

**Shot ending / transition:** Hold feedback loop and open up Load Balancer view for scaling hypothesis.

---

### SHOT08 — 07:45–09:10 — More Servers, Same Bottleneck — source narration v1.0

**Narrative purpose:** Reel-ready AHA #3: widen the wrong tier.

**Starting frame / geography:** 3 Auth nodes underneath Load Balancer; shared User DB remains fixed at the same anchor. Counterfactual overlay makes added instances a what-if, not a real deployment.

**Proposed HEAR → SEE choreography (new Director proposal; not original v4.0 timeline):**

1. At `horizontal scaling`, show `WHAT IF • Auth replicas` marker and duplicate 3→6 Auth instances using same identity silhouette and restrained entry motion.
2. Show Load Balancer distributing identical original Login arrivals across six nodes. Preserve same incoming arrival counter and same DB completion ceiling; do not covertly increase total demand.
3. Each new instance receives a small `pool max 8` label, avoiding a giant total `48 connections open` claim; mini-pools remain folded unless causally needed.
4. Draw six routes converging at the same single DB throughput bottleneck. DB completed lookup rate remains capped for illustrated conditions even if waiting contention rises.
5. At bridge analogy, use a minimal 1-lane bridge-shaped line within existing architectural map or avoid literal highway illustration; focus on causal convergence over metaphor spectacle.
6. On `We scaled the Auth servers. Not the bottleneck.`, stabilize three old + three new Auth with unchanged DB meter and a crisp emphasis on the DB boundary.

**Camera:** Wide Load Balancer→Auth grid → transient replication zoom → Full architecture bottleneck hold.

**Assets:** Reuse Auth card and LoadBalancer, DB; propose HypotheticalScaleBadge and replica layout token.

**Truth/continuity:** Counterfactual only. Pool configured maximum not actual open sessions. No false claim adding Auth is universally useless.

**Shot ending / transition:** Use same DB pressure state to transition directly into containment decisions.

---

### SHOT09 — 09:10–11:10 — Contain the Failure — source narration v1.1

**Narrative purpose:** Mitigation decisions: do not misrepresent as database cure.

**Starting frame / geography:** Single map remains. Use local overlays at the right intervention point rather than five unrelated slides. Toggle each intervention deliberately while maintaining DB cap context.

**Proposed HEAR → SEE choreography (new Director proposal; not original v4.0 timeline):**

1. First isolate retry side path and attach `RETRY BUDGET`. At limit, refuse extra safe lookup attempts. Keep new-Login arrival count independent.
2. Then animate deterministic stepped delay windows `BACKOFF` with slight per-attempt offsets `JITTER` on read-only retry arrows, not on credential Login posts.
3. At `load shedding`, position early admission gate before expensive DB-dependent work: some new Logins fail quickly and clearly. Avoid treating this as successful authentication or as improvement for every user.
4. At `circuit breaker`, pause new database calls under modeled severe failures; show fail-closed Login response, then a limited safe test window to probe recovery; never issue a successful session without account proof.
5. At `bulkhead isolation`, zoom into a configurable Auth pool max8 and present a PROPOSED split `6 • new Login lookups | 2 • read-only retries`, as an illustrative enforced reservation, not just eight free-floating slots.
6. At `waiting line can finally start to shrink`, conditionally reduce backlog ONLY when admitted total DB demand including retries falls below sustainable completed throughput. Keep DB capacity value unchanged.
7. Maintain consistent camera landmarks so viewers can tell budget/backoff/admission/breaker/bulkhead operate at different boundaries, not one magic `FIX` state.

**Camera:** Medium full map → local interventions/mini-worlds → Wide comparative before/contained state without fake total recovery.

**Assets:** Reuse paths, pool, failure state; propose RetryBudgetGate, BackoffJitterTimeline, EarlyRejectGate, CircuitBreaker, EnforcedBulkhead6plus2.

**Truth/continuity:** Mitigations do not upgrade DB capacity. Some users fail quickly, some succeed conditionally. Not presented as an observed production recovery.

**Shot ending / transition:** Remove intervention overlays and move to measurable user outcomes.

---

### SHOT10 — 11:10–12:40 — Measure the Journey That Matters — source narration v1.2

**Narrative purpose:** User-level outcomes, latency, trace, SLI/SLO.

**Starting frame / geography:** Full request journey as stable backbone. Metrics panel appears only as annotations linked to Phone→Gateway→Balancer→Auth→Pool→DB, not as a detached analytics presentation.

**Proposed HEAR → SEE choreography (new Director proposal; not original v4.0 timeline):**

1. On `success rate`, show two distinct validated-account outcomes `VALID LOGIN • SUCCESS` vs `VALID LOGIN • SYSTEM ERROR` while including incorrect-password as separate `EXPECTED REJECTION` result, never a server error.
2. For `P95 / P99`, draw an illustrative distribution of successful Login durations, labeling precisely `P95 successful login latency` and `P99 successful login latency`; no unsupported actual number values.
3. At `distributed tracing`, highlight one single Login request ID across Gateway, Auth, pool queue, DB lookup with duration markers; show waits vs actual DB processing separated.
4. At `SLI`, label a hypothetical measure `Valid Logins completed within 2s / all valid Login attempts`, ensuring the numerator/denominator do not count wrong-password rejections as system errors.
5. At `SLO`, show `Illustrative objective: ≥99.9% valid Logins within 2s / rolling 30 days` with explicit objective/not-measured tag.
6. Return to Phone real-world experience and contrast green server probe with end-to-end performance. Do not fabricate empirical evidence of full recovery.

**Camera:** Wide full map → selected outcome → metric mini-world → animated distributed trace → Phone/Journey return.

**Assets:** Reuse map, request IDs, Phone; propose OutcomeClassifier, P95P99LatencyRibbon, TraceSpanOverlay, SLI/SLO panel.

**Truth/continuity:** SHOT10 is 255 words in only 90s: narration at 170 WPM before holds is high-risk. Voice duration will determine extended editorial boundary; NEVER accelerate or cut approved words.

**Shot ending / transition:** Settle from metrics back to original overall world and recap.

---

### SHOT11 — 12:40–13:30 — The System Was Telling the Truth — source narration v1.1

**Narrative purpose:** Earned full-map resolution and unanswered next question.

**Starting frame / geography:** Largest clean full-map view, preserving approved Phone/Gateway/Balancer/Auth/DB geometry, where each cause briefly re-lights in spoken order.

**Proposed HEAR → SEE choreography (new Director proposal; not original v4.0 timeline):**

1. On `full Login journey`, zoom from Phone into widest legible architecture; remove secondary meters until only critical route remains.
2. At `lookups slowed`, highlight saturated-but-running DB; at `connections stayed busy`, light Auth01 pool; at `requests waited`, show bounded queue; at `deadlines expired`, mark an expired request, not the DB as dead.
3. At `servers still running`, keep green probe marker but display incomplete Login journey. On protection recap, bring back lightweight boundary indicators without claiming higher DB throughput.
4. At `a healthy server doesn't guarantee`, hold the full map and visual dual signal `SERVER UP / LOGIN NOT GUARANTEED`, avoiding decorative confetti or fictitious recovery.
5. At `database itself needs more capacity?`, gently isolate User Database and darken other components; let the question hang. `That's where our next story begins` becomes an editorial cut, not an explanation of replica topology or next episode script.

**Camera:** Medium Phone → Full wide map largest scale reveal → slow controlled DB focus ending without a new diagram.

**Assets:** Reuse full World, CameraRig, probes, nodes, Phone and paths; no mandatory new component for conclusion.

**Truth/continuity:** Do not introduce replication/architecture of a future episode; no full recovery claim, no automatic Video Plan final LOCK.

**Shot ending / transition:** Final quiet DB focus with next-story question and clean end frame.

## 3. Cross-shot continuity & deterministic state contract

| Continuity invariant | Source-derived constraint | Proposed implementation check |
|---|---|---|
| SHOT01 → SHOT02 | Teaser is flash-forward; rewind to 09:00 | Transition explicitly marked `REWIND`, retain same world coordinates |
| SHOT01 → SHOT05 | Phone spinner stays unresolved | Automated visual test must find no earlier user-facing error |
| SHOT03 → SHOT08 | Shared DB max approximate 500 completed lookups/s in scenario | Never add DB capacity when Auth count changes |
| SHOT03 & SHOT07 | New Login arrivals ≠ lookup attempts ≠ completed DB queries | Every counter must have own label and independent event source |
| SHOT04 | Green Auth probes exclude DB in this fictional configuration | Show probe scope; never imply green always equals end-to-end service health |
| SHOT05 | 8 connections is configured *maximum per replica* | Recorded `REPLAY` marker must bracket 8/8→1/8→8/8 time shift |
| SHOT06 | A waits before query, B started lookup before timeout | Request A has no active DB lookup; B may still be active after its caller expires |
| SHOT07 | Retry only safe read-only lookup within active login | Whole-Login POST never reissued by animation |
| SHOT08 | 3→6 replicas are a hypothetical test | New replicas do not count as a real deployment or solve DB bottleneck |
| SHOT09 | Mitigation limits work; no magic throughput upgrade | Backlog only shrinks when accepted demand becomes less than sustainable completion |
| SHOT10 | Wrong password rejection ≠ system failure; SLI/SLO illustrative | Avoid fabricated measured successful recovery, distinguish outcome types |
| SHOT11 | Cliffhanger asks about DB capacity, not replication tutorial | No future architecture explanation or EP003 title in graphics |

## 4. Remotion implementation sketch — proposed sequence, not code lock

**Project boundary:** keep EP002 source/compositions isolated from EP001. `Episode02ArchitectureWorld` can reuse, not alter, imported EP001 primitives. Maintain a data-driven `shotKey` config with `cameraStates`, `semanticAnchors`, `activeNodes`, `visiblePaths`, `meterValues`, `stateTransitions`, `labels`, `reuseAssetRefs`, `newPrimitiveRequests`. No timeline frames guessed ahead of word alignment.

**Review-first vertical slice:** SHOT04 is a strong first 20–30-second proof of style, comparing green Auth probes to unfinished Login journey. Alternatively SHOT05 pool 1→5→7→8 demonstrates state and camera capability but is costlier. Before coding every scene: approve the new full Visual Pass, and confirm asset registry reality. Use existing QA render pipeline only with genuine native shot and voice approvals; this document alone does not satisfy them.

**Real-time review acceptance:** Frame clarity on iPhone, 1080p final target and 9:16 Shorts safe zone; background map remains semantically continuous; no duplicate/missing request IDs; labels fit screen; no conflict between green probes and red failure state; no false DB outage; no unintended narration rewrite; audio duration wins. Still requires Director final visual authorization.

## 5. Explicit Director decision required

The Director can **approve**, **request changes**, or **reject** this NEW Visual Pass v1.0. Approval is a new authorization for newly proposed visuals, **not** a retroactive claim about missing original v4.0 choreography. Only after the Director reviews the plan should an authenticated native MediaOS SCENE draft be created and a separate native SCENE LOCK be considered.

**Current state:** `NEW_VISUAL_PROPOSAL_v1.0 — AWAITING_DIRECTOR_REVIEW`. No native SCENE stage write; no voice generation; no production changes.
