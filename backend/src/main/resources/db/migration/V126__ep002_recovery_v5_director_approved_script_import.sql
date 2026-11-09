-- Director-approved EP002 recovery v5 source import; preserves all prior takes/revisions.
-- Migration provenance is explicitly SYSTEM_SOURCE_IMPORT, never a fabricated Director identity.
-- No TTS, CPU or external operations. A fresh revision invalidates old chosen Takes.

INSERT INTO ep002_creative_script_revision
    (id,shot_key,revision,narration,voice_direction,actor_issuer,actor_subject)
SELECT gen_random_uuid(),'SHOT08',
       COALESCE((SELECT MAX(revision) FROM ep002_creative_script_revision
                 WHERE shot_key='SHOT08'),0)+1,
       $recoveryv5$After that retry storm, the database is overloaded. But some of its work is coming from our own repeated attempts.

We still have three Auth servers and one User Database. More Auth servers would not remove this limit. So we control retries first.

Watch Auth 01. A lookup times out. Before trying again, Auth checks the Login deadline. If no useful time remains, it stops.

We also add a retry budget: only a small share of active Logins may retry a safe, read-only lookup. When that budget is exhausted, no more retries. The whole Login is never repeated.

For an allowed retry, exponential backoff increases the delay after each failure. Jitter adds a small random change, so Auth 01, Auth 02, and Auth 03 do not retry together.

Now watch User Database. The extra attempts fall. The database is still busy, and some Login requests will still fail. These changes do not create more capacity.

But the retry storm is no longer feeding itself. We've stopped wasting work. Next, we need to control the new requests that keep arriving.$recoveryv5$,
       $slowintake$ElevenLabs v4 Slow Natural documentary intake. Calm senior-architect voice, patient clear English, measured pace and breathing room between explanations, no artificial drama. Use the approved creator voice identity. Keep every spoken word exactly as written. Follow natural punctuation pauses and long paragraph pauses. The voice audio duration controls Remotion timing, never editorial seconds.$slowintake$,
       'MEDIAOS_SYSTEM_SOURCE_IMPORT',
       'EP002_V5_RECOVERY_DIRECTOR_APPROVED_20261109'
WHERE NOT EXISTS(
    SELECT 1 FROM ep002_creative_script_revision existing
    WHERE existing.shot_key='SHOT08'
      AND existing.revision=(SELECT MAX(revision) FROM ep002_creative_script_revision
                             WHERE shot_key='SHOT08')
      AND existing.narration=$recoveryv5$After that retry storm, the database is overloaded. But some of its work is coming from our own repeated attempts.

We still have three Auth servers and one User Database. More Auth servers would not remove this limit. So we control retries first.

Watch Auth 01. A lookup times out. Before trying again, Auth checks the Login deadline. If no useful time remains, it stops.

We also add a retry budget: only a small share of active Logins may retry a safe, read-only lookup. When that budget is exhausted, no more retries. The whole Login is never repeated.

For an allowed retry, exponential backoff increases the delay after each failure. Jitter adds a small random change, so Auth 01, Auth 02, and Auth 03 do not retry together.

Now watch User Database. The extra attempts fall. The database is still busy, and some Login requests will still fail. These changes do not create more capacity.

But the retry storm is no longer feeding itself. We've stopped wasting work. Next, we need to control the new requests that keep arriving.$recoveryv5$
);


INSERT INTO ep002_creative_script_revision
    (id,shot_key,revision,narration,voice_direction,actor_issuer,actor_subject)
SELECT gen_random_uuid(),'SHOT09',
       COALESCE((SELECT MAX(revision) FROM ep002_creative_script_revision
                 WHERE shot_key='SHOT09'),0)+1,
       $recoveryv5$Stopping retries helps, but demand still exceeds capacity. In our example, nine hundred new Login requests arrive each second, while User Database finishes about five hundred account lookups. If all enter, the queue grows again.

So we add admission control to the existing Login path. It is a policy near the Gateway and Auth boundary, not a new server. It decides which requests can reach the costly database work.

Because we have three Auth instances, they must share one budget. Three separate full budgets would overload the same database. Suppose we allow four hundred and fifty total lookup attempts per second, leaving headroom. This is an illustration, not a universal limit.

When demand exceeds that budget, load shedding rejects some Logins early. Those users receive a clear, fast failure instead of a long timeout. Nobody is signed in without an account lookup.

We also limit concurrent lookups, so the existing three connection pools cannot collectively overwhelm the database. This is bounded concurrency. A bulkhead keeps retries from taking resources reserved for new Login lookups.

If database calls keep timing out, a circuit breaker can briefly stop new attempts. It fails those Logins fast, then allows a few test requests before normal traffic resumes.

Here is the trade-off. Some people cannot log in during overload. But the requests we accept have a better chance to finish. The database is not faster; the admitted work now fits its limits.$recoveryv5$,
       $slowintake$ElevenLabs v4 Slow Natural documentary intake. Calm senior-architect voice, patient clear English, measured pace and breathing room between explanations, no artificial drama. Use the approved creator voice identity. Keep every spoken word exactly as written. Follow natural punctuation pauses and long paragraph pauses. The voice audio duration controls Remotion timing, never editorial seconds.$slowintake$,
       'MEDIAOS_SYSTEM_SOURCE_IMPORT',
       'EP002_V5_RECOVERY_DIRECTOR_APPROVED_20261109'
WHERE NOT EXISTS(
    SELECT 1 FROM ep002_creative_script_revision existing
    WHERE existing.shot_key='SHOT09'
      AND existing.revision=(SELECT MAX(revision) FROM ep002_creative_script_revision
                             WHERE shot_key='SHOT09')
      AND existing.narration=$recoveryv5$Stopping retries helps, but demand still exceeds capacity. In our example, nine hundred new Login requests arrive each second, while User Database finishes about five hundred account lookups. If all enter, the queue grows again.

So we add admission control to the existing Login path. It is a policy near the Gateway and Auth boundary, not a new server. It decides which requests can reach the costly database work.

Because we have three Auth instances, they must share one budget. Three separate full budgets would overload the same database. Suppose we allow four hundred and fifty total lookup attempts per second, leaving headroom. This is an illustration, not a universal limit.

When demand exceeds that budget, load shedding rejects some Logins early. Those users receive a clear, fast failure instead of a long timeout. Nobody is signed in without an account lookup.

We also limit concurrent lookups, so the existing three connection pools cannot collectively overwhelm the database. This is bounded concurrency. A bulkhead keeps retries from taking resources reserved for new Login lookups.

If database calls keep timing out, a circuit breaker can briefly stop new attempts. It fails those Logins fast, then allows a few test requests before normal traffic resumes.

Here is the trade-off. Some people cannot log in during overload. But the requests we accept have a better chance to finish. The database is not faster; the admitted work now fits its limits.$recoveryv5$
);


INSERT INTO ep002_creative_script_revision
    (id,shot_key,revision,narration,voice_direction,actor_issuer,actor_subject)
SELECT gen_random_uuid(),'SHOT10',
       COALESCE((SELECT MAX(revision) FROM ep002_creative_script_revision
                 WHERE shot_key='SHOT10'),0)+1,
       $recoveryv5$Look at the User Database again. With duplicate retries limited and new work controlled, its waiting queue finally starts to shrink.

Why? The database can now finish lookups faster than new attempts enter. In our example, it finishes about five hundred per second. The shared budget admits fewer, leaving space to drain the backlog.

Connections are returned to Auth pools sooner. Accepted Logins wait less and finish before their deadlines more often. Database pressure fades from red toward amber, but only when real measurements improve.

Watch the phone carefully. An earlier timed-out Login never comes back to life. That request is over. A different, newly accepted Login can now succeed.

We still need evidence. Measure valid Login success rate, system errors, and latency. A wrong password is not an infrastructure failure. P95 and P99 reveal the slow requests an average can hide. Tracing shows whether time was lost waiting for a connection or inside the database.

Count rejected requests too. Fast failures beat endless timeouts, but are still failures for real people. Recovery means fewer queued lookups and more admitted Logins finishing on time, not merely green Auth servers.$recoveryv5$,
       $slowintake$ElevenLabs v4 Slow Natural documentary intake. Calm senior-architect voice, patient clear English, measured pace and breathing room between explanations, no artificial drama. Use the approved creator voice identity. Keep every spoken word exactly as written. Follow natural punctuation pauses and long paragraph pauses. The voice audio duration controls Remotion timing, never editorial seconds.$slowintake$,
       'MEDIAOS_SYSTEM_SOURCE_IMPORT',
       'EP002_V5_RECOVERY_DIRECTOR_APPROVED_20261109'
WHERE NOT EXISTS(
    SELECT 1 FROM ep002_creative_script_revision existing
    WHERE existing.shot_key='SHOT10'
      AND existing.revision=(SELECT MAX(revision) FROM ep002_creative_script_revision
                             WHERE shot_key='SHOT10')
      AND existing.narration=$recoveryv5$Look at the User Database again. With duplicate retries limited and new work controlled, its waiting queue finally starts to shrink.

Why? The database can now finish lookups faster than new attempts enter. In our example, it finishes about five hundred per second. The shared budget admits fewer, leaving space to drain the backlog.

Connections are returned to Auth pools sooner. Accepted Logins wait less and finish before their deadlines more often. Database pressure fades from red toward amber, but only when real measurements improve.

Watch the phone carefully. An earlier timed-out Login never comes back to life. That request is over. A different, newly accepted Login can now succeed.

We still need evidence. Measure valid Login success rate, system errors, and latency. A wrong password is not an infrastructure failure. P95 and P99 reveal the slow requests an average can hide. Tracing shows whether time was lost waiting for a connection or inside the database.

Count rejected requests too. Fast failures beat endless timeouts, but are still failures for real people. Recovery means fewer queued lookups and more admitted Logins finishing on time, not merely green Auth servers.$recoveryv5$
);


INSERT INTO ep002_creative_script_revision
    (id,shot_key,revision,narration,voice_direction,actor_issuer,actor_subject)
SELECT gen_random_uuid(),'SHOT11',
       COALESCE((SELECT MAX(revision) FROM ep002_creative_script_revision
                 WHERE shot_key='SHOT11'),0)+1,
       $recoveryv5$Look at the full journey: Phone, Gateway, Load Balancer, three Auth servers, one shared User Database.

We did not add servers or make the database faster.

We limited duplicate retries and concurrent lookups, then rejected excess work early. When fewer attempts arrived than the database could finish, the queue began to shrink. More accepted Logins completed on time.

Some users still got a fast failure. That trade-off matters. But the system stopped amplifying its overload.

Here is the lesson: healthy servers do not guarantee a successful Login. Reliability protects the whole user journey.

What if one database is no longer enough? That is our next story.$recoveryv5$,
       $slowintake$ElevenLabs v4 Slow Natural documentary intake. Calm senior-architect voice, patient clear English, measured pace and breathing room between explanations, no artificial drama. Use the approved creator voice identity. Keep every spoken word exactly as written. Follow natural punctuation pauses and long paragraph pauses. The voice audio duration controls Remotion timing, never editorial seconds.$slowintake$,
       'MEDIAOS_SYSTEM_SOURCE_IMPORT',
       'EP002_V5_RECOVERY_DIRECTOR_APPROVED_20261109'
WHERE NOT EXISTS(
    SELECT 1 FROM ep002_creative_script_revision existing
    WHERE existing.shot_key='SHOT11'
      AND existing.revision=(SELECT MAX(revision) FROM ep002_creative_script_revision
                             WHERE shot_key='SHOT11')
      AND existing.narration=$recoveryv5$Look at the full journey: Phone, Gateway, Load Balancer, three Auth servers, one shared User Database.

We did not add servers or make the database faster.

We limited duplicate retries and concurrent lookups, then rejected excess work early. When fewer attempts arrived than the database could finish, the queue began to shrink. More accepted Logins completed on time.

Some users still got a fast failure. That trade-off matters. But the system stopped amplifying its overload.

Here is the lesson: healthy servers do not guarantee a successful Login. Reliability protects the whole user journey.

What if one database is no longer enough? That is our next story.$recoveryv5$
);
