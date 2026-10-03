# EP001 Creator Strategy Correction — Name the Active Diagram Object

Date: 2026-10-03
Status: ACTIVE
Episode: EP001 — What Really Happens When You Click Login?

The creator refined the narration strategy.

## New narration rule

Narration should remain simple, human, and low-jargon, but when a Spline diagram object is currently active and the narration is explaining its role, the script should explicitly mention that object's visible diagram name at least once.

The purpose should normally be explained first in plain language, then the diagram term should be introduced so the viewer can connect what they hear to what they see.

Preferred pattern:

`plain-language purpose -> exact visible object name -> continue in simple language`

Examples:
- Explain that the first entry point recognizes the kind of action and sends it toward the right internal path, then identify it as the `API Gateway`.
- Explain that the system chooses an available place that can take the work, then identify that role as the `Load Balancer`.
- Explain that the part responsible for deciding whether the login can be accepted is the `Auth Service`.
- Explain that account information is fetched from the `User Database`.
- Explain that the successful login becomes reusable trusted state, then identify the visible object as `Authentication State` / `Session-Token Boundary` when appropriate to the current map.

Secondary objects follow the same pattern when they are actively shown:
- `Rate Limiter` -> may slow repeated attempts.
- `Risk` -> may notice unusual behavior.
- `MFA` -> may ask for one more proof.
- `Audit Log`, `Logging`, `Monitoring` -> keep or expose information that helps understand what happened.
- Failure-region objects such as `Account Status`, `Invalid Token`, `Access Denied`, `Expired Session`, `Session Restore Flow`, and `Failure Response` should be named when their object is actively in focus, while their explanation remains plain-language and story-first.

## Constraints

- Do not turn narration into a glossary or technology catalog.
- Do not lead with the technical term when a plain-language explanation can establish meaning first.
- Mention the active object name enough to connect narration to the diagram, usually once at first introduction; after that, simpler references are preferred unless the name is needed for clarity.
- Preserve the previously locked rule: senior reasoning, simple language.
- Preserve the repetition constraint: no more than three consecutive rhetorical repetitions, and prefer fewer when possible.

## Script impact

The full narration draft after `02:25` must be revised to follow this active-object naming strategy before approval. The locked `00:00–02:25` narration remains locked unless the creator explicitly chooses to revise it later.
