# EP001 Creator Memory Event — SHOT 06 LOCKED

Date: 2026-10-03
Status: LOCKED

SHOT 06 — Load Balancer / Traffic Distribution
Planned range: 05:05–06:25

Canonical narration:

05:05–05:18 — “The request has now passed the API Gateway, but the system still has another choice to make. There may be several copies of the login service available, so something has to decide which one should receive this attempt.”

05:18–05:31 — “That job belongs to the Load Balancer. Its Traffic Distribution rules decide how incoming work is spread across the available destinations instead of sending everything to one place.”

05:31–05:43 — “One part of that decision is the Route Mode — the rule used to distribute traffic. For example, the system may take turns between available destinations or prefer one that currently has more room to accept work.”

05:43–05:53 — “A Hash Key can add consistency when needed. It gives the system a stable value it can use when similar requests should be directed toward the same destination instead of being placed randomly each time.”

05:53–06:05 — “But before choosing anything, the Load Balancer also needs Health Checks. A target marked Healthy is considered ready to receive traffic, while a Timeout can tell us that a target is taking too long to respond and may no longer be a safe choice.”

06:05–06:17 — “Then comes Target Choice. Instance identifies the actual running copy that can take the login, while Zone tells us which part of the infrastructure that instance belongs to.”

06:17–06:25 — “Together, Traffic Distribution answers one practical question: which healthy destination should do the work, and how do we choose it without making one place carry everything?”

This supersedes any earlier draft of SHOT 06.