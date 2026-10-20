# EP001 — SHOT 06 / Load Balancer — DIRECTOR-LOCKED voice script v3

**Director approval:** 2026-10-20, explicit approval of `The Server That Stops Responding`.
**Status:** **VOICE SCRIPT LOCKED**; visual SHOT 06 is not yet LOCKED; recording/voice approval pending.
**Episode script revision:** 3 remains LOCKED and untouched. SHOT 01–05 voice and visual locks must remain untouched.
**Import format:** `mediaos.shot06-director-voice.v1`, scoped importer `/api/v1/voice-clips/shot06/director-voice-import`.
**Source hash of 7 approved spoken texts:** `b5d1d4882ddb9a1784f521c0b323d7b1602ec6241f079fd60562652a269dd82b`.
**Title:** The Server That Stops Responding.
**Narration length:** 371 words, seven clips. Estimated working storyboard ~174 seconds; actual approved voice timings are authoritative. Do not synthesize audio or alter the script on import.

## Immutable seven-clip approved text

### C01 — Arrival: Three Servers. One Request.
Voice: Curious, controlled suspense.

The API Gateway has cleared our request. But look ahead. There isn't just one login server waiting for us.

There are three running copies of Auth Service. A, B, and C.

And now the system faces a new question.

Which one should receive our login?

### C02 — Traffic Distribution: The Hidden Decision
Voice: Confident, explanatory.

That's the Load Balancer's job.

One incoming request. Three possible destinations.

Send everything to the same server, and it can become a bottleneck while the others sit idle.

The Load Balancer uses configured traffic distribution rules to decide where requests should go.

### C03 — Route Mode: Watch the Pattern
Voice: Engaging, with a small revelation.

Here's one possible rule: Round Robin.

Watch three separate example requests.

The first goes to Instance A. The second goes to B. And the third goes to C.

Instead of overwhelming one destination, the Load Balancer rotates through the eligible instances.

But distributing traffic isn't always that simple.

### C04 — Hash Key: When Consistency Matters
Voice: Thoughtful, slightly intriguing.

Sometimes, related requests should reach the same server.

That's where a Hash Key can help.

With this routing rule configured, two example requests carrying the same stable key both reach Instance B.

Same key. Same destination.

But that consistency depends on the routing configuration and the available server pool.

And availability is about to become a problem.

### C05 — Health Checks: The Server That Goes Silent
Voice: Tension builds, then a decisive explanation.

Watch Instance C.

The Load Balancer sends a health probe.

No response.

Another probe times out.

After the configured failure threshold is reached, something important happens.

Instance C is marked unhealthy.

Its route disappears from the eligible pool.

The server may still exist. But the Load Balancer will no longer send new requests to it while it remains unhealthy.

Three possible destinations have become two.

### C06 — Target Choice: The Decision
Voice: Resolution, confident and precise.

Now return to our original green login request.

It's been waiting at the entrance this entire time.

Instance C is out. A and B are still healthy.

Under this system's routing rule, the Load Balancer selects Instance B, running in Zone B.

One request. One eligible destination. One chosen path.

And now our request finally moves.

### C07 — Handoff: The Next Question
Voice: Calm conclusion, followed by renewed curiosity.

Our request has reached Auth Service.

But notice what the Load Balancer didn't do.

It never checked the password. It never decided whether this login should succeed.

It only chose which healthy server would receive the request.

Now comes the real question.

Can that server actually trust the credentials?

## Director requirements for the accompanying visuals

Use original Living Architecture Map. Navigation remains visible while only the center demonstrates one concept at a time. Keep diagnostic blue requests distinct from one canonical green Login Request, which waits at the balancer ingress until after health eligibility and target selection. Illustrate actual two-probe timeout sequence, then show C removed from eligible pool while A and B stay healthy. Show green request flowing to selected B, then handoff into original Auth Service map. No pointless small fonts, labels, footnotes, generic templates or premature success verdict. Voice is recorded/approved in seven separate files before final per-clip timeline alignment. **SHOT 06 not visually LOCKED until Director approves the synced master.**
