-- Additive, metadata-only publishing revisions. No updates to locked media or scripts.
create table episode_publishing_revision (
    package_id uuid not null references episode_package_import(id),
    field_key varchar(40) not null,
    revision integer not null check (revision between 1 and 50),
    field_value text not null check (octet_length(field_value) <= 262144),
    state varchar(12) not null check (state in ('DRAFT','APPROVED','PENDING','PASS','FAIL')),
    origin varchar(120) not null,
    master_sha256 varchar(64),
    object_key varchar(240),
    object_sha256 varchar(64),
    object_bytes integer,
    object_type varchar(32),
    recorded_at timestamptz not null default now(),
    primary key(package_id,field_key,revision),
    check (master_sha256 is null or master_sha256 ~ '^[a-f0-9]{64}$'),
    check ((object_key is null and object_sha256 is null and object_bytes is null and object_type is null)
      or (field_key='THUMBNAIL_ASSET' and object_key is not null and object_sha256 ~ '^[a-f0-9]{64}$'
        and object_bytes between 1 and 2097152 and object_type in ('image/png','image/jpeg')))
);
-- Director-approved editorial metadata, not authenticated release or automated QA.
-- Seed ONLY the verified EP004 master/package, never any unrelated episode.
insert into episode_publishing_revision(package_id,field_key,revision,field_value,state,origin,master_sha256)
select p.id,v.field_key,1,v.field_value,v.state,'DIRECTOR_CHAT_2026_11_27',f.sha256
from episode_package_import p join episode_director_film f on f.package_id=p.id
cross join (values
('TITLE','Why Microsoft 365 Went Down — And Why Failover Made It Worse','APPROVED'),
('THUMBNAIL_DESIGN','THE FAILOVER TRAP
Approved composition: channel wordmark upper left, Microsoft 365 topic and headline below, server cascade on the right.
Approved image: microsoft_365_failover_trap.png; SHA-256 28654ed2519d21311f060c38d4b355fd3cbd73ee6b0aa317c5325e845964de15. Original PNG not yet archived in private object storage. Microsoft logo rights review pending.','APPROVED'),
('DESCRIPTION','Failover is designed to keep distributed systems available. So why did it help spread the failure during the November 2026 Microsoft 365 outage?

In this Architectural Thinking episode, we explore how a hidden software defect, reduced gateway capacity, and shifting production traffic combined to create a cascading failure that disrupted Exchange Online and dependent Microsoft 365 services.

Through original animated architecture diagrams, we follow the failure from its initial conditions to its propagation across the infrastructure — and examine why restarting servers was not enough to restore a stable service.

What you will learn:
- How automatic failover can amplify cascading failures.
- Why healthy endpoints do not always represent safe production capacity.
- How lock contention can exhaust CPU and memory resources.
- Why production hardware can expose defects that load testing misses.
- How traffic redistribution changes the behaviour of distributed systems.
- Why recovery requires more than restarting failed infrastructure.
- How capacity management, failure isolation and controlled traffic admission improve system resilience.

This is not just a Microsoft 365 incident breakdown. It is a case study in distributed systems, cloud reliability, and the difference between local recovery decisions and global system stability.

Who is this video for?
Software Engineers, Software Architects, Site Reliability Engineers, Platform Engineers, DevOps Engineers, Engineering Managers, and anyone designing or operating production systems.

About Architectural Thinking
Architectural Thinking explores how real-world technology systems work, why they fail, and what engineers can learn from their architecture.
We go beyond code to understand the decisions, dependencies, trade-offs, and failure modes behind modern software systems.
Subscribe for more visual deep dives into distributed systems, cloud infrastructure, software architecture, and engineering reliability.','APPROVED'),
('CHAPTERS','00:00 The Microsoft 365 Outage
01:07 How Failover Is Supposed to Work
02:18 Two Gateways, One Shared Pressure
03:32 The Hidden Bug: Lock Contention
05:05 The Missing 14% of Server Capacity
06:31 When Traffic Redistribution Becomes Dangerous
07:50 The Cascading Failure
09:17 Why the Failure Spread Across Regions
10:48 Healthy Does Not Mean Ready
12:10 The Server Restart Trap
13:18 Reconstructing the Incident Timeline
14:46 How Microsoft Restored Service
16:13 Designing Resilient Distributed Systems
17:23 The Architecture Paradox
18:30 Designing for Uncertainty','APPROVED'),
('TAGS','Microsoft 365 outage, Microsoft 365 outage 2026, Exchange Online outage, Microsoft outage explained, distributed systems, system design, software architecture, cloud architecture, cascading failure, failover, high availability, site reliability engineering, SRE, load balancing, lock contention, fault tolerance, disaster recovery, cloud infrastructure, platform engineering, incident analysis, system resilience, architectural thinking','APPROVED'),
('HASHTAGS','#SystemDesign #DistributedSystems #CloudArchitecture','APPROVED'),
('SOURCES','- Microsoft preliminary PIR, 2026-11-15, EX1550543 / MO1550821, external mirror https://www.365fanatic.com/wp-content/uploads/2026/11/PostIncidentReport.pdf
- Microsoft final PIR, 2026-11-20, EX1550543 / MO1550821, external mirror https://www.365fanatic.com/wp-content/uploads/2026/11/postincidentreport-mo1550821.pdf
- Microsoft Service Health updates, University of Pennsylvania mirror https://mailservices.isc.upenn.edu/computing/email/penno365/alerts/ms-incidents.html
- Supplemental Google SRE engineering reading (not incident evidence): https://sre.google/sre-book/addressing-cascading-failures/ and https://sre.google/sre-book/handling-overload/','APPROVED'),
('DISCLAIMER','Architectural Thinking is an independent educational channel and is not affiliated with, sponsored by, or endorsed by Microsoft.
This video presents original educational analysis based on documented incident reports and established engineering principles.
All architecture diagrams and animations are conceptual illustrations created to explain system behaviour. They do not represent Microsoft''s exact internal infrastructure.
Microsoft and Microsoft 365 are trademarks of their respective owner.','APPROVED'),
('PINNED_COMMENT','substantive architecture trade-off question, encourage practitioners to explain alternatives and experience; no generic engagement bait.
- Upload defaults: Science & Technology, English, not made for kids, no age restriction where appropriate, Standard YouTube License, embedding/comments enabled, manual chapters, no invented location, relevant playlist, private until QA, monetization if eligible; evaluate actual AI disclosure requirements per episode (own voice clone alone is not blanket exemption for other synthetic content). Director approves public release.
- Record conclusion and lessons in PROJECT_STATE and a durable episode review; always revisit this document and prior lessons before starting the next video. Mandatory review record: episode/master SHA, gate results/evidence, strengths, issues, source changes, decisions, reusable rules, exceptions, unresolved blockers, next action, Director approval. No new UI automation implied by documentation.

## EP004 — Director-approved Publishing Package V1
Title LOCKED: Why Microsoft 365 Went Down — And Why Failover Made It Worse
Thumbnail design LOCKED: THE FAILOVER TRAP, Microsoft 365 topic/logo, approved top-left channel wordmark and lowered topic/headline composition. Actual approved image not stored by this docs change; verify its exact version and logo permission before release.
Visual master V2: 040d0fd7-ebb3-3b99-838a-005bc23122cd, SHA-256 d93801a75e6cd3d691c3e764cb8874e66bb8ef8d4acf178d8e16e920304dfd9c, 34651 frames at 30fps (19:15.033), 426244590 bytes. Railway 2026-11-26 21:50:51 UTC REPAIR_READY; originalAudio=true originalLocks=true; QA footerAfter=0 inheritedAfter=0 oldLabelAfter=0 relocatedLabelMinCoverage=1.0. Director accepted visual result in chat; formal DB master lock not verified. Voice-only direction approved; actual final audio QA pending.
Description (approved):
Failover is designed to keep distributed systems available. So why did it help spread the failure during the November 2026 Microsoft 365 outage?

In this Architectural Thinking episode, we explore how a hidden software defect, reduced gateway capacity, and shifting production traffic combined to create a cascading failure that disrupted Exchange Online and dependent Microsoft 365 services.

Through original animated architecture diagrams, we follow the failure from its initial conditions to its propagation across the infrastructure — and examine why restarting servers was not enough to restore a stable service.

What you will learn:
- How automatic failover can amplify cascading failures.
- Why healthy endpoints do not always represent safe production capacity.
- How lock contention can exhaust CPU and memory resources.
- Why production hardware can expose defects that load testing misses.
- How traffic redistribution changes the behaviour of distributed systems.
- Why recovery requires more than restarting failed infrastructure.
- How capacity management, failure isolation and controlled traffic admission improve system resilience.

This is not just a Microsoft 365 incident breakdown. It is a case study in distributed systems, cloud reliability, and the difference between local recovery decisions and global system stability.

Who is this video for?
Software Engineers, Software Architects, Site Reliability Engineers, Platform Engineers, DevOps Engineers, Engineering Managers, and anyone designing or operating production systems.

About Architectural Thinking
Architectural Thinking explores how real-world technology systems work, why they fail, and what engineers can learn from their architecture.
We go beyond code to understand the decisions, dependencies, trade-offs, and failure modes behind modern software systems.
Subscribe for more visual deep dives into distributed systems, cloud infrastructure, software architecture, and engineering reliability.

Chapters (computed from actual frame counts, ceil cumulative frames/30; private upload playback check pending):
00:00 The Microsoft 365 Outage
01:07 How Failover Is Supposed to Work
02:18 Two Gateways, One Shared Pressure
03:32 The Hidden Bug: Lock Contention
05:05 The Missing 14% of Server Capacity
06:31 When Traffic Redistribution Becomes Dangerous
07:50 The Cascading Failure
09:17 Why the Failure Spread Across Regions
10:48 Healthy Does Not Mean Ready
12:10 The Server Restart Trap
13:18 Reconstructing the Incident Timeline
14:46 How Microsoft Restored Service
16:13 Designing Resilient Distributed Systems
17:23 The Architecture Paradox
18:30 Designing for Uncertainty

Tags: Microsoft 365 outage, Microsoft 365 outage 2026, Exchange Online outage, Microsoft outage explained, distributed systems, system design, software architecture, cloud architecture, cascading failure, failover, high availability, site reliability engineering, SRE, load balancing, lock contention, fault tolerance, disaster recovery, cloud infrastructure, platform engineering, incident analysis, system resilience, architectural thinking
Hashtags: #SystemDesign #DistributedSystems #CloudArchitecture
Playlist: Distributed Systems & Cloud Architecture.

Sources approved for package, reverify before release:
- Microsoft preliminary PIR, 2026-11-15, EX1550543 / MO1550821, external mirror https://www.365fanatic.com/wp-content/uploads/2026/11/PostIncidentReport.pdf
- Microsoft final PIR, 2026-11-20, EX1550543 / MO1550821, external mirror https://www.365fanatic.com/wp-content/uploads/2026/11/postincidentreport-mo1550821.pdf
- Microsoft Service Health updates, University of Pennsylvania mirror https://mailservices.isc.upenn.edu/computing/email/penno365/alerts/ms-incidents.html
- Supplemental Google SRE engineering reading (not incident evidence): https://sre.google/sre-book/addressing-cascading-failures/ and https://sre.google/sre-book/handling-overload/

Editorial disclaimer:
Architectural Thinking is an independent educational channel and is not affiliated with, sponsored by, or endorsed by Microsoft.
This video presents original educational analysis based on documented incident reports and established engineering principles.
All architecture diagrams and animations are conceptual illustrations created to explain system behaviour. They do not represent Microsoft''s exact internal infrastructure.
Microsoft and Microsoft 365 are trademarks of their respective owner.

Pinned comment:
Imagine you are responsible for designing the next generation of this gateway architecture.
You have automatic failover, multiple regions, redundant infrastructure, and healthy backup servers. But every surviving endpoint is potentially vulnerable to the same hidden software defect.
Which architectural protection would you prioritise?
A — Capacity-aware traffic routing
B — Stronger regional failure isolation
C — Controlled traffic admission and gradual recovery
D — Production-representative load testing
Would you combine all four, or approach the problem differently?
I''m particularly interested in hearing from engineers who have dealt with cascading failures in real production systems.
Let''s discuss the architecture, not just the outage.','APPROVED'),
('UPLOAD_SETTINGS','Category: Science & Technology
Video language: English (United States)
Title and description: English
Audience: Not made for kids
Age restriction: No (subject to content)
License: Standard YouTube License
Embedding: Yes
Comments: Enabled
Automatic chapters: Off
Location: Not specified
Playlist: Distributed Systems & Cloud Architecture
AI disclosure: No for the described voice-only/conceptual process; recheck actual content
Visibility: Private until QA
Monetization: On if eligible','APPROVED'),
('TRANSCRIPT','On November twelfth, twenty twenty-six, millions of people depended on Microsoft 365 to do something ordinary: open an inbox, read a message, or send an important reply. For many, Outlook could not reach their mailbox. Some messages were delayed. Parts of other Microsoft 365 services were affected too, even when their main features still worked. From the outside, it looked like a cloud service had simply gone down.

But behind that familiar error was a much stranger chain of events. Microsoft had systems designed to move traffic away from trouble. That is normally how a large cloud platform stays available. Yet during this incident, moving work toward the remaining servers helped spread the failure. A server could come back online, receive traffic, and become unresponsive again.

The central question is not just why Microsoft 365 stopped working. It is this: how can the very mechanism meant to rescue a system become part of the failure?

Imagine a service with several servers that can handle the same kind of request. Under normal conditions, a traffic router spreads the work between them. If one server stops responding, the router can stop choosing that server and send new requests toward another destination. The user may notice little or nothing. We call that failover: using an alternative path or destination when the original one cannot do its job.

This is not a bad idea. It is one of the foundations of reliable cloud systems. Hardware fails. Software fails. Networks fail. A design that depends on every server staying healthy forever will eventually disappoint its users.

But failover quietly makes an assumption. The place receiving the extra work must be able to handle it. More importantly, it must not be vulnerable to the same condition that harmed the first destination. If that assumption is wrong, the backup route may be available on paper, while the system behind it is already close to its limit.

And that is where this story begins.

Microsoft''s preliminary incident report describes two separate networking gateway systems. They were built differently, so workloads could move between them during disruptions. Think of a gateway as the infrastructure that accepts connections and helps users reach the service behind it. These gateways are not the email inboxes themselves. They are part of the route people must cross to reach their inboxes.

Exchange Online depended on a gateway that Microsoft called the primary gateway. Teams could also use the alternative networking system. Early on November twelfth, roughly fifteen hours before the broader outage, an automated failover moved Teams traffic from that alternative system onto the primary gateway supporting Exchange.

Nothing about that move proves a design mistake. Failover was a normal part of operating the platform. But the destination now had a different mix of work arriving at its doors. The same gateway infrastructure was supporting additional demand from another major product. To understand why that mattered, we need to travel backward in time, to a change that had seemed harmless for months.

Back in July, Microsoft began deploying a change prepared specifically for its Microsoft 365 networking gateway servers. The change spread across the fleet over several weeks. For more than three months, no visible incident exposed the problem hidden inside it. This was not a general Windows update affecting every Windows computer. The defect was specific to the gateway environment described in Microsoft''s report.

Under certain load conditions, an internal Windows process could suffer from something called lock contention. In simple terms, several pieces of work need access to a shared resource, but they cannot all use it at once. More and more work begins waiting. The machine spends resources managing that pressure instead of completing useful requests. In this case, the contention could exhaust CPU and memory and leave gateway servers unresponsive.

Now comes an unusual detail. Microsoft said its normal load testing did not catch the defect partly because the test machines were less powerful than the production machines, and the traffic mix was different. The contention became worse on newer hardware with more CPU cores.

More powerful hardware did not automatically mean a safer test. The production environment could expose a failure that the smaller laboratory environment did not.

The hidden software defect was only one part of the problem. A second condition was already present. According to Microsoft''s preliminary report, nearly fourteen percent of the primary gateway''s server capacity was out of service because of an unrelated issue from the previous day. This did not, by itself, cause the outage. Microsoft said the gateway had enough spare capacity to tolerate that reduction under its earlier conditions.

Think of capacity as breathing room. A busy gateway might still have enough free resources to deal with the work it normally receives. Remove some servers, and that breathing room becomes smaller. The service can still look healthy. It can still answer requests. A dashboard can still show that the platform is available.

Then change the work arriving at the gateway. Teams traffic has moved onto it, changing both load and traffic patterns. More work is now competing for fewer available resources. During the peak U.S. traffic window, those conditions made it much more likely that the hidden contention bug would appear.

The important point is that neither the missing capacity nor the earlier traffic shift needed to break the service alone. Their combination exposed the defect waiting underneath.

At first, the extra traffic does not have to create a dramatic failure. The gateway can continue serving many requests while internal pressure grows. But some kinds of faults are not smooth. The system may handle one level of concurrency and then behave very differently after a hidden boundary is crossed.

Imagine connections arriving slightly faster than the affected process can finish setting them up. Some requests complete. Others wait. As waiting grows, more machine resources are tied up. That can slow connection handling further. The system spends more time under pressure, which gives the contention problem more chances to appear. Soon the gateway is no longer just busy. Some of its servers stop answering.

This is why a traffic graph alone can mislead an incident team. The total number of people using a service might not have increased dramatically. Yet fewer working destinations, combined with a different traffic mix, can create a much larger load on each surviving endpoint.

The danger was not simply that the cloud had too much traffic. The danger was where that traffic went, and what it triggered when it arrived.

When a gateway stopped responding, Microsoft''s traffic management systems redirected users toward endpoints that still appeared healthy. Usually that protects customers. This time, the surviving endpoints could encounter the same hidden defect under additional load. Each unresponsive server left fewer destinations to carry the same work. The pressure began moving through the fleet.

Microsoft''s preliminary report says the cascading failure made more than eighty percent of the affected gateway servers unresponsive at the worst point, in less than two hours. To see why a normal rescue mechanism can accelerate that kind of failure, follow one request.

A backup server is not automatically a rescue. Imagine one gateway stops answering requests. The traffic router does its job and sends those requests to another healthy gateway. But the second gateway has the same hidden weakness, and now it receives even more traffic. It begins to fail too. The router moves the workload again, making the surviving servers carry even more pressure. Nothing has to be wrong with the decision to reroute each request. The disaster is that every local rescue decision makes the shared system less stable. Failover can protect a service, or it can spread the failure.

Large platforms do not normally place all their capacity into one giant shared pool without boundaries. They divide infrastructure into regions and smaller partitions, so that a problem in one area does not automatically overwhelm every other area. Engineers sometimes call this a bulkhead, borrowing the idea from a ship: one damaged compartment should not flood the whole vessel.

Microsoft said its gateway infrastructure was divided into many capacity units, organized into regions. In this event, a separate issue prevented the normal boundaries between partitions from containing the cascading failures. That allowed the impact to spread much more widely than a local capacity problem should have.

Not every Microsoft 365 workload experienced the same failure. Some services, including Teams, OneDrive, SharePoint and Office applications, could move away from the affected gateway infrastructure, so parts of their experience recovered earlier. Exchange Online could not make that same move at the required scale. That distinction matters. A shared infrastructure problem can affect many products, but its impact depends on which capabilities actually depend on the failed path.

The user does not see those dependency boundaries. They see an inbox that will not open, even while another feature may still work.

Now imagine watching one of the affected gateway servers during recovery. It was unresponsive. Engineers restart it. The process begins running again. The machine appears alive. Maybe it even answers a simple check. Should the router immediately send a large amount of waiting traffic back to it?

That question separates two ideas that often get mixed together. A basic health check can tell us whether a process is alive or can answer a small request. But a service being alive does not prove that it is ready to carry a full production workload. Readiness under real traffic is a different question.

Microsoft''s incident updates described efforts to change health-check behavior and to return affected servers to service. But the deeper problem was not solved by a green status alone. Under the wrong load, the same contention could return.

A recovery system must therefore ask more than, “Is this machine running?” It must also ask, “Can this machine keep doing useful work when we reconnect users?”

A green endpoint is helpful information. It is not a guarantee of spare capacity, safe concurrency, or successful end-to-end service.

The hardest part of an outage can arrive during recovery. Engineers restart a gateway server, and it begins responding again. But waiting connections have not disappeared. Microsoft reported that recovered servers could become unresponsive as soon as traffic returned. Its normal automated recovery was not designed for so much of the gateway fleet to be unresponsive at once.

Restarting a server is not the same as recovering a service. A restart may clear the current bad state, but it does not erase the requests waiting outside. Imagine a gateway comes back online and the router immediately sends it all the traffic it missed. The same hidden software problem appears under the returning load. The gateway stops responding again. Now the system has to recover twice. That is why large-scale recovery often needs controlled traffic admission, not just more restarts. The goal is not to make the server start. The goal is to keep it serving real users.

The incident timeline makes the feedback loop easier to see. At 1:07 in the morning, UTC, Teams traffic moved onto the gateway supporting Exchange. Throughout the day, load gradually increased and isolated servers began to fail. By 4:03 in the afternoon, Microsoft detected growing connectivity anomalies. At 4:17, automated redirection moved traffic toward alternative healthy endpoints. At 4:20, the company recorded the high-priority Exchange Online impact alert.

Recovery teams tried several methods during the evening. They redistributed traffic, restarted parts of the infrastructure, and investigated health-check and connection-handling problems. At 7:20 that evening, Microsoft had determined that the elevated pressure was not simply a rise in total traffic. Too many servers had become unavailable, so the remaining ones were carrying more work. Near midnight, servers that initially recovered were seen becoming unresponsive again after traffic arrived.

That is the important pattern. The original trigger matters, but the recovery system is now interacting with the same feedback loop. The team is no longer only fixing a software defect. It is also trying to stop the platform from repeatedly recreating the conditions that expose that defect.

A turning point came when Microsoft identified the defective connection-handling path and developed an update that returned it to an earlier known-good state. Engineers applied the change to groups of servers, restarted them, and brought them back carefully. They also used traffic controls, additional capacity, and changes to distribution so recovered infrastructure was not immediately overwhelmed.

This matters because recovery had two jobs. First, remove or avoid the software behavior that could make a gateway stop responding. Second, control the workload the gateway would receive while capacity returned. Fixing the code without managing traffic could leave the system struggling through a crowded recovery. Managing traffic without addressing the defect would only reduce the chance of triggering it.

By the morning of November thirteenth, portions of the gateway infrastructure were becoming stable. Recovery progressed region by region. At 16:10 UTC, Microsoft said active customer impact had ended, although monitoring and delayed-message processing continued afterward.

For a user, this eventually became ordinary again: an inbox opens, a message appears, a reply can be sent. But the architecture lesson is not contained in that final green status.

Should engineers stop using failover? No. The solution is to design it for the whole system, including shared failure modes and real spare capacity. The following principles are general architecture lessons, not claims about undocumented Microsoft internals. Listen to what a recovery system actually needs to guarantee.

A system can be highly available on paper and still fail during recovery. You have healthy servers, automatic failover, and several regions. Each part sounds reliable. But if every surviving server shares the same hidden weakness, moving traffic only spreads the pressure. And if your recovery starts every server at full demand, the failure can repeat. Real resilience needs more than backup routes. It needs safe capacity, failure isolation, and a controlled way to return traffic. Availability is not the number of servers you own. It is the amount of useful work the system can still complete when things go wrong.

Look again at what happened. A July change sat inside gateway software for months without an obvious problem. Another gateway handed Teams traffic to the system supporting Exchange. Part of that destination''s capacity was temporarily unavailable. Under peak traffic, the combined load exposed a lock-contention defect that could make servers unresponsive.

Traffic management then did what it was built to do: find other destinations. But those destinations could encounter the same weakness. Each lost endpoint increased the pressure on the remaining fleet. Even when engineers restarted servers, waiting traffic could drive them back into trouble. Recovery required treating the code defect and the traffic pressure together.

This is the paradox behind the outage. A recovery mechanism can be correct for one failing server and still be dangerous for the system as a whole. A local success does not always create global stability. Sometimes it creates the next problem. The real architecture exists in the relationships between those decisions.

For the person waiting on an email, none of these terms mattered. What mattered was whether the message could arrive when it was needed. But behind that small moment was a system of gateways, shared capacity, hidden software behavior, and recovery decisions.

The lesson reaches beyond Microsoft 365. Every distributed system eventually has to answer the same difficult question: when one part fails, will moving its work protect the rest, or make the next failure more likely?

That is not just a question about failover. It is a question about how we design for uncertainty.','DRAFT'),
('SUBTITLES_SRT','','DRAFT'),
('AUDIO_DIRECTION','Voice-only narration. No music or SFX. Master only if required after actual audio inspection.','APPROVED'),
('QA_MASTER','Corrected master READY, Railway 2026-11-26 21:50:51 UTC; 34651 frames, 15 original locks, original audio unchanged. Director visual acceptance in chat. Formal master DB lock and complete playback QA not recorded.','PENDING'),
('QA_AUDIO','Actual loudness, true peak, clipping, intelligibility and A/V sync review pending.','PENDING'),
('QA_EDITORIAL','Compare final Microsoft PIR with SHOT05/07/08; verify actual sources and material claims before release.','PENDING'),
('QA_RIGHTS','Microsoft logo and source material rights review pending.','PENDING'),
('QA_CAPTIONS','Verify word-level SRT against actual approved narration and private playback.','PENDING'),
('QA_UPLOAD','Private upload and final playback, chapters, metadata and captions review pending.','PENDING'),
('QA_RELEASE','Director explicit final public release authorization pending; this Studio never publishes externally.','PENDING')
) v(field_key,field_value,state)
where p.id='d11d02a2-b649-44c9-a022-4405149f675e' and p.episode_key='EP004'
and f.film_id='040d0fd7-ebb3-3b99-838a-005bc23122cd'
and f.sha256='d93801a75e6cd3d691c3e764cb8874e66bb8ef8d4acf178d8e16e920304dfd9c'
on conflict do nothing;
