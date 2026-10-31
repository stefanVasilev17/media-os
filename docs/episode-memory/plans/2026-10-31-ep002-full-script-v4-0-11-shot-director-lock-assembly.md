# Architectural Thinking — EP002 Full Script Pass v4.0 — Eleven-Shot LOCK Assembly

**Prepared:** 2026-10-31  
**Working title:** Why Login Fails Even When the Server Is Healthy  
**Original source:** Director-provided full EP002 Script Pass v4.0 dated 2026-10-30 (exact spoken text copied; SHOT 11 v1.1 approved separately 2026-10-31).  
**SHOT 01–10:** Director LOCKED on 2026-10-29 / 2026-10-30. No narration modifications authorized.  
**SHOT 11:** Director LOCKED v1.1 on 2026-10-31, exact narration + storyboard; [Director decision](../events/2026-10-31-ep002-shot11-v1-1-director-creative-lock.md).  
**Individual creative approval:** 11/11 shots.  
**Full-episode script assembly status:** **READY FOR SEPARATE FULL-EPISODE DIRECTOR LOCK** — not an assertion of MediaOS database-stage LOCK or a final edit approval.  
**Editorial target:** 13:30 (810 seconds), not 13:30 of proven ElevenLabs speech. Validate if final running time exceeds 15 minutes; prefer 12–14 minutes where approved narration and natural holds allow.  
**Voice:** English, ElevenLabs cloned creator voice; calm senior-architect documentary authority; no theatrical urgency.  
**Visual world:** Remotion-first; ONE WORLD. ONE LIVING MAP. MANY ENGINEERING STORIES. EP001 original LOCKED assets and renders untouched.  
**Teaching rule:** TERM → IMMEDIATE PLAIN-ENGLISH MEANING → VISIBLE PROOF ON THE LIVING MAP. Apply prospectively, do not retrofit previously approved words.  
**Research basis named by Director:** `EP002_Research_Truth_Map_v0_4.md` (not reverified or expanded by this assembly).  
**Storyboard basis named by Director:** `EP002_Script_Architecture_Pass_v0_3.md` (superseded for SHOTS 01–05 by Director v4.0 timing/logic).  
**Boundary:** This is the **voice-over verbatim preservation/assembly** for eleven scenes. The Director's complete v4.0 submission is the reference for each *full* visual choreography table, technical guard, and timed cue. We do **not** replace that submission with a new visual story.

## Frozen editorial sequence

| Shot | Editorial window | Director-LOCKED revision | Chapter |
|---|---|---|---|
| SHOT 01 | 00:00–00:40 | v1.4 | The Login That Keeps Waiting |
| SHOT 02 | 00:40–01:25 | v1.0 | 9:00 AM: The Ticket Sale Opens |
| SHOT 03 | 01:25–02:35 | v1.1 | The Database Capacity Limit |
| SHOT 04 | 02:35–03:35 | v1.1 | Alive Is Not Available |
| SHOT 05 | 03:35–05:05 | v1.1 | Connection Pool: The Hidden Queue |
| SHOT 06 | 05:05–06:15 | v1.2 | The Deadline Expires |
| SHOT 07 | 06:15–07:45 | v1.1 | When Retrying Creates More Failure |
| SHOT 08 | 07:45–09:10 | v1.0 | More Servers, Same Bottleneck |
| SHOT 09 | 09:10–11:10 | v1.1 | Contain the Failure |
| SHOT 10 | 11:10–12:40 | v1.2 | Measure the Journey That Matters |
| SHOT 11 | 12:40–13:30 | v1.1 | The System Was Telling the Truth |

**Approximate extracted narration count:** 1948 English whitespace-delimited words (markdown bold delimiters ignored); not audio measured. Every shot's exact text appears below. **Do not automatically polish or summarize the locked narration.**

---

## SHOT 01 — 00:00–00:40 — The Login That Keeps Waiting — DIRECTOR LOCKED v1.4

**English narration — source-exact; no edits:**

> You tap Login. A loading spinner appears… and keeps turning.
>

> A few seconds pass. Then ten. The screen doesn’t move forward, and it doesn’t tell you what’s wrong.
>

> Behind that screen, the server responsible for signing you in is still running. Its routine health checks are passing. Nothing appears to have crashed.
>

> And yet, your login is still waiting for an answer.
>

> How can a server appear perfectly healthy while the very thing it’s supposed to do isn’t working?
>

> To understand what’s really happening, we need to go back to nine o’clock.

---

## SHOT 02 — 00:40–01:25 — 9:00 AM: The Ticket Sale Opens — DIRECTOR LOCKED v1.0

**English narration — source-exact; no edits:**

> At nine o’clock, tickets for a major concert go on sale. Thousands of people open the app, hoping to sign in before the seats are gone.
>

> The software hasn’t changed. The number of people arriving has.
>

> Each tap sends a Login request through the API Gateway — the platform’s entry point. A Load Balancer spreads those requests across several Auth servers.
>

> At first, answers return quickly. But the stream keeps growing. Engineers call this the arrival rate: the number of new requests entering the system each second.
>

> The Auth servers share the traffic. But when they need to look up an account, they all depend on the same User Database.
>

> That’s where the pressure starts.

---

## SHOT 03 — 01:25–02:35 — The Database Capacity Limit — DIRECTOR LOCKED v1.1

**English narration — source-exact; no edits:**

> Now, all those Login requests are reaching the same User Database. And this is where things start to slow down.
>

> In our example, each Login needs one account lookup. The database can finish about five hundred of these lookups every second.
>

> Engineers call this **throughput** — how much work a system can complete in a given amount of time.
>

> But six hundred and fifty new Login requests are arriving every second. Then nine hundred.
>

> That’s the **arrival rate** — how quickly new requests enter the system.
>

> More requests are arriving than the database can handle. So unfinished work starts piling up. Some requests are being processed. Others are waiting.
>

> The database has become the **bottleneck** — the part slowing down the entire Login process.
>

> It has reached its limit. Engineers call this **saturation**.
>

> And as requests take longer to get an answer, **latency** — the time it takes to receive a response — increases.
>

> The database hasn’t stopped working. It just can’t keep up.

---

## SHOT 04 — 02:35–03:35 — Alive Is Not Available — DIRECTOR LOCKED v1.1

**English narration — source-exact; no edits:**

> Here’s the strange part. The User Database is overloaded, but the Auth Service still passes its health checks.
>

> A health check is a quick test of whether a service responds normally.
>

> A liveness probe helps decide whether an application needs restarting. A readiness probe helps decide whether it should receive new requests.
>

> In our example, neither checks the database. So both pass.
>

> But a real Login needs an answer from that database. And right now, it’s waiting.
>

> This brings us to service availability — whether people can actually complete the action they need.
>

> An end-to-end check tests that full journey, not just one server.
>

> On the phone, the spinner is still turning.
>

> The server is running. Its checks are passing. But the Login hasn’t finished.
>

> Being alive is not the same as being available.

---

## SHOT 05 — 03:35–05:05 — Connection Pool: The Hidden Queue — DIRECTOR LOCKED v1.1

**English narration — source-exact; no edits:**

> To see why the Login is still waiting, look inside one Auth server.
>

> Before checking an account, it needs a connection to the User Database. So it keeps a database connection pool — a group of connections ready to borrow and reuse.
>

> A Login borrows one, runs its lookup, and returns it when the database work finishes.
>

> In our example, each Auth Service instance is configured with a pool of up to eight database connections. We’re looking at Auth 01, but every instance has its own pool.
>

> Normally, connections are returned quickly. But the database is slower now, so each lookup takes longer. And each Login holds its connection longer.
>

> Let’s replay the last few moments.
>

> One connection busy. Five. Seven. Now all eight.
>

> That’s connection pool exhaustion — every connection in the pool is in use, with none left to borrow.
>

> Another Login arrives. It can’t even start its database lookup yet. It has to wait for a connection.
>

> That’s request queueing — requests lining up until a connection becomes available.
>

> We call these in-flight requests — requests that have started but haven’t finished.
>

> The Auth server is still running. The database is still responding. But this Login cannot move forward.
>

> On the phone, the spinner keeps turning. And time is running out.

---

## SHOT 06 — 05:05–06:15 — The Deadline Expires — DIRECTOR LOCKED v1.2

**English narration — source-exact; no edits:**

> Look at this Login. It’s waiting for a connection inside Auth 01. But time is running out.
>

> Every Login here has a **request deadline** — the time by which it must finish. Waiting for a connection doesn’t stop the clock.
>

> The account lookup hasn’t even started.
>

> Then the time runs out.
>

> That’s a **request timeout** — the caller stops waiting because no answer arrived in time.
>

> On the phone, the spinner finally stops. “Please try again.”
>

> For the user, that’s the end. But the system may still be working.
>

> Watch another Login. It started a database lookup before its caller timed out. That lookup may still be running, holding a connection and using database capacity.
>

> While that work continues, new Logins have fewer resources available. They wait longer too.
>

> That’s why **cancellation** matters — a signal that says, “The result is no longer needed. Stop this work if you can.”
>

> If the system can stop it, those resources become available sooner for other Login requests.

---

## SHOT 07 — 06:15–07:45 — When Retrying Creates More Failure — DIRECTOR LOCKED v1.1

**English narration — source-exact; no edits:**

> The phone has stopped waiting. But other Logins are still running.
>

> Watch one of them. Its account lookup takes too long, so Auth 01 tries again.
>

> That’s a **retry mechanism** — repeating an operation when it fails or takes too long. It can help when a problem lasts only a moment.
>

> But our database is already overloaded. The first lookup may still be running. The retry adds even more work.
>

> Soon, other Auth servers start retrying too.
>

> New Login traffic hasn’t increased, but database attempts have.
>

> That’s **retry amplification** — one Login creates more than one database attempt.
>

> When many Logins retry at once, we call it a **retry storm** — a wave of extra work hitting the same overloaded database.
>

> Now watch what happens. The database gets slower. Auth connections remain busy longer. New Login requests wait, and more users time out.
>

> That’s a **cascading failure** — a problem in the User Database spreads to the Auth servers, then to the people trying to log in. The servers haven’t crashed. They can’t get answers fast enough.
>

> The retries were meant to help. Instead, they make the bottleneck worse.
>

> And here we retry only a safe, read-only account lookup while the Login is active — never the whole Login.

---

## SHOT 08 — 07:45–09:10 — More Servers, Same Bottleneck — DIRECTOR LOCKED v1.0

**English narration — source-exact; no edits:**

> What if we add more Auth servers?
>

> Engineers call this horizontal scaling — adding more instances of a service so they can share incoming requests.
>

> Watch the Load Balancer. Three Auth servers become six. Now it has more places to send Login requests.
>

> Each new Auth server also has its own pool of up to eight database connections, just like the others.
>

> At first, that sounds like a solution. More servers. More room to handle requests.
>

> But look where those connections lead.
>

> All six Auth servers still depend on the same User Database. And that database is already handling as much work as it can for this workload.
>

> Adding Auth servers doesn’t make the database finish lookups faster. It may simply let more requests compete for the same limited capacity.
>

> That’s a shared bottleneck — when several services depend on one resource, and that resource cannot keep up.
>

> Imagine widening a road, but leaving the bridge ahead only one lane wide. More cars reach the bridge. They don’t cross it any faster.
>

> Horizontal scaling helps when your application servers are the limit. But here, they aren’t.
>

> We scaled the Auth servers. Not the bottleneck.

---

## SHOT 09 — 09:10–11:10 — Contain the Failure — DIRECTOR LOCKED v1.1

**English narration — source-exact; no edits:**

> We doubled the Auth servers in our example. But the database is still the limit. So how do we stop things from getting worse?
>

> Start with retries. Sending the same lookup again and again only adds pressure. A retry budget is a limit on how many extra attempts the system is allowed to make. When that limit is reached, we stop retrying.
>

> And when a retry is safe, we don’t send it immediately. We use exponential backoff — waiting longer after each failed attempt. Then we add jitter — a small random change to that wait, so retries don’t all reach the database at once.
>

> But retries are only part of the problem. People are still arriving faster than the database can serve them.
>

> That’s where load shedding helps — rejecting some new Login requests early, rather than letting every request wait until it times out. Some users get a clear failure. But the system has more room to finish other Logins.
>

> If database calls keep timing out, a circuit breaker can temporarily stop sending more of them. Those Logins fail quickly instead of waiting. Nobody gets signed in without an account check. Later, the system can carefully test whether the database is responding again.
>

> We can also use bulkhead isolation — keeping separate limits for different kinds of work. Each Auth server has a pool of up to eight database connections. We could reserve six for new Login lookups and two for retries. If retries surge, they cannot take the connections reserved for new Logins.
>

> These protections don’t make the database faster. They stop wasted work and limit new pressure. And if the amount of work we let through becomes lower than what the database can finish, the waiting line can finally start to shrink.

---

## SHOT 10 — 11:10–12:40 — Measure the Journey That Matters — DIRECTOR LOCKED v1.2

**English narration — source-exact; no edits:**

> Some Login requests now fail quickly. Others finally get through. That looks better. But how do we know whether the system is actually recovering?
>

> First, check the success rate — how many Login attempts with correct credentials finish successfully. Then the error rate — how many fail because the system times out or cannot complete the operation.
>

> A wrong password is different. Rejecting it is the correct result, not a server failure.
>

> But even a successful Login can feel broken if it takes too long.
>

> That’s why engineers measure P95 latency — the time within which ninety-five out of a hundred measured successful Logins finish. P99 latency uses ninety-nine out of a hundred. These numbers help us spot slow requests that an average might hide.
>

> And where is a slow Login losing time?
>

> Distributed tracing shows the steps a request takes through the Gateway, Auth Service, and database — and how long each step takes. We can see whether it waited for a connection or for a database response.
>

> But we also need to measure the experience users actually get.
>

> An SLI, or Service Level Indicator, is that measurement. For example, the percentage of valid Logins completed within two seconds.
>

> An SLO, or Service Level Objective, is the target we set for that measurement. For example, our goal is to complete at least ninety-nine point nine percent of valid Logins within two seconds over a thirty-day period.
>

> A health check tells us a server responds. These measurements show whether people can sign in on time.

---

## SHOT 11 — 12:40–13:30 — The System Was Telling the Truth — DIRECTOR LOCKED v1.1

**English narration — source-exact; no edits:**

> Look at the full Login journey one last time.
>

> Thousands of real users reached one shared database. Lookups slowed. Auth connections stayed busy. Requests waited. And when their deadlines expired, people couldn’t sign in.
>

> The servers were still running. But the full Login journey was failing for many users.
>

> Limiting retries, rejecting excess traffic early, and protecting connections can help contain the damage. These protections don’t make the database faster. They help the system work within its limits.
>

> That’s the real lesson: a healthy server doesn’t guarantee a successful Login.
>

> And it leaves one question. What happens when the database itself needs more capacity?
>

> That’s where our next story begins.

---

## Immutable production truth and visual continuity guardrails from v4.0

1. **Story trigger:** fictional concert-ticket surge at 09:00, legitimate users, no software changes; incoming original Login request wave approximately 100 → 350 → 650 → 900 per second. Shared DB capacity approximately 500 *completed account lookups/second* for the illustrative workload. These are different counters; no observed real incident is asserted.
2. **Continuity:** SHOT 01 teaser is a flash-forward; SHOT 02 rewinds. Phone spinner continues through SHOTS 01–05. The **first** user-facing “Please try again.” happens in SHOT 06, never in SHOT 01/04/05.
3. **Shallow probes:** in this example both Auth liveness and readiness pass because neither checks User Database. This is a configuration choice, not a universal statement about readiness.
4. **Database behavior:** process and some lookups continue under saturation; red processing-pressure accent does not mean DB offline. Latency rises, unfinished work is distributed, not an unlimited real DB queue.
5. **Pool state:** eight maximum reusable DB connections **per Auth replica**, including Auth 01; make the explicit replay visible before going from current 8/8 to historic 1/8, then back. Pool waiters, in-flight requests, login arrivals, DB completions, and attempts all have different meanings.
6. **Distinct timeouts:** tracked REQUEST A is waiting before acquiring a pool connection and never starts lookup; expires in SHOT 06. REQUEST B already started a lookup and may continue after caller timeout. Cancellation helps only when propagated and honored.
7. **Safe retries only:** while the logical Login remains active, retry an appropriately safe **read-only account lookup** only, never automatically replay whole Login POST; attempts need not equal completed DB queries. Rising lookup attempts need not imply rising new Login arrivals.
8. **Scaling what-if:** SHOT 08 hypothetically scales Auth 3→6 and preserves the same DB bottleneck. Up to eight connection slots per replica is *configured max*, not a guarantee of 48 open connections.
9. **Mitigations:** SHOT 09 separately demonstrates retry budget, exponential backoff, jitter, load shedding, fail-closed circuit breaker, and an **illustrative** enforced bulkhead split of the same max eight slots into six fresh lookups + two safe read-only retries. This is not a real deployment nor an automatic cure; backlog can fall only if admitted work including retries becomes sustainable.
10. **Measurement:** SHOT 10 distinguishes correct credential rejection from system errors; success/error cohort/denominator explicit; P95/P99 latency of a defined successful-login cohort, failed requests monitored separately; distributed tracing along actual backend hops; illustrative SLO **at least 99.9% of valid Logins finished within 2 seconds over 30 days**, not a verified result.
11. **Ending:** SHOT 11 recaps the story and asks only the unanswered DB capacity question. No Primary/Replica, replication lag, consistency, session lifecycle, or EP003 lock.
12. **Shorts:** conceptual three extracts: SHOT04 Alive ≠ Available, SHOT07 Retry Amplification, SHOT08 Scaling Trap. Candidate editorial windows require separate voice-aligned stand-alone comprehension QA; not final exports.
13. **Visual method:** camera/semantic triggers must follow approved ElevenLabs word-level alignment, not arbitrary frame counts. Sparse labels; one persistent EP001-derived Living Architecture Map; only required new primitives after asset-registry reuse review.

## Production gates — current next actions

**Gate 1 — Full-episode Director script assembly lock:** Director reviews this exact eleven-shot sequence, confirms no text change, and explicitly approves the full assembled episode as a single version. This gate is **PENDING**; previous per-shot LOCKs do not silently imply new backend stage writes.

**Gate 2 — ElevenLabs voice production:** Only after Gate 1, produce per-shot / per-chapter voiced clips with cloned creator voice and approved pacing/mood. Preserve exact words. Store generation, version, clip identity and word-level timings, then obtain voice approvals and resolve all timing/cut continuity. No unapproved voice regeneration or existing source modification.

**Gate 3 — Episode-level visual pass:** Build complete camera/geography/continuity plan around one Living Map; list reused EP001 nodes/paths/components, required EP002-specific primitives, and shot boundary carry-over. Validate each locked visual story against the source v4.0 choreography.

**Gate 4 — Shot-level visual pass and component consistency:** Map every spoken term to immediate map proof, identify precise camera/animation cues from real audio, reuse assets deterministically, and approve shot specs; only then implement isolated Remotion EP002 shots.

**Gate 5 — Isolated render QA & Director review:** Run type/tests and shot-preview first; compare narration to immutable transcript, check voice sync/legibility/continuity, verify true frame count/fps and audio/video end, then perform full-episode review and Shorts comprehension cut test.

**Infrastructure boundary:** EP002 does not exist as a row in the production MediaOS `episode` table as of read-only check on 2026-10-31. Do not claim this document executed an episode-stage LOCK in PostgreSQL or created an episode. Do not touch production services/DB, EP001 LOCKED sources, or PR #110. Any later audited MediaOS import requires separate preflight and Director authorization.

**Status:** ready for final Director assembled-script review; no automatic merge/deploy/production-stage lock/voice spend.
