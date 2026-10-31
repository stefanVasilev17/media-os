# EP002 — SHOT 11 v1.1 — Director Creative LOCK

**Director approval:** 2026-10-31 (explicit instruction in conversation: “LOCK EP002 SHOT 11 v1.1 — одобрявам точния английски narration и визуалния план без промени.”)

**Status:** `SHOT11_V1_1_DIRECTOR_SCRIPT_AND_VISUAL_PLAN_LOCKED` — exact approved English narration and agreed storyboard logic below. This is **creative approval recorded in GitHub**, not an assertion of MediaOS database-stage LOCK, generated ElevenLabs audio, rendered Remotion video, or full-episode technical QA.

**Episode:** Architectural Thinking — EP002  
**Working title:** Why Login Fails Even When the Server Is Healthy  
**Source:** Director-supplied `EP002 FULL SCRIPT PASS v4.0` dated 2026-10-30; SHOT 11 v1.1 had been DIRECTOR REVIEW / UNLOCKED prior to approval.  
**Editorial window:** `12:40–13:30` — working time only; exact voice-word alignment not yet performed.  
**Protected previous locks:** SHOTS 01–10 Director-LOCKED verbatim; absolutely no narration, visual contract, scene, EP001 render or audio changes.

## English narration — DIRECTOR-LOCKED, VERBATIM

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

## Approved Living Architecture Map choreography — no changes

| Editorial window | Director-approved camera and visual behavior | Spoken trigger |
|---|---|---|
| 12:40–12:57 | Wide shot of Phone → Gateway → Load Balancer → Auth → shared User Database. Replay the load wave as a short, semi-transparent ghost overlay: delayed DB lookups, full Auth pools, growing waits, deadlines. No new server crash is implied. | “full Login journey” → wide path; “lookups slowed” → DB; “deadlines expired” → Phone. |
| 12:57–13:06 | Contrast the still-running Auth services with several pending/failed user Login requests, while some completed packets continue to travel. Keep labels sparse. | “servers were still running” and “failing for many users” → side-by-side contrast. |
| 13:06–13:19 | Demonstrate *bounded* retry attempts, early admission refusal, and protected first-attempt connection capacity by reusing the exact SHOT 09 visual motifs. Traffic pressure may ease; do **not** imply complete recovery or increased DB throughput. | “limiting retries” → retry gate; “rejecting … early” → admission boundary; “protecting connections” → bulkhead limit. |
| 13:19–13:30 | Return to the full persistent architecture and Phone. Show `ALIVE ≠ AVAILABLE` briefly, then focus on the shared User Database when the narrator asks about capacity. End on an unanswered question; **do not reveal primary/replica diagrams, terms or assets**. | “healthy server” → core thesis; “database … more capacity” → camera focus / cut to black. |

## Source-preserving visual truth guards

- System protection is conditional; no claim that database throughput increases or that all Login requests fully recover.
- Distinguish healthy configured liveness/readiness probes from full user journey availability.
- The original Phone request times out in SHOT 06. SHOT 11 is a recap, not a new request chronology.
- Do not introduce primary/replica topology, replication lag, database consistency, routing theory, or unapproved future-episode concepts.
- End on the unanswered capacity question. Future episode order or title is **not** locked here.
- No changed numbers, timing promises, scripts, voice files, EP001 protected assets, production database records, or render outputs.
- **Term → immediate plain-English meaning → visible proof** is the mandatory teaching rule; preserve prior locked passages unchanged.
- Real duration and motion keyframes require ElevenLabs cloned-voice word alignment before Remotion shot production.

## Next creative gate

With this approval, **all eleven individual EP002 shots now have Director creative locks** (01–10 from v4.0 history, 11 from the explicit 2026-10-31 decision). A **separate full-episode script assembly/Director final LOCK** and its exact audio timing remain separate gates. See the EP002 complete narration assembly created alongside this record; do not claim MediaOS production stage has been locked automatically.
