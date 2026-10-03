# EP001 Creator Correction — Cover All Secondary Cards Above Main Path

Date: 2026-10-03
Status: ACTIVE

The creator requires the narration to pass through all secondary cards shown above the main Spline path, not only the main nodes.

## Rule

For each main object on the Spline path, the script must also cover the secondary card associated with that part of the journey. The narration should explain in plain language:
- what information that secondary card contains or represents;
- why that information is useful;
- how it helps the current main object make the next decision or move the login journey forward.

The exact technical label visible in the Spline diagram should be spoken at least once when that secondary card becomes the active focus, but the explanation must remain purpose-first and easy to understand.

## Current top-row secondary cards visible in the canonical Spline diagram

- Login Intent
- Headers
- DNS Resolution
- Routing
- Traffic Distribution
- Validation Steps
- User Data
- Session Creation
- Route Decision

These should be introduced in causal order as the main path advances. They must not be dumped as a glossary. Each appears when its connected main object becomes active.

## Language strategy

Pattern: simple explanation -> exact card/object name -> what information it carries -> how that information helps the next decision.

Avoid unnecessary protocol/framework jargon. The senior value comes from understanding responsibility, information flow, decision-making, dependencies, trust, and failure consequences.

Failure/recovery secondary objects below the main path remain governed by the separate failure-path rules and will be covered when the story reaches the failure section.
