# EP001 Memory Event — SHOT 04 DNS Resolution / Network Transit LOCKED

Date: 2026-10-03
Episode: EP001 — What Really Happens When You Click Login?
Status: LOCKED

The creator explicitly approved and LOCKED SHOT 04 covering `02:38–03:45`.

## Canonical narration

`02:38–02:50` — "Now the prepared login can finally leave the phone. But before it can reach the backend, the system first needs to answer a very practical question: where should this message actually be sent?"

`02:50–03:04` — "That is where DNS Resolution helps. The app usually knows a service by a readable name, but the network needs a concrete destination. Resolve turns that name into the address the request can actually travel toward."

`03:04–03:14` — "If that answer was already found recently, Cache can reuse it instead of looking it up again. That saves a small amount of time before the login even begins crossing the network."

`03:14–03:27` — "Once the destination is known, the request moves through Network / Transit. And this part of the journey has its own information: Network Latency tells us how much delay the trip is adding."

`03:27–03:38` — "One useful measure is RTT — round-trip time — how long it takes for information to travel out and for an answer to come back. Jitter tells us whether that delay stays consistent or keeps changing from one moment to the next."

`03:38–03:45` — "So even before the login reaches the backend, we already know two important things: where it is going, and how healthy the journey toward that destination looks."

Future script work continues from `03:45` and must preserve the global explanation standard: simple meaning -> exact diagram term -> contained information -> concrete example -> why it matters -> compact mental-model synthesis.