# EP003 — What Happens When One Database Is No Longer Enough?

**SCRIPT PASS v0.4 — DIRECTOR LOCKED (2026-11-13)**

**Series:** Login Architecture — Final Episode  
**Target runtime:** 16–18 minutes, provisional  
**Audience:** Software Engineers, Senior Engineers, Architects, Tech Leads and technically curious viewers  
**Narration:** Natural English, calm Senior Architect, clear storytelling and practical technical depth  
**Production:** Remotion-first, one continuous Living Architecture World  
**Status:** DIRECTOR-LOCKED SCRIPT v0.4 — 11 SHOT narration texts immutable unless the Director explicitly approves a new version.

**Story promise:** We know how to protect an overloaded database. Now we must discover how to increase capacity without breaking the correctness of Login.

**Narration rule:** The paragraphs below are spoken text. Technical terms are explained inside the story. Production instructions are deliberately kept separate.

**LOCK provenance:** The Director explicitly approved the exact Script Pass v0.4 in this conversation on 2026-11-13 (“Много добре! Локваме скрипта!”). The narration paragraphs below reproduce that approved version without editorial revision. Timeline labels remain WORKING, not voice-measured. Script LOCK is NOT Voice LOCK, HEAR→SEE LOCK, SceneSpec LOCK, MP4 LOCK, or episode delivery approval. Any future change must use a separate reviewed version, never silently overwrite this file.

---

## SHOT 01 — The System Is Stable. But People Still Cannot Log In.

**Working timeline: 00:00–01:10**

The ticket sale is still running.

Thousands of people are trying to log in. And after everything that happened, our system is finally under control.

The retry storm has stopped. Database connections are no longer growing without limits. And the Auth servers are not wasting their capacity on requests that have already timed out.

But something important has not changed.

Some people are still being rejected before they can complete Login.

In the previous episode, we introduced *admission control*. This means deciding how much work a system can safely accept before sending it to a limited resource.

When traffic becomes too high, we can reject some requests early. Engineers call this *load shedding*.

Instead of letting thousands of requests wait until the entire system becomes unstable, we protect the database by refusing work we cannot finish.

That is a good reliability decision.

But think about the person holding a phone, trying to buy a ticket.

A fast rejection is still a failed Login.

We have learned how to survive overload.

Now we need to solve a different problem.

**What if the business needs more capacity than our database can provide?**

And what happens when adding more machines makes the architecture more complicated than we expected?

---

## SHOT 02 — Find the Real Bottleneck

**Working timeline: 01:10–02:35**

Let's look at our architecture again.

A Login request leaves the Phone, passes through the API Gateway, and reaches the Load Balancer.

The Load Balancer selects one of three Auth servers.

But all three Auth servers still depend on one User Database.

During our ticket sale, imagine nine hundred new Login requests arriving every second.

Under this particular workload, the database can complete approximately five hundred account lookups per second.

This is its measured *throughput* — the amount of work it can finish in a given period.

We cannot safely keep sending nine hundred lookups into a database that finishes only five hundred.

The extra work creates queues. Queues increase waiting time. And eventually, requests begin to time out.

That waiting time is part of *latency* — how long an operation takes to complete.

Notice the difference.

Throughput tells us how much work gets finished. Latency tells us how long individual operations take.

Our User Database is now the *bottleneck*: the component limiting the capacity of the complete Login journey.

We can add a fourth Auth server. Or a fifth.

But if every new server sends more queries to the same database, the bottleneck remains.

In the previous episode, we protected that database with a shared admission budget of about four hundred and fifty lookups per second, including any permitted retry work.

That gave us safety headroom.

It did not make the database faster.

So our next task is not to add machines everywhere.

It is to understand exactly which database work needs more capacity.

---

## SHOT 03 — One Primary. Two Replicas.

**Working timeline: 02:35–04:00**

Until now, our architecture has used one User Database.

Let's explore our first scaling option.

The existing database becomes the *Primary*. It remains the main authority for accepting changes to account information.

Now we introduce two additional database instances.

Replica A. And Replica B.

This design is called *primary-replica replication*.

The replicas do not contain different groups of users. They maintain copies of the same underlying account data.

When the Primary records a change, that change is transferred to the replicas.

In our example, we use *asynchronous replication*.

The Primary does not wait for every replica to apply a change before confirming its own commit.

That can avoid some extra write latency.

But it also means the replicas may temporarily be behind.

Why accept that trade-off?

Because many database operations are reads. They ask for information without changing it.

If suitable reads can run on the replicas, those queries no longer need to consume the Primary's processing capacity.

We have added more machines to share part of the workload. That is one form of *horizontal scaling*.

But remember what we have actually built.

Three database instances do not mean three independent owners of every account.

There is still one Primary responsible for writes.

And that leads to a more interesting question.

**Who decides which database should answer a particular query?**

---

## SHOT 04 — Who Decides Which Database Gets the Query?

**Working timeline: 04:00–05:40**

Watch another Login request reach Auth 01.

We now have three database instances.

It might seem reasonable to send one query to the Primary, the next to Replica A, and the next to Replica B.

But that could be a dangerous mistake.

The Load Balancer decides which Auth server receives the Login request.

Inside Auth 01, a different decision must happen.

Which database should answer each query?

Engineers often call this *read/write splitting*.

Writes are sent to the Primary. Suitable reads may be sent to a replica.

But not every read has the same requirements.

Imagine Auth 01 needs to check whether an account is allowed to authenticate.

What if someone disabled that account a moment ago?

An outdated answer could cause the system to make the wrong security decision.

In our design, that critical check stays on the authoritative Primary.

Now imagine authentication succeeds, and the application wants to load the user's preferred display language.

That is also a database read.

But if the language preference is a few seconds old, the consequence is usually much smaller.

We can allow that query to go to Replica A.

Another suitable read may go to Replica B.

This is *read scaling*.

We distribute suitable read work across multiple database instances instead of asking one server to answer everything.

The Primary may now have more available capacity.

But look carefully.

Our critical authentication check never moved.

If that check consumes most of the Primary's capacity, adding replicas might barely improve the number of successful Logins.

**More read capacity does not automatically mean more Login capacity.**

And there is another problem waiting inside those replicas.

How do we know their information is recent enough to trust?

---

## SHOT 05 — The Replica That Gives the Wrong Answer

**Working timeline: 05:40–07:10**

Let's follow one account change.

A user's account has just been locked after suspicious activity.

The Primary records the new status.

The account is now locked.

But Replica A has not applied that change yet.

For a short time, the two database instances contain different visible versions of the same information.

This delay is called *replication lag*.

It is the delay between a change becoming available on the Primary and that change becoming visible on a replica.

Now another Login request arrives.

Our safe design should use the authoritative path for this security check.

But imagine we had routed it to Replica A without checking whether the data was fresh enough.

Replica A might still report that the account is active.

This is called a *stale read*.

The query completes successfully.

The database responds quickly.

Every machine may appear healthy.

But the answer is no longer suitable for the decision.

This is a consequence of *eventual consistency*.

When replication is working and changes stop, the replicas are expected to catch up. Until then, different instances may expose different versions of the data.

That behavior may be acceptable when loading a display preference.

It may be unacceptable when deciding whether a disabled account should be allowed to authenticate.

And this gives us one of the most important lessons in database architecture.

**A healthy database can return a fast answer that is still unsafe to use.**

The next problem is deciding how much freshness each operation actually needs.

---

## SHOT 06 — Correctness Before Speed

**Working timeline: 07:10–08:40**

We now face a choice.

Should we always use the fastest available database?

Or should some operations require stronger guarantees about the information they receive?

This is a question of *data consistency*.

A consistency guarantee describes which version of information an operation is allowed to observe.

For example, our Login system must not accept a disabled account based on an older account status.

In this design, we route that critical check to the current authoritative Primary, using the database guarantees required by our security policy.

That is a different requirement from loading a user's display language.

Another system could use version information to verify that a replica has applied a particular change before trusting its answer.

If the required version is missing, the application must make a decision.

It might wait for replication.

It might use the authoritative database.

Or, if it cannot safely verify the account state, it might reject the authentication attempt.

That last approach is called *fail closed*.

When the system cannot prove that an action is safe, it refuses the action instead of making an optimistic security decision.

But there is a cost.

Waiting increases latency. Returning to the Primary increases pressure on the bottleneck. Rejecting requests reduces availability.

So the architecture must balance performance with the consistency required by each operation.

And using the Primary is not a magical guarantee by itself. The system still needs correct transactions, database isolation, and safe handling of leadership changes.

The real question is simple.

**How do we serve more users without making authentication decisions from information we cannot trust?**

Now we are ready to measure what our replicas actually achieved.

---

## SHOT 07 — Did We Really Fix the Bottleneck?

**Working timeline: 08:40–10:10**

Look at the architecture now.

Three Auth servers.

One Primary.

Two read replicas.

There are more machines, more connections, and more places where queries can run.

So let's return to our original problem.

Nine hundred new Login requests per second.

About five hundred account lookups per second on the original database.

What happened after adding the replicas?

Suppose we measure the workload and discover something important.

The replicas are busy serving optional reads.

But the security-critical account lookup still goes to the Primary for almost every Login.

And that operation was the main reason we reached our original capacity limit.

The replicas helped some queries.

But they did not remove the operation that limits Login completion.

This is where the *critical path* becomes important.

The critical path is the sequence of operations that must finish before the user can complete an action.

For Login, the required account checks are part of that path.

Making an optional preference lookup faster may improve the experience.

But it does not remove the Primary dependency from the critical path.

This explains why a system can become more complex without becoming significantly more capable.

The diagram has more database instances.

The monitoring dashboard shows more available read capacity.

And still, some users cannot log in.

**We scaled the reads that could move. But the work limiting Login stayed in one place.**

Now we have a better question.

Instead of copying the same account data onto more servers, what if we divided account ownership between independent database groups?

---

## SHOT 08 — When Copies Are Not Enough

**Working timeline: 10:10–12:10**

Let's consider a different architecture.

Until now, every account has belonged to one Primary Database.

Instead of keeping all accounts under that single owner, imagine dividing them into separate groups.

One database group owns one set of accounts.

Another database group owns a different set.

This is called *sharding*.

A shard is a partition of the data with a defined owner.

And unlike read replicas, separate shards can have separate Primary instances responsible for their own accounts.

Think about our original Login bottleneck.

If account lookups can be distributed across independent owners, the critical authentication work no longer has to reach the same Primary every time.

A request for one account reaches Shard A.

A request for another account reaches Shard B.

Each shard performs its own authoritative account check.

Now we have a real opportunity to distribute the work that was previously limiting Login throughput.

But how does Auth 01 know which shard owns an account?

We need a *shard key*.

A shard key is information used to determine where a record belongs.

For our example, imagine that account routing uses a normalized Login identifier through a consistent mapping rule.

The database routing layer uses that identifier to find the correct shard.

But this creates an important responsibility.

If the user changes that identifier, the system must still find the correct account. The routing and any required data migration must remain consistent.

And if the query does not contain enough information to identify the owner, we may need an additional lookup or a query across multiple shards.

That can create a new bottleneck.

There is another risk.

What if one shard receives most of the traffic while the others are almost idle?

That is a *hot shard*.

Sharding only helps when the data and workload are distributed in a useful way.

It also makes account migration, cross-shard operations, and recovery more complicated.

And each shard can still have its own replicas for availability and suitable reads.

So replication and sharding are not competing names for the same solution.

**Replication creates copies of data. Sharding divides responsibility for data.**

For our Login example, sharding may let us distribute critical account lookups between multiple Primary owners.

That is the capacity improvement we were looking for.

But it is still a hypothesis until testing proves the complete Login journey can handle the additional demand.

And now, with more than one database owner, another question becomes unavoidable.

What happens when one of those owners fails?

---

## SHOT 09 — When the Primary Disappears

**Working timeline: 12:10–13:40**

Let's zoom into one of our account shards.

It has a Primary and a replica.

The Primary owns changes to that shard's accounts.

Now imagine it suddenly becomes unavailable.

Requests for accounts on this shard begin to fail or wait. Accounts belonging to another healthy shard may still be served.

The replica gives us a possible recovery path.

We can promote an eligible replica to become the new Primary.

That process is called *failover*.

But before the new Primary starts accepting writes, the system must establish that it is the legitimate owner.

Why?

Because the old Primary might return.

Imagine the old Primary accepting one account change while the newly promoted Primary accepts another.

Now two machines believe they own the same data.

This is a *split-brain* problem.

A safe design needs coordination and fencing: a way to prevent the former Primary from continuing to act as the writer after ownership has changed.

But there is one more risk.

Our replication is asynchronous.

The replica might not have received every recent committed change before the original Primary failed.

So promoting it could mean losing some recent data.

This is why failover cannot be treated as simply changing a green arrow on a diagram.

It is a decision about ownership, recovery and correctness.

More database instances can help the system survive a failure.

**But availability is not enough if the system recovers into the wrong account state.**

The only way to trust this architecture is to test those failures before users experience them.

---

## SHOT 10 — Prove the Architecture Works

**Working timeline: 13:40–15:15**

Let's return to the ticket sale.

We started with one database that could not finish all the incoming account lookups.

Now we have explored replication, read routing, consistency rules, sharding and failover.

The architecture is more capable in theory.

But how do we prove it works?

We start with the outcome that matters.

How many legitimate Login attempts finish correctly and within an acceptable time?

This is a *Service Level Indicator*, or SLI.

An SLI is a measurement that tells us how a service is performing.

A *Service Level Objective*, or SLO, is the target we want that measurement to meet.

For example, we might set a target for the percentage of legitimate Login attempts completed correctly within two seconds.

And we must count requests rejected by overload protection, not hide them from the result.

We also measure latency.

One common metric is *p95 latency* — the time within which ninety-five percent of the measured requests completed.

But measuring only successful requests can be misleading.

A system that rejects half its users might still show excellent latency for the remaining half.

Inside the database layer, we watch throughput, queue depth, Primary load, replication lag and workload distribution across shards.

We test what happens when one shard becomes overloaded.

We test failover.

And we measure how long recovery takes, and whether any recent committed data is lost.

Engineers describe those recovery goals using RTO and RPO: acceptable recovery time and acceptable data loss.

Now we can finally compare the architecture with the original problem.

Can it complete more legitimate Logins correctly?

Can it keep doing that under pressure?

And does the improvement justify the additional complexity?

**The purpose of scaling is not to make a diagram bigger. It is to make the user's journey work.**

---

## SHOT 11 — What One Login Teaches Us About Architecture

**Working timeline: 15:15–16:35**

Think about where our story began.

One person entered a password and pressed Login.

We followed that request through the Phone, Gateway, Load Balancer, Auth Service and User Database.

We discovered how a successful authentication becomes trusted state.

Then we introduced pressure.

The servers were healthy. But the system could not complete every Login because one shared database had reached its limit.

We learned how to protect that database.

But protecting a bottleneck did not give us more capacity.

So we explored new architectural choices.

Replication gave us more places to serve suitable reads.

Consistency rules helped us understand when those reads were safe.

Sharding showed us how separate database owners could distribute the work that replicas could not remove.

And failover reminded us that capacity is only one part of reliability.

Every improvement came with another responsibility.

More capacity required better routing.

More copies required clearer consistency rules.

More owners required stronger coordination and recovery.

That is the real work of System Design.

Not choosing the architecture with the most components.

But understanding which responsibility belongs where, which trade-offs we accept, and what happens when part of the system stops behaving as expected.

And behind all those decisions is still the same person.

Someone pressing Login and expecting the system to work.

**The architecture succeeds when the human journey succeeds — and the result can still be trusted.**

---

**END OF LOGIN ARCHITECTURE SERIES**

**Draft status:** v0.4 — Director review required. Script, voice, visual choreography and timings are not locked.

**P0 visual continuity:** Every SHOT after SHOT 01 starts with the exact approved final rendered state of the previous SHOT. All camera movement, positions, active paths and objects remain continuous. Natural narrator-free breathing gaps must preserve real motion, not freeze the scene.

**Production authorization:** This Script Pass does not authorize paid ElevenLabs generation, rendering, source replacement or deployment.

---

## POST-APPROVAL LOCK RECORD — NOT SPOKEN NARRATION

On 2026-11-13, following the draft copy above, the Director explicitly approved and LOCKED Script Pass v0.4. Therefore the preceding historical draft-status line is part of the *exact approved source text* and must not be interpreted as the current authority. **Current state: EP003 SCRIPT v0.4 DIRECTOR-LOCKED; voice, timing, visuals, HEAR→SEE, media and release still NOT LOCKED.** Do not rewrite any narration under this version. A proposed change requires a new version and separate Director authorization.

**Source precedence:** This immutable script → next versioned Voice Direction/HEAR→SEE (not altering source) → Shot-Level Visual Pass with [P0 Invisible Cross-SHOT Continuity](../../engineering/AT_DIRECTOR_P0_INVISIBLE_CROSS_SHOT_CONTINUITY_20261113.md) → explicit paid authorization → actual render → QA → Director LOCK per output. No silent changes, no automatic payment, no GitHub Actions.
