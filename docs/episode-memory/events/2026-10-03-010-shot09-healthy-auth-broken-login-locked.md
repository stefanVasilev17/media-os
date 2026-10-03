# EP001 Memory Event — SHOT 09 LOCKED

Date: 2026-10-03
Status: LOCKED

SHOT 09 — Healthy Auth Service, Broken Login
Timeline: 09:20–10:55

Canonical narration:

09:20–09:34 — “Now imagine that the Auth Service is working normally. It received the Login Request, created the User Lookup, and is ready to continue as soon as the account information comes back.”

09:34–09:48 — “But this time, the User Database is slow. The Auth Service is not broken. It is simply waiting for a dependency it needs before it can make the next decision.”

09:48–10:00 — “That distinction matters. A service can be completely healthy on its own and still be part of a login journey that feels broken to the person using it.”

10:00–10:13 — “While the User Lookup waits, time keeps passing. The phone still shows a spinner, and the system has less time left to finish the login before that attempt has to be abandoned.”

10:13–10:27 — “The Auth Service is healthy, but Login is still broken. The reason is simple — the user does not experience one service. The user experiences the full chain of things that service depends on.”

10:27–10:40 — “If the User Database finally answers in time, the journey can continue. But if the wait becomes too long, the Auth Service can no longer safely keep this attempt open forever.”

10:40–10:49 — “At that point, the successful path stops and the system prepares a Failure Response instead — a result that tells the client this login attempt did not complete successfully.”

10:49–10:55 — “So a green service does not prove a healthy login. End-to-end health depends on every critical dependency returning what the journey needs, in time.”

Global narration rule reinforced: never say phrases such as “this is the first/second/third AHA moment” inside narration. AHA structure is a production/editorial concept, not spoken copy.
