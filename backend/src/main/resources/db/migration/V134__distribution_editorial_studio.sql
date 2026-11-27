create table episode_distribution_revision (
    package_id uuid not null references episode_package_import(id),
    item_id uuid not null,
    revision integer not null check(revision between 1 and 100),
    platform varchar(24) not null,
    kind varchar(24) not null check(kind in ('ARTICLE','POST','RESEARCH','DISCUSSION')),
    title varchar(200) not null,
    body text not null check(octet_length(body)<=131072),
    sources text not null check(octet_length(sources)<=16384),
    assets text not null check(octet_length(assets)<=8192),
    destination varchar(300) not null,
    launch_day integer not null check(launch_day between -30 and 365),
    state varchar(24) not null check(state in ('DRAFT','APPROVED','READY_TO_PUBLISH','PUBLISHED','BLOCKED','SKIPPED')),
    evidence text not null check(octet_length(evidence)<=16384),
    published_url varchar(2048),
    published_on date,
    master_sha256 varchar(64),
    actor varchar(256) not null,
    recorded_at timestamptz not null default now(),
    primary key(package_id,item_id,revision),
    check(master_sha256 is null or master_sha256 ~ '^[a-f0-9]{64}$'),
    check((state='PUBLISHED')=(published_url is not null and published_on is not null))
);
create table episode_distribution_launch (
    package_id uuid primary key references episode_package_import(id),
    revision integer not null check(revision>0),
    video_url varchar(2048),
    launch_date date,
    actor varchar(256) not null,
    updated_at timestamptz not null default now()
);
create index episode_distribution_latest_idx on episode_distribution_revision(package_id,item_id,revision desc);

-- AI-assisted editorial drafts, not approved or published; exact EP004 master only.
insert into episode_distribution_revision(package_id,item_id,revision,platform,kind,title,body,sources,assets,destination,launch_day,state,evidence,master_sha256,actor)
select p.id,v.item_id::uuid,1,v.platform,v.kind,v.title,v.body,v.sources,v.assets,v.destination,v.launch_day,'DRAFT','',f.sha256,'EXECUTOR_DRAFT_2026_11_27'
from episode_package_import p join episode_director_film f on f.package_id=p.id
cross join (values
('d1340000-0000-4000-8000-000000000001','MEDIUM','ARTICLE','The Failover Trap: What the Microsoft 365 Outage Teaches Us About Distributed Systems','Draft developed with AI assistance; requires the author''s own technical review and substantive original contribution before publication.

Subtitle: Redundancy is a property of infrastructure. Resilience is a property of a system under stress.

A request fails. The load balancer selects another destination. The second destination is healthy, and the routing decision is correct according to its local rules. Now imagine that the extra traffic makes that destination fail as well. A third receives the combined workload. Before long, the mechanism intended to protect users is increasing the pressure on every component that remains available.

This is not an argument against failover. It is an argument against treating failover as an unlimited resource. The real question is whether the destination has enough usable capacity to perform the additional work, and whether it can do so without sharing the condition that caused the first failure.

## The incident as a starting point

Microsoft''s final report for the November 12, 2026 incident describes a configuration-specific Windows defect on Microsoft 365 gateways serving Exchange Online. Concurrent connection processing, maintenance-related capacity reduction, redirected Teams traffic and peak demand combined to expose the defect. Traffic redistribution then carried the pressure beyond the initially affected infrastructure. The analysis below uses an illustrative model rather than claiming access to Microsoft''s internal implementation.

That distinction matters. An architecture diagram explains a mechanism. It does not prove that the exact components, retry settings or control loops depicted were used in the real service.

## The missing variable in a failover decision

Consider a hypothetical service with ten equal processing nodes. Each can safely handle 100 requests per second under a representative workload. A router receives 700 requests per second. With an even distribution, each node processes 70. This is a comfortable operating point, provided the capacity estimate is valid.

Suppose two nodes disappear during maintenance. The remaining eight now process about 87.5 requests per second each. Another node becomes unavailable. The remaining seven are at their estimated safe capacity. If one more disappears, average offered load rises to approximately 117 requests per second. The arrival rate has not changed. The number of available processing destinations has.

Even this model is optimistic: requests are not identical, routing is not perfectly even, and a node can process fewer requests when a particular dependency becomes slow. A capacity number measured during steady-state testing is not a permanent guarantee.

The system should make decisions using work completed within latency and error budgets, rather than counting how many machines answer a probe. If the fleet has insufficient safe capacity, moving every request is not a complete recovery plan.

## Why spare servers are not always spare capacity

Redundancy provides alternatives when failures are independent. If a hardware fault affects one machine, another may handle the work without difficulty. If the failure condition is a shared software path activated by concurrency, redirecting load can increase the likelihood of activating the same condition elsewhere.

An architecture review should therefore include a failure-domain map as well as a deployment map. Which destinations share a runtime build, identity dependency, queue, database, network path or release policy? Which groups have actually demonstrated that they can survive without one another? Two boxes in separate regions may still depend on the same global decision-maker.

The goal is not to make everything different. Diversity creates operational cost and its own failure modes. The goal is to make the dependencies explicit, so a failover policy does not assume independence that has never been established.

## When the router becomes part of the feedback loop

A typical router detects an unhealthy destination and removes it. At low demand, that is an effective response. Under widespread overload, the same response can increase the utilization of the remaining destinations. Latency rises; timeouts and retries can add work; additional destinations become unhealthy.

The loop contains no necessarily malicious or broken decision. Each component may be doing what its local policy requests. The system-wide effect depends on the interaction of those policies.

A capacity-aware controller can respond differently. It can reduce the accepted workload, prioritize critical traffic, limit the amount redirected at once and treat a rapidly changing health signal as a reason to stop aggressive redistribution. It needs hysteresis, so a transient change does not cause the entire fleet to oscillate between healthy and unhealthy.

The trade-off is visible: rejecting some requests is uncomfortable. But rejecting a bounded fraction early can protect the ability to complete the remaining work, whereas accepting all requests into a queue may cause nearly all of them to miss their deadlines.

## A practical way to review admission control

Start by defining the work that must continue during degraded operation. For a hypothetical business application, write operations affecting money or identity may have different correctness requirements from optional search suggestions. A degraded response must never pretend that an uncommitted operation succeeded.

Next, decide where admission is enforced. A global controller can distribute budgets, while local services retain the ability to reject work when their measured capacity drops. Local protection is useful when the central controller is slow or unavailable. Global budgets help prevent multiple clients from individually behaving reasonably but collectively overwhelming a destination.

Retries need a budget of their own. A timeout does not tell a client whether the previous request completed. For side-effecting operations, idempotency is essential; for all operations, bounded attempts, deadlines and jitter reduce synchronized demand. A retry should consume capacity from an explicit budget rather than arrive as invisible extra work.

Finally, define metrics that indicate whether the policy is helping: useful completions, queue age, rejection rate, latency distribution and recovery time after load is removed. CPU utilization and process health remain valuable diagnostic signals, but neither directly represents useful outcomes.

## Recovery is a second operating mode

A newly restarted process is not equivalent to a fully recovered service. It may have cold caches, empty connection pools and a large population of clients waiting to reconnect. If the router restores its previous traffic share immediately, it can create a second load event.

A safer recovery design introduces traffic gradually. Establish the corrected build or configuration, verify dependencies, admit a small representative workload, and increase the share only while completion rate and latency remain acceptable. Preserve the ability to stop or reverse the ramp.

This should be tested before an outage. A normal steady-state load test does not automatically tell us what happens when the fleet returns from near-zero useful capacity. Recovery exercises should include accumulated client demand, partial dependency failures, delayed telemetry and the possibility that a controller loses contact with part of the fleet.

## Questions to take into the next architecture review

How much demand can the system safely admit after losing its largest shared failure domain? Is that number measured on current production-like infrastructure? What happens when several healthy destinations fail for the same reason? Does the routing policy know the difference between a running process and a destination that can accept more work?

What is the maximum retry amplification allowed across service boundaries? Can a region preserve its own recovery capacity instead of accepting every incoming reroute? Is there a documented procedure for reducing traffic and bringing a corrected cohort back safely?

These questions are useful whether a team runs ten application instances or a global gateway fleet. The details of the answers depend on the workload. The discipline is the same: evaluate the behavior of the whole system, including the recovery mechanisms, rather than assuming that a list of individually reliable components adds up to resilience.

## Conclusion

Failover remains a valuable tool. The lesson is to give it constraints that reflect real capacity, correlated failure and the work users actually need to complete. A service is resilient when it can keep delivering useful outcomes while its assumptions are being challenged.

References: see the incident report and the Google SRE chapters in the source notes. Independent educational analysis; not affiliated with Microsoft. Any accompanying architecture illustrations are conceptual.','Microsoft final incident report, 20 Nov 2026 (third-party mirror): https://www.365fanatic.com/wp-content/uploads/2026/11/postincidentreport-mo1550821.pdf
Google SRE, Cascading Failures: https://sre.google/sre-book/addressing-cascading-failures/
Google SRE, Handling Overload: https://sre.google/sre-book/handling-overload/','EP004 SHOT02, SHOT07 and SHOT13: existing conceptual gateway and cascade diagrams. Select readable stills from the approved master; caption as conceptual, not Microsoft topology. Alt text: traffic moves from a failed gateway to increasingly loaded surviving gateways. Rights and image disclosure pending.','Medium — relevant engineering publication to be selected',0),
('d1340000-0000-4000-8000-000000000002','MEDIUM','ARTICLE','Redundancy Isn''t Independence: Designing Failover Around Shared Failure Modes','Draft developed with AI assistance; requires the author''s own technical review and substantive original contribution before publication.

Subtitle: A dependency map can tell you more about availability than a count of replicas.

A service has three deployments in three availability zones. Its architecture review calls that redundant. Now ask a different question: can each deployment continue processing requests if the other two fail in a way that also affects their shared dependencies?

## Model failure domains, not just locations

A location is a useful failure boundary for power, network and physical infrastructure. It is not necessarily a boundary for software, certificates, credentials, configuration or a central control plane. Imagine a hypothetical payment gateway whose three regions all depend on the same authorization database. The data plane may look distributed, but the authorization path remains a common constraint.

Build a map of dependencies alongside the deployment diagram. For each dependency, identify whether its failure affects one instance, a cohort, a region or the whole service. Include the tools used to restore the system: deployment automation, credentials and observability must be available during recovery, not just during a normal working day.

## A testable failover contract

Define a workload envelope for each destination. It should include request mix, concurrency, latency target, dependency latency and capacity reserved for recovery. A destination that is healthy at 50 units of work may not be healthy at 90. A controller needs a budget for additional work, not only a Boolean health state.

Assume two regions each have safe capacity of 100 units and normally serve 65. Losing one leaves a theoretical spare capacity of 35 in the other, while 65 units need a new home. The excess 30 cannot be wished away. A decision to route all 65 turns a local incident into an overload problem.

A more explicit contract caps the transfer at the spare budget. The remaining demand is rejected, deferred or served in a reduced mode according to the product''s correctness requirements. This is not a universal prescription: an operation that needs a transaction cannot be silently converted into a success response.

## Diversity has a cost

One response to shared failure is to diversify implementations or release cohorts. That can reduce some correlations, but separate implementations cost more to validate and operate. They can diverge in subtle semantics. A simpler approach might first isolate traffic budgets, stagger deployments, test old and new builds and preserve a known-good cohort.

Evaluate whether each additional failure domain has a concrete failure it is meant to contain. Then test that claim using representative demand and partial connectivity, rather than counting replicas on a diagram.

## A design exercise

Take a service you know. Draw the user request path, the recovery path and the control path. Mark shared dependencies and identify the first resource that reaches its limit when a cohort disappears. Choose the most important user outcomes and write down what the service is allowed to reject.

Finally, run a controlled exercise in which a destination becomes unavailable and its siblings receive additional work. Measure successful completions and tail latency, not merely how quickly the router moved requests. Stop the experiment if the predefined safety envelope is exceeded.

The test passes only if the intended failure boundary actually protects the work that matters.

Redundancy buys options. Independence determines whether those options are useful during a specific failure. A design review should establish both, with evidence.

References: source notes. The examples are hypothetical; they are not a reconstruction of any company''s private system.','https://sre.google/sre-book/addressing-cascading-failures/
https://sre.google/sre-book/handling-overload/
Incident context: https://www.365fanatic.com/wp-content/uploads/2026/11/postincidentreport-mo1550821.pdf','EP004 SHOT02 and SHOT13 existing diagrams; conceptual caption and alt text: two gateway routes share an underlying failure condition.','Medium — engineering publication or author profile, policy review required',3),
('d1340000-0000-4000-8000-000000000003','HASHNODE','ARTICLE','When Faster Hardware Reveals Hidden Concurrency Bugs','Draft developed with AI assistance; requires the author''s own technical review and substantive original contribution before publication.

More CPU cores increase the number of tasks that can run at once. They do not automatically increase the capacity of a serialized resource.

## A thought experiment

Imagine a Java service with an in-memory registry protected by a single lock. Each request spends most of its time doing independent work, then enters a critical section to update shared state. On a four-core test machine, relatively few request handlers reach that section together. On a much larger machine, more handlers arrive at the lock at the same time.

Suppose the critical section takes 200 microseconds on average. Its ideal upper bound is about 5,000 acquisitions per second before overhead, regardless of how many request threads we create. If 8,000 requests per second need that section, the excess arrivals cannot be completed by adding threads. They wait, time out or are rejected.

Real systems are messier: the duration of a lock hold varies, cache behavior matters, operating system scheduling changes and other threads may require the same resource. More concurrency can increase waiting and lower effective throughput.

## What to measure

Do not rely only on CPU percentage or median latency. Track request completion rate, tail latency, time spent waiting for synchronization, queue depth, allocation rates and memory pressure. A high number of active threads may represent waiting work rather than productive work.

For a Java service, use representative workload tests and appropriate Java Flight Recorder events, thread dumps or application metrics to investigate lock waits. Compare results on different core counts with the same request mix and dependency behavior. Instrument the critical section carefully; the measurement itself should not materially change the contention.

## Test the failure envelope

Start below saturation and increase offered load in controlled increments. Test bursts, connection setup, cache misses and background work alongside the normal path. Include the actual production hardware class and runtime options. Repeat the test while part of the fleet is unavailable so each surviving node receives a higher concurrency level.

A useful benchmark has explicit stop conditions. Record the point at which useful completions stop growing while latency and resource consumption continue increasing. That point matters more to the router than an impressive peak number obtained during a short run.

## Engineering responses

Reduce unnecessary work inside critical sections. Partition state only when the correctness rules allow it. Avoid unbounded waiting and consider limiting concurrent operations before they acquire the shared resource. Verify that timeouts and cancellation actually release the work and resources they are intended to release.

Changing a lock implementation alone is not a substitute for understanding the invariant that it protects. A faster implementation that violates atomicity is not an improvement.

The November 2026 Microsoft 365 incident is a useful reminder that a production hardware configuration can expose a latent issue missed in laboratory testing. The registry example above is a general teaching model, not Microsoft''s code.

The lesson: qualify a service by the work it completes under the conditions it will actually encounter, not by the number of cores available to it.

References and independent analysis: see source notes.','Microsoft incident context: https://www.365fanatic.com/wp-content/uploads/2026/11/postincidentreport-mo1550821.pdf
https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/locks/ReentrantLock.html','EP004 SHOT04; existing conceptual contention diagram. Alt text: many concurrent requests compete for one serialized critical section.','Hashnode — engineering blog',1),
('d1340000-0000-4000-8000-000000000004','HASHNODE','ARTICLE','Healthy Does Not Mean Ready: The Difference Between Liveness and Safe Capacity','Draft developed with AI assistance; requires the author''s own technical review and substantive original contribution before publication.

An application returns HTTP 200 from its health endpoint. Does that mean it should receive another thousand requests per second?

Not necessarily. A health check is a measurement of a particular property. A load balancer that treats every positive response as unlimited capacity is making a much stronger assumption than the check establishes.

## Three different questions

Liveness asks whether a process is still functioning sufficiently to continue rather than be restarted. Readiness asks whether it should receive traffic. Capacity asks how much work it can safely accept. These questions are related but not interchangeable.

Consider a hypothetical Java API that has just started. Its process is running and its HTTP endpoint works. Its database pool is still warming, and its cache is cold. It may be ready for a small test workload, while being unready for its previous traffic share. Treating readiness as a binary signal alone leaves that distinction out.

## Make the admission decision explicit

A service can expose ordinary readiness and still enforce local admission limits. Those limits can be based on measured concurrent work, deadline budget, queue age and observed completions. A router can use a separate capacity signal to decide how quickly to increase traffic.

A simple example: a recovered instance has a limit of 20 concurrent requests for the first stage of a controlled return. If the workload completes within the expected latency and error envelope, the controller increases the limit. If completion rate falls while queue age rises, the controller holds or decreases the limit.

The numbers must come from tests; they are not universal defaults. The key is that each increase is conditional on useful service, not just elapsed time.

## Be careful with probes

A probe that performs expensive dependency calls can add load during an outage. A probe that tests too little can conceal a broken request path. Use different checks for different decisions, avoid coupling every dependency outage to process restarts, and bound the work done by each check.

An overload signal should not necessarily trigger a restart. Restarting a busy process may destroy useful work and create a cold-start penalty. Conversely, retaining a truly stuck process indefinitely is also undesirable. Define the decision thresholds and intended responses separately.

## Test a return to service

Exercise cold starts with clients already waiting. Check whether the routing layer ramps traffic, whether retries are bounded, whether deadlines expire cleanly and whether the instance can reject excess work without losing its ability to serve accepted requests.

Observe useful completions, queue age and tail latency alongside process health. A graph showing every instance as green is insufficient if users are still receiving timeouts.

Readiness is permission to participate. Capacity is the amount of work that can be admitted safely. Designing both makes recovery behavior easier to reason about.

References: Kubernetes probe documentation and Google SRE overload guidance in the source notes. This is an independent conceptual engineering article.','https://kubernetes.io/docs/concepts/configuration/liveness-readiness-startup-probes/
https://sre.google/sre-book/handling-overload/','EP004 SHOT09; existing readiness visualization. Alt text: running service has limited ability to accept new requests.','Hashnode — engineering blog',0),
('d1340000-0000-4000-8000-000000000005','DEV','ARTICLE','Restarting Servers Is Not Recovery: A Practical Guide to Controlled Traffic Admission','This educational draft was created with AI assistance. The author must independently understand, verify and revise the material before sharing it.

When a server starts responding after a restart, it is tempting to restore its full traffic share. But the work waiting outside the server is part of the recovery problem.

## A small hypothetical system

Suppose four application instances normally complete 100 requests per second each. Two become unavailable for a minute. Clients may queue work or retry. When one instance returns, it may face its normal demand plus accumulated demand. If it has cold caches or a slow dependency, it may not be able to handle even its previous steady-state share.

The useful capacity of a restarted process should be measured, not inferred from its process state.

## A recovery policy

First, isolate the failed destination and identify the condition that made it fail. Correct the condition before restoring traffic when possible. Start the recovered instance with bounded admissions, confirm that representative operations complete, then increase the share in measured steps.

A controller should have a way to stop the increase. If queue age or latency rises while completions stagnate, hold the current step or reduce it. A limit without feedback can simply recreate overload at a different time.

For example, consider an illustrative test where traffic increases from 10 to 25 to 50 requests per second. At each step, the test evaluates success rate, p95 latency and queue age against a predefined envelope. If the envelope is exceeded, return to the last stable setting. These values are examples, not production recommendations.

## What about queued work?

Queues can preserve work that does not need an immediate result, but they do not create processing capacity. A queue needs bounded depth, deadlines and a policy for expired items. If request deadlines are shorter than the time spent waiting, serving that work later can waste resources.

For requests with side effects, a client retry must not repeat an operation that already committed. Idempotency keys and correctly scoped deduplication are important. Retry budgets and jitter can reduce pressure from synchronized clients.

## Verify the recovery process

A useful recovery test starts with clients already waiting, not an empty environment. Remove a subset of instances under controlled load, observe the remaining system, bring a repaired instance back and confirm that it can increase admissions without a new collapse.

Measure completions instead of only process count. Record how much traffic was rejected intentionally and whether the remaining work met its latency and correctness requirements.

The outcome is a repeatable runbook: isolate, correct, verify, admit gradually, monitor, and stop the ramp when the evidence requires it.

Restarting changes the state of a process. Recovery restores a service''s ability to perform useful work. Treat those as separate milestones.

References: Google SRE, Addressing Cascading Failures and Handling Overload (source notes).','https://sre.google/sre-book/addressing-cascading-failures/
https://sre.google/sre-book/handling-overload/','Text only; optional original SHOT10 diagram after rights review; no promotional thumbnail.','DEV — standalone educational article, no channel links or promotional purpose',2),
('d1340000-0000-4000-8000-000000000006','LINKEDIN','POST','A healthy backup is not necessarily safe capacity','A failover policy can make every local routing decision correctly and still leave a distributed system less stable.

Consider a fleet where capacity disappears faster than demand. Each remaining destination receives more work. If those destinations share a failure condition, traffic redistribution can activate it again.

The interesting design question is not simply: where do we route the next request?

It is: how much work can the destination safely accept, and what happens to the rest?

Capacity-aware routing, bounded retries and recovery admission control are related parts of that answer.

In your architecture review, do you test recovery under the same demand that caused the failure, or only test whether a backup instance starts?

Draft prepared with AI assistance; author review pending.','https://sre.google/sre-book/addressing-cascading-failures/','Optional existing SHOT07 still; conceptual caption, rights pending.','LinkedIn — optional personal-network amplification',0),
('d1340000-0000-4000-8000-000000000007','LINKEDIN','POST','The production machine is part of the test case','A larger machine can expose a concurrency problem that a smaller test environment never reaches.

More request handlers may compete for the same serialized resource. The hardware has more capacity, but the critical section does not.

That is why I would include hardware class, request mix, connection churn and concurrent demand in a production-representative test plan, rather than relying on a single steady-state throughput number.

A useful signal is the point where successful completions stop increasing while tail latency and resource use keep growing.

What is the most important difference between your test workload and production?

Draft prepared with AI assistance; author review pending.','https://www.365fanatic.com/wp-content/uploads/2026/11/postincidentreport-mo1550821.pdf','Optional original SHOT04 still; rights pending.','LinkedIn — optional amplification',2),
('d1340000-0000-4000-8000-000000000008','YOUTUBE','POST','Architecture question: where would you limit the next request?','Imagine one gateway becomes unavailable and the remaining gateways share the same hidden failure condition.

Which protection would you prioritize first?

A. Capacity-aware routing
B. Regional isolation
C. Controlled traffic admission
D. Production-representative load testing

There is no universal answer without knowing the workload and failure domains. Share the trade-off that matters most in your system.

Draft prepared with AI assistance; author review pending.','https://sre.google/sre-book/handling-overload/','Original SHOT13 diagram only if cleared.','YouTube Community — verify eligibility',1),
('d1340000-0000-4000-8000-000000000009','INFOQ','RESEARCH','Capacity-aware failover: human author research dossier','Research notes for human author, not submission prose. Develop a distinct practical design and an experiment from your own engineering experience. Investigate admission budgets, failure domains and retry amplification. Collect real measurements only if available, label hypothetical examples, verify originality and exclusivity, check quarterly proposal limit and disclose assistance. Do not send AI-written sections. No editor contacted.','https://sre.google/sre-book/addressing-cascading-failures/
https://sre.google/sre-book/handling-overload/
https://www.infoq.com/guidelines/','SHOT07/13 references only; no image submitted.','InfoQ — editorial acceptance required',7),
('d1340000-0000-4000-8000-000000000010','DZONE','RESEARCH','Production concurrency testing: human author research dossier','Human author research: compare safe throughput and lock contention on representative hardware. Define reproducible test methodology, runtime and workload assumptions. Use original practitioner evidence and avoid inventing benchmark results. Check current submission and AI policies. No editor contacted.','https://www.365fanatic.com/wp-content/uploads/2026/11/postincidentreport-mo1550821.pdf
https://dzone.com/articles/dzones-article-submission-guidelines','SHOT04 reference only; rights pending.','DZone — editorial acceptance required',7),
('d1340000-0000-4000-8000-000000000011','REDDIT','RESEARCH','Find a relevant existing discussion on recovery admission','Research opportunity only. Search existing relevant engineering discussions about retry storms and overload recovery. Verify actual thread, subreddit rules, author eligibility and whether external links are welcome. Participate in your own words where genuinely useful. Do not post a promotional thread or generated comment. No discussion has been located or contacted.','https://support.reddithelp.com/hc/en-us/articles/360043504051-Spam','No assets attached.','Exact subreddit/thread not selected',1),
('d1340000-0000-4000-8000-000000000012','HN','RESEARCH','Monitor genuine discussion of incident reports and failure isolation','Human-only research notes. Read relevant existing discussions and original source material. No generated submission or comment text, no automated posting, no vote requests. No actual thread is claimed.','https://news.ycombinator.com/newsguidelines.html
https://sre.google/sre-book/addressing-cascading-failures/','No assets.','Hacker News — no thread selected',2)
) v(item_id,platform,kind,title,body,sources,assets,destination,launch_day)
where p.id='d11d02a2-b649-44c9-a022-4405149f675e' and p.episode_key='EP004' and f.film_id='040d0fd7-ebb3-3b99-838a-005bc23122cd' and f.sha256='d93801a75e6cd3d691c3e764cb8874e66bb8ef8d4acf178d8e16e920304dfd9c';
