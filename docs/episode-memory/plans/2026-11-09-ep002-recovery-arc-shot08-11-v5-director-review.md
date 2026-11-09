# EP002 — Recovery Arc v5.0, SHOT08–11 Director Review Candidate

**Editorial status:** DRAFT · DIRECTOR REVIEW REQUIRED. This is not a replacement for the currently approved production script until the Director explicitly locks the wording and authorizes a controlled source revision. Do not feed this file to TTS, real-audio cue verification, Remotion paid render, or the current production-contract service.

**Director decision (2026-11-09):** No Auth horizontal scale-up in EP002. Keep exactly **three Auth instances and one User Database** from SHOT02 through SHOT11. The problem is an overloaded shared database and retry amplification; the solution shown in EP002 is **containing overload and demonstrating partial recovery within the fixed database capacity**. Discuss primary/replica (historically called master/slave), database scale-out and consistency tradeoffs **only in the next video**.

**Do not change:** SHOT01–07 locked voice/script assets, original footage, backend production script v4.0, visual continuity of the single large Phone and canonical architecture nodes. Preserve SHOT07 V2 clean world and removal of fake request particles, meter cards and footer.

**Narrative spine:** SHOT07 failure → SHOT08 stop excessive retry attempts → SHOT09 admit bounded work and reject excess early → SHOT10 watch the queue shrink and prove user-level recovery → SHOT11 end with the real availability-vs-health lesson and tease database capacity for a separate episode. The database can process approximately 500 lookups/second in the existing example while peak new Login demand can reach 900/second. **At this load, not everyone can sign in.** A lower shared total admitted lookup-attempt budget (illustratively 450/s, including retries and leaving headroom) may allow the backlog to shrink if realized throughput is sustained; exact numbers are educational, not production configuration prescriptions. Shed failures must be counted as user failures.

**Production cost / current audio:** Railway showed old SHOT08 Slow Natural Take `ffbfcd01-4d09-4e28-8058-eb74307915c9` generated and approved on the *superseded scaling script*. Preserve it for audit/history; it cannot narrate this new text. Never silently reuse its timing, marks or audio, and do not buy a replacement Take until Director approves the revised script.

**Time:** original EP002 editorial block retained: SHOT08 07:45–09:10 (85s), SHOT09 09:10–11:10 (120s), SHOT10 11:10–12:40 (90s), SHOT11 12:40–13:30 (50s). **Beat offsets below are editorial estimates only, NOT measured audio timing.** After a new Director-approved Take, character-level alignment determines exact frames and durations.

**Technical notes:** The rule at Gateway/Auth entry is admission control, not a fourth service. Concurrency and retry budgets must apply across all three Auth instances (or be divided into coordinated local shares), not be independently tripled. The existing three up-to-eight-connection Auth pools remain; a per-instance pool limit is not a shared database capacity budget. Short-circuiting is conditional and uses controlled half-open testing; admission/connection limits must not be presented as adding DB capacity. A timed-out Login NEVER becomes successful retroactively. Keep one Phone and show any later successful result only as a **new separately identified Login**.


---

## SHOT08 · Stop the Retry Storm

**Editorial:** 07:45–09:10 · 85s · 179 words (~126 spoken wpm at editorial duration) · Proposed script v2.0-CANDIDATE

### Full English voice-over · Director review candidate

After that retry storm, the database is overloaded. But some of its work is coming from our own repeated attempts.

We still have three Auth servers and one User Database. More Auth servers would not remove this limit. So we control retries first.

Watch Auth 01. A lookup times out. Before trying again, Auth checks the Login deadline. If no useful time remains, it stops.

We also add a retry budget: only a small share of active Logins may retry a safe, read-only lookup. When that budget is exhausted, no more retries. The whole Login is never repeated.

For an allowed retry, exponential backoff increases the delay after each failure. Jitter adds a small random change, so Auth 01, Auth 02, and Auth 03 do not retry together.

Now watch User Database. The extra attempts fall. The database is still busy, and some Login requests will still fail. These changes do not create more capacity.

But the retry storm is no longer feeding itself. We've stopped wasting work. Next, we need to control the new requests that keep arriving.

### Five editorial HEAR → SEE beats (not voice timestamps)

**Beat 1 · editorial offset 00–14s · exact phrase suggestion:** `After that retry storm`

Start at the exact final SHOT07 map: one Phone, API Gateway, Load Balancer, three Auth instances, one User Database. Phone still shows an expired Login; DB remains red and saturated. Title morphs to STOP THE RETRY STORM. No new nodes.

**Beat 2 · editorial offset 14–30s · exact phrase suggestion:** `We still have three Auth servers`

Focus the three existing Auth instance cards, then User Database, with soft restrained highlight. Hold three instances; never grow to six. Show tiny orange caption: THREE AUTH SERVERS · ONE SHARED DB. Keep same Phone.

**Beat 3 · editorial offset 30–49s · exact phrase suggestion:** `Watch Auth 01`

Focus Auth 01 and its existing read-only lookup attempt marker. On timeout, make the retry attempt dim unless the active request has time left. A compact RETRY BUDGET indicator inside/above Auth Service falls to its defined limit. No lines or packet particles.

**Beat 4 · editorial offset 49–67s · exact phrase suggestion:** `For an allowed retry`

Local small timer rings on Auth 01/02/03 show staggered delays, labeled BACKOFF and JITTER. Do not draw a path from DB or imply a full Login replay. Three instances stay static, only highlights/timers change.

**Beat 5 · editorial offset 67–85s · exact phrase suggestion:** `Now watch User Database`

Reduce rapid DB pulse frequency/intensity, retain amber/red overload while pressure remains. A short orange caption: DUPLICATE LOOKUPS ↓ · CAPACITY UNCHANGED. On-screen queue does NOT instantly empty. End with the same architecture map, ready for admission control in SHOT09.


---

## SHOT09 · Protect the Shared Database

**Editorial:** 09:10–11:10 · 120s · 279 words (~140 spoken wpm at editorial duration) · Proposed script v2.0-CANDIDATE

### Full English voice-over · Director review candidate

Stopping retries helps. But it does not fix the mismatch. In our example, nine hundred new Login requests can arrive each second, while the User Database can finish about five hundred account lookups. Let everything through, and the queue will grow again.

So we add admission control to the existing Login path. This is not another server. It is a rule near the Gateway and Auth boundary that decides whether a Login can enter expensive database work.

Because we have three Auth instances, the budget must be shared. Giving each instance its own full allowance would overload the same database. Suppose we permit around four hundred and fifty total lookup attempts per second, leaving room for other database work. This is an example, not a universal setting.

When demand goes beyond that limit, load shedding rejects some new Logins early. Those users receive a clear, fast failure instead of waiting for a long timeout. Nobody is signed in without an account check.

We also limit the number of lookups running at once. Engineers call this bounded concurrency. The three connection pools still exist, but they no longer decide the total pressure by themselves. A bulkhead can keep retries from using the capacity reserved for new account lookups.

If the database keeps timing out, a circuit breaker can briefly stop new attempts and fail those Logins fast. Later it permits a few test requests through before normal traffic resumes.

Here is the trade-off. Some people cannot log in during overload. But the work we do accept has a better chance to finish. We have not made the database faster. We have stopped sending more work than it can safely handle.

### Five editorial HEAR → SEE beats (not voice timestamps)

**Beat 1 · editorial offset 00–23s · exact phrase suggestion:** `Stopping retries helps`

Keep SHOT08 end-frame map; no camera reset. Reuse the original 3 Auth cards and 1 DB. Put one short orange timed statement in open negative space: 900 LOGIN ARRIVALS/s · ABOUT 500 DB LOOKUPS/s (illustrative from SHOT03). Do not reintroduce broad obstructing metric cards.

**Beat 2 · editorial offset 23–44s · exact phrase suggestion:** `So we add admission control`

Show a small ADMISSION CONTROL policy band anchored to existing Gateway/Auth entry, not as another service node. Gate activity is a border/highlight state, never red flying lines. Labels ADMIT / SHED appear locally and briefly.

**Beat 3 · editorial offset 44–71s · exact phrase suggestion:** `Because we have three Auth instances`

Show one total lookup-attempt budget shared across all Auth instances, illustrative 450/s. Explicit TOTAL ATTEMPTS INCLUDING RETRIES. Then show load shedding as rejected status badge on the EXISTING Phone with a fresh request label, not a second mini Phone. Important: rejected request is not signed in.

**Beat 4 · editorial offset 71–97s · exact phrase suggestion:** `We also limit the number of lookups`

Focus the three 8-connection pool modules in existing Auth nodes; make active slot highlights respect a shared concurrency cap rather than opening extra links. A small RETRIES ≠ NEW LOGIN CAPACITY explanatory tag may appear only if not overlapping. Illustrate circuit breaker as temporarily CLOSED path for NEW lookup admission, without claiming permanent outage.

**Beat 5 · editorial offset 97–120s · exact phrase suggestion:** `Here is the trade-off`

Some new Logins show fast/clear rejection, admitted Logins keep progressing. DB remains a single node, active work stabilizes. Keep USER DATABASE status amber/busy, not magically green. End on same map for queue drain in SHOT10.


---

## SHOT10 · Prove the Recovery

**Editorial:** 11:10–12:40 · 90s · 220 words (~147 spoken wpm at editorial duration) · Proposed script v2.0-CANDIDATE

### Full English voice-over · Director review candidate

Look at the User Database again. With duplicate retries limited and new work admitted at a controlled rate, the waiting line can finally shrink.

Why? Because the database can now finish work faster than new work enters its queue. In our example, it can complete about five hundred lookups per second. The shared admission budget allows fewer total attempts, leaving room for the backlog to drain.

Connections are returned to the Auth pools sooner. Accepted Logins spend less time waiting, and more of them finish before their deadlines. Database pressure fades from red toward amber, then normal, but only as the numbers improve.

Watch the phone carefully. A Login that already timed out does not come back to life. That request is over. A different, newly accepted Login can now succeed.

We still need evidence. Measure valid Login success rate, failures caused by the system, and the time people wait. A wrong password is not an infrastructure failure. P95 and P99 latency reveal the slow requests an average can hide. Tracing shows whether time was lost in a connection queue or the database.

And count the people we rejected early. Fast failures are better than endless timeouts, but they are still failures. Recovery means a shrinking queue and more admitted Logins finishing on time, not merely three green Auth servers.

### Five editorial HEAR → SEE beats (not voice timestamps)

**Beat 1 · editorial offset 00–17s · exact phrase suggestion:** `Look at the User Database again`

Continuation from SHOT09: single DB, three Auth cards, one Phone. Begin with queued-work indication already present; smoothly reduce queue depth rather than snapping it empty. Keep caption quiet and in negative space.

**Beat 2 · editorial offset 17–35s · exact phrase suggestion:** `Because the database can now finish work`

Short orange explanatory comparison in the lower free zone: COMPLETED LOOKUPS > NEW ADMITTED ATTEMPTS. Existing capacity ~500/s from SHOT03; illustrative total admission budget below that. The text is not another full overlay meter.

**Beat 3 · editorial offset 35–51s · exact phrase suggestion:** `Connections are returned`

Auth 01/02/03 pool-slot occupancy eases. DB pulse transitions red→amber only after a sustained window, never implies capacity increased. Last overdue waiting jobs finish or time out; do not resurrect them.

**Beat 4 · editorial offset 51–68s · exact phrase suggestion:** `Watch the phone carefully`

Keep ONE original large Phone. Replace an already-ended error with a clearly identified NEW LOGIN attempt, then show success for THAT NEW admitted request; never show the earlier timed-out request suddenly succeeding.

**Beat 5 · editorial offset 68–90s · exact phrase suggestion:** `We still need evidence`

Minimal voice-synced terms appear one at a time: VALID LOGIN SUCCESS · SYSTEM ERROR RATE · P95/P99 LATENCY · REJECTED REQUESTS. End with realistic state: accepted logins increasingly finish, but rejection count remains visible; 3 Auth and 1 DB unchanged.


---

## SHOT11 · Healthy Is Not the Same as Available

**Editorial:** 12:40–13:30 · 50s · 133 words (~160 spoken wpm at editorial duration) · Proposed script v2.0-CANDIDATE

### Full English voice-over · Director review candidate

Look at the full Login journey. The Phone reaches the Gateway, the Load Balancer, three Auth servers, and one shared User Database.

We did not add servers. We did not make the database faster.

We reduced duplicate retries, limited database concurrency, and rejected excess Login work early. As new work fell below what the database could finish, the queue began to drain. More accepted Logins completed before their deadlines.

Some people still received a fast failure. That is a real trade-off, not a perfect recovery. But the system stopped amplifying its own overload.

Here is the lesson: a healthy server does not guarantee a successful Login. Reliability means protecting the whole user journey, even when capacity runs out.

And what happens when one database is no longer enough? That is our next story.

### Five editorial HEAR → SEE beats (not voice timestamps)

**Beat 1 · editorial offset 00–10s · exact phrase suggestion:** `Look at the full Login journey`

Calm full 1920×1080 living map; one Phone, Gateway, Balancer, Auth01–03, one DB. No added replicas. Let the camera reveal the whole already-familiar world rather than building new props.

**Beat 2 · editorial offset 10–19s · exact phrase suggestion:** `We did not add servers`

Soft highlight over the unchanged 3 Auth + 1 DB topology. Short clear labels 3 AUTH · 1 DB · SAME CAPACITY; no misleading capacity increase.

**Beat 3 · editorial offset 19–32s · exact phrase suggestion:** `We reduced duplicate retries`

Three small restrained highlights, not obstructing cards: BOUNDED RETRIES, ADMISSION CONTROL, BOUNDED CONCURRENCY. The queue is visibly smaller, not magically zero.

**Beat 4 · editorial offset 32–41s · exact phrase suggestion:** `Some people still received a fast failure`

One original Phone displays a clear result for a NEW attempt; short REJECTED EARLY label acknowledges tradeoff. Fade back to actual successful accepted Login state without reusing the same attempt.

**Beat 5 · editorial offset 41–50s · exact phrase suggestion:** `Here is the lesson`

Final engineering statement in free space: HEALTHY SERVERS ≠ SUCCESSFUL LOGIN. Short next-episode hook ONE DATABASE · WHAT NEXT? Do NOT depict primary/replica or data topology yet.

---

## Reusable Remotion production rules

The one continuous clean architecture map from SHOT07 V2 must remain in SHOT08's first and last frames, with the *same exact three Auth instances and one User Database*, enabling SHOT07→08→09→10→11 transitions without a reset. All animated states are local subtle pulses, highlights, short labels or pool-slot occupancy changes, not flying requests, decorative red dashed lines or fake DB egress. Keep overlays out of protected nodes and Phone (20–24px minimum spacing tested); timed explanatory orange text should not cover architecture. Show only one large Phone. Frame 1920x1080 at 30fps. Never represent a rejected or timed-out request as later successful. Any new Remotion composition requires a *new* term-cue resolver and independently verified selected audio; old SHOT08 scaling `SHOT08_TERM_ORDER` and composition are **obsolete and must not render the new story**.

## Three extractable Shorts/Reels (no additional visual development)

- **Reel A / SHOT08:** `The Retry Storm Was Self-Inflicted` — retry budget + staggered backoff, visible declining duplicate attempts; end on unchanged DB capacity.
- **Reel B / SHOT09:** `900 Logins Arrive. The Database Can Handle 500.` — one shared admission budget, early load shedding and the honest tradeoff; no fictitious scaling.
- **Reel C / SHOT10:** `A Timed-Out Login Never Comes Back` — original timeout remains final; a clearly labeled **new** accepted Login succeeds after controlled recovery.

## Director approval gates and implementation order

1. Approve this **full SHOT08–11 narration, titles and story logic**. This is a new proposed revision, not a silent overwrite of the Director-LOCKED v4 script.
2. Supersede the old SHOT08 3→6 scaling plan in approved script/production source in a controlled source-change PR; adjust SHOT08–11 narration fingerprints, hashes, cue suggestions, visual contracts and term resolvers together. Ensure current SHOT08 scaling draft PR #237 is marked *superseded* and cannot be rendered into the revised story.
3. Build the new recovery visuals reusing the SHOT07 V2 clean architecture world, run full TypeScript/Node/Java and collision tests, then deploy a source-pinned Worker and Backend only after review.
4. Director generates/selects and approves replacement voice for each revised shot if required, then verifies fresh five-beat HEAR → SEE and real spoken term positions. Paid TTS and CPU each require separate explicit authorization. No synthetic timestamps.
5. Render and review each real H.264/AAC MP4 at 1920x1080/30fps, including transitions, semantic correctness and readable overlays. Only then request visual LOCK.
